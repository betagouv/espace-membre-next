import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

class FakeNoSuchKey extends Error {
  constructor() {
    super("NoSuchKey");
    this.name = "NoSuchKey";
  }
}

interface FakeSendResult {
  Body?: { transformToByteArray: () => Promise<Uint8Array> };
}

describe("s3 client (migrated to @aws-sdk/client-s3)", () => {
  let sendStub: sinon.SinonStub;
  let getSignedUrlStub: sinon.SinonStub;
  let capturedCommands: unknown[];
  let mod: {
    getImageContent: (key: string) => Promise<Uint8Array | undefined>;
    hasImage: (key: string) => Promise<boolean>;
    deleteImage: (key: string) => Promise<void>;
    getPutSignedUrl: (
      key: string,
      options: { contentType: string; expiresIn?: number },
    ) => Promise<string>;
    getAvatarUrl: (username: string) => Promise<string | undefined>;
    isS3Available: () => boolean;
  };

  function loadModule() {
    capturedCommands = [];
    const S3Client = class {
      send = sendStub;
    };
    const commandClass = function (this: unknown, args: unknown) {
      capturedCommands.push(args);
    } as unknown as new (args: unknown) => unknown;

    return proxyquire("./s3", {
      "@/lib/config": {
        default: {
          S3_HOST: "https://s3.example.com",
          S3_REGION: "fr-par",
          S3_KEY_ID: "test-key",
          S3_KEY_SECRET: "test-secret",
          S3_BUCKET: "test-bucket",
        },
        __esModule: true,
        "@noCallThru": true,
      },
      "@aws-sdk/client-s3": {
        S3Client,
        GetObjectCommand: commandClass,
        DeleteObjectCommand: commandClass,
        PutObjectCommand: commandClass,
        NoSuchKey: FakeNoSuchKey,
        __esModule: true,
        "@noCallThru": true,
      },
      "@aws-sdk/s3-request-presigner": {
        getSignedUrl: getSignedUrlStub,
        __esModule: true,
        "@noCallThru": true,
      },
    });
  }

  beforeEach(() => {
    sendStub = sinon.stub();
    getSignedUrlStub = sinon.stub();
    mod = loadModule();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("getImageContent", () => {
    it("returns the object body as a byte array", async () => {
      const body = new Uint8Array([1, 2, 3]);
      sendStub.resolves({ Body: { transformToByteArray: async () => body } });
      const result = await mod.getImageContent("members/ada/avatar.jpg");
      expect(result).to.deep.equal(body);
    });

    it("sends a GetObjectCommand with the configured bucket and key", async () => {
      sendStub.resolves({
        Body: { transformToByteArray: async () => new Uint8Array() },
      });
      await mod.getImageContent("members/ada/avatar.jpg");
      expect(capturedCommands[0]).to.deep.equal({
        Bucket: "test-bucket",
        Key: "members/ada/avatar.jpg",
      });
    });

    it("returns undefined when the key does not exist (NoSuchKey)", async () => {
      sendStub.rejects(new FakeNoSuchKey());
      const result = await mod.getImageContent("unknown.jpg");
      expect(result).to.equal(undefined);
    });

    it("propagates other errors", async () => {
      const error = new Error("boom");
      sendStub.rejects(error);
      let caught: unknown;
      try {
        await mod.getImageContent("unknown.jpg");
      } catch (e) {
        caught = e;
      }
      expect(caught).to.equal(error);
    });

    it("returns undefined when the object has no body", async () => {
      sendStub.resolves({});
      const result = await mod.getImageContent("empty.jpg");
      expect(result).to.equal(undefined);
    });
  });

  describe("hasImage", () => {
    it("returns true when the key exists", async () => {
      sendStub.resolves({
        Body: { transformToByteArray: async () => new Uint8Array([1]) },
      });
      expect(await mod.hasImage("members/ada/avatar.jpg")).to.equal(true);
    });

    it("returns false when the key does not exist", async () => {
      sendStub.rejects(new FakeNoSuchKey());
      expect(await mod.hasImage("members/ada/avatar.jpg")).to.equal(false);
    });

    it("returns false on any error", async () => {
      sendStub.rejects(new Error("boom"));
      expect(await mod.hasImage("members/ada/avatar.jpg")).to.equal(false);
    });
  });

  describe("deleteImage", () => {
    it("sends a DeleteObjectCommand with the configured bucket and key", async () => {
      sendStub.resolves({});
      await mod.deleteImage("members/ada/avatar.jpg");
      expect(capturedCommands[0]).to.deep.equal({
        Bucket: "test-bucket",
        Key: "members/ada/avatar.jpg",
      });
    });
  });

  describe("getPutSignedUrl", () => {
    it("returns the pre-signed URL produced by the presigner", async () => {
      getSignedUrlStub.resolves("https://signed-url.example.com/put");
      const url = await mod.getPutSignedUrl("members/ada/avatar.jpg", {
        contentType: "image/jpeg",
      });
      expect(url).to.equal("https://signed-url.example.com/put");
    });

    it("signs a PutObjectCommand with bucket, key and content type", async () => {
      getSignedUrlStub.resolves("signed");
      await mod.getPutSignedUrl("members/ada/avatar.jpg", {
        contentType: "image/png",
      });
      expect(capturedCommands[0]).to.deep.equal({
        Bucket: "test-bucket",
        Key: "members/ada/avatar.jpg",
        ContentType: "image/png",
      });
      expect(getSignedUrlStub.calledOnce).to.equal(true);
    });
  });

  describe("getAvatarUrl", () => {
    it("returns the member avatar API url when the image exists", async () => {
      sendStub.resolves({
        Body: { transformToByteArray: async () => new Uint8Array([1]) },
      });
      const url = await mod.getAvatarUrl("ada");
      expect(url).to.equal("/api/member/ada/image");
    });

    it("returns undefined when the image does not exist", async () => {
      sendStub.rejects(new FakeNoSuchKey());
      const url = await mod.getAvatarUrl("ada");
      expect(url).to.equal(undefined);
    });
  });
});
