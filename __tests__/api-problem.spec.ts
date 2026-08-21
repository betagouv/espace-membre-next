import { expect } from "chai";
import { z } from "zod";

import {
  invalidRequest,
  methodNotAllowed,
  PROBLEM_MEDIA_TYPE,
  problem,
  unsupportedMediaType,
} from "@/lib/api/problem";
import { problemSchema } from "@/models/api/problem";

describe("api problem (RFC 9457)", () => {
  it("serves application/problem+json with type, title and status", async () => {
    const res = problem("not_found", { instance: "/api/v1/startups/x" });
    expect(res.status).to.equal(404);
    expect(res.headers.get("content-type")).to.equal(PROBLEM_MEDIA_TYPE);

    const body = await res.json();
    expect(problemSchema.safeParse(body).success).to.be.true;
    expect(body.type).to.match(/\/problems\/not-found$/);
    expect(body.instance).to.equal("/api/v1/startups/x");
  });

  it("maps every type to its status", () => {
    expect(problem("unauthorized").status).to.equal(401);
    expect(problem("auth_disabled").status).to.equal(503);
    expect(problem("insufficient_scope").status).to.equal(403);
    expect(problem("out_of_perimeter").status).to.equal(403);
    expect(problem("method_not_allowed").status).to.equal(405);
    expect(problem("conflict").status).to.equal(409);
    expect(problem("unsupported_media_type").status).to.equal(415);
    expect(problem("invalid_request").status).to.equal(422);
    expect(problem("internal_error").status).to.equal(500);
  });

  // Le type est en snake_case dans le code et en kebab-case dans l'URI publique.
  it("exposes kebab-case type URIs", async () => {
    const body = await problem("out_of_perimeter").json();
    expect(body.type).to.match(/\/problems\/out-of-perimeter$/);
  });

  it("adds the errors extension on 422, with JSON pointers", async () => {
    const schema = z.object({ name: z.string().min(3) });
    const parsed = schema.safeParse({ name: "x" });
    expect(parsed.success).to.be.false;

    const res = invalidRequest(parsed.error!, { instance: "/api/v1/x" });
    expect(res.status).to.equal(422);
    const body = await res.json();
    expect(body.errors).to.be.an("array").with.length(1);
    expect(body.errors[0].pointer).to.equal("/name");
    expect(problemSchema.safeParse(body).success).to.be.true;
  });

  it("advertises the accepted media types on a 415", async () => {
    const res = unsupportedMediaType(["application/merge-patch+json"]);
    expect(res.status).to.equal(415);
    expect(res.headers.get("accept")).to.equal("application/merge-patch+json");
  });

  it("answers 405 in problem+json with an Allow header", async () => {
    const handler = methodNotAllowed(["GET", "PATCH"]);
    const res = await handler(new Request("http://localhost/api/v1/startups"));
    expect(res.status).to.equal(405);
    expect(res.headers.get("allow")).to.equal("GET, PATCH");
    expect(res.headers.get("content-type")).to.equal(PROBLEM_MEDIA_TYPE);
  });
});
