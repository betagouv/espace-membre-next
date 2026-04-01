import { S3, Endpoint } from "aws-sdk";

import config from "@/server/config";

let s3;
if (process.env.NODE_ENV === "test" || process.env.CI) {
  const getSignedUrlPromise = function (
    method: string,
    params: { Key: string; Body: any },
  ) {
    return true;
  };
  const getObject = function (params: { Key: string }) {
    return { promise: () => Promise.resolve({ Body: "" }) };
  };

  const deleteObject = function (params: { Key: string }) {};
  s3 = {
    getSignedUrlPromise,
    getObject,
    deleteObject,
  };
} else {
  try {
    s3 = new S3({
      accessKeyId: config.S3_KEY_ID,
      secretAccessKey: config.S3_KEY_SECRET,
      region: config.S3_REGION,
      endpoint: new Endpoint(config.S3_HOST!),
      params: {
        Bucket: config.S3_BUCKET,
      },
    });
  } catch {
    console.error("there is no S3");
  }
}

export const getAvatarUrl = async (username: string) => {
  const s3Key = `members/${username}/avatar.jpg`;
  try {
    let hasImage = await s3
      .getObject({
        Key: s3Key,
      })
      .promise()
      .then(() => true)
      .catch(() => false);

    const image = hasImage ? `/api/member/${username}/image` : undefined;
    return image;
  } catch {
    return undefined; //"/static/images/ada.jpg";
  }
};

export default s3;
