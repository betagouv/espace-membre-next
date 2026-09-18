import { expect } from "chai";

import { buildOpenApiDocument } from "@/lib/openapi";
import { API_SCOPES } from "@/models/api/scope";

type Operation = {
  operationId?: string;
  security?: unknown[];
  responses: Record<string, unknown>;
  "x-required-scopes"?: string[];
};

describe("api openapi document", () => {
  const document = buildOpenApiDocument() as unknown as {
    openapi: string;
    servers?: { url: string }[];
    paths: Record<string, Record<string, Operation>>;
  };

  const operations = Object.entries(document.paths).flatMap(([path, item]) =>
    Object.entries(item).map(([method, operation]) => ({
      path,
      method,
      operation,
    })),
  );

  it("is an OpenAPI 3.1 document with a non empty servers list", () => {
    expect(document.openapi).to.equal("3.1.0");
    expect(document.servers).to.be.an("array").that.is.not.empty;
    expect(document.servers![0].url).to.be.a("string").that.is.not.empty;
  });

  it("declares the fifteen operations of the plan", () => {
    expect(operations).to.have.length(15);
  });

  it("gives every operation a unique operationId", () => {
    const ids = operations.map(({ operation }) => operation.operationId);
    expect(ids.every(Boolean), "un operationId est absent").to.be.true;
    expect(new Set(ids).size).to.equal(ids.length);
  });

  it("gives every authenticated operation a non empty x-required-scopes taken from the closed enum", () => {
    const authenticated = operations.filter(
      ({ operation }) => operation.security === undefined,
    );
    expect(authenticated).to.have.length(13);

    for (const { path, method, operation } of authenticated) {
      const scopes = operation["x-required-scopes"];
      expect(scopes, `${method} ${path}`).to.be.an("array").that.is.not.empty;
      for (const scope of scopes!) {
        expect(API_SCOPES as readonly string[], `${method} ${path}`).to.include(
          scope,
        );
      }
    }
  });

  it("declares at least 401, 403 and 422 on every authenticated operation", () => {
    for (const { path, method, operation } of operations.filter(
      ({ operation }) => operation.security === undefined,
    )) {
      for (const code of ["401", "403", "422"]) {
        expect(
          Object.keys(operation.responses),
          `${method} ${path} sans ${code}`,
        ).to.include(code);
      }
    }
  });

  // La spec et la page de doc sont publiques : ni 401, ni 403, ni 422, ni 503
  // ne peuvent en sortir.
  it("keeps the two public operations free of authentication errors", () => {
    const publicOnes = operations.filter(
      ({ operation }) => operation.security !== undefined,
    );
    expect(publicOnes.map(({ operation }) => operation.operationId).sort()).to.
      deep.equal(["getApiDocs", "getOpenApiDocument"]);

    for (const { operation } of publicOnes) {
      expect(operation.security).to.deep.equal([]);
      expect(operation["x-required-scopes"]).to.be.undefined;
      for (const code of ["401", "403", "422", "503"]) {
        expect(Object.keys(operation.responses)).to.not.include(code);
      }
      expect(Object.keys(operation.responses)).to.include("405");
    }
  });

  it("covers the four writes", () => {
    const writes = operations
      .filter(({ method }) => method === "patch" || method === "put")
      .map(({ operation }) => operation.operationId)
      .sort();
    expect(writes).to.deep.equal([
      "patchIncubator",
      "patchStartup",
      "patchStartupStandards",
      "replaceStartupStandards",
    ]);
  });
});
