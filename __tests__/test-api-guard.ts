import fs from "fs";
import path from "path";

import { expect } from "chai";

/**
 * Analyse statique, sur le patron de a11y-label-has-associated-control.spec.ts :
 * aucune route de src/app/api/v1 ne peut exporter une methode HTTP sans passer
 * par withApiV1, publicApiV1 ou methodNotAllowed.
 */
const API_V1_DIR = path.join(process.cwd(), "src/app/api/v1");
const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];
const WRAPPERS = ["withApiV1", "publicApiV1", "methodNotAllowed"];

function listRouteFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listRouteFiles(full);
    return entry.name === "route.ts" ? [full] : [];
  });
}

/**
 * Rend la liste des methodes exportees sans wrapper. Les deux formes sont
 * couvertes : `export const GET =` et `export function GET`. La seconde est
 * l'exception dans ce depot, mais la garde doit tenir sur du code futur.
 */
export function unwrappedMethods(source: string): string[] {
  const offenders: string[] = [];
  for (const method of HTTP_METHODS) {
    const constForm = new RegExp(
      `export\\s+const\\s+${method}\\s*(?::[^=]+)?=\\s*([\\s\\S]{0,200})`,
    ).exec(source);
    if (constForm) {
      const assigned = constForm[1];
      if (!WRAPPERS.some((wrapper) => assigned.includes(wrapper))) {
        offenders.push(method);
      }
      continue;
    }
    if (
      new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\s*\\(`).test(
        source,
      )
    ) {
      // Une declaration de fonction ne peut pas passer par un wrapper.
      offenders.push(method);
    }
  }
  return offenders;
}

describe("api v1 guard", () => {
  const routeFiles = listRouteFiles(API_V1_DIR);

  it("finds every route file", () => {
    expect(routeFiles.length).to.be.greaterThan(0);
  });

  it("never exports an HTTP method outside withApiV1", () => {
    const offenders = routeFiles
      .map((file) => ({
        file: path.relative(process.cwd(), file),
        methods: unwrappedMethods(fs.readFileSync(file, "utf-8")),
      }))
      .filter((entry) => entry.methods.length);

    expect(
      offenders,
      `Routes exportant une methode HTTP sans wrapper : ${JSON.stringify(
        offenders,
      )}`,
    ).to.deep.equal([]);
  });

  // La garde doit echouer sur une route fautive, sinon elle ne garde rien.
  it("fails on a route that exports a method without the wrapper", () => {
    expect(
      unwrappedMethods(`export const GET = async (req) => Response.json({});`),
    ).to.deep.equal(["GET"]);
    expect(
      unwrappedMethods(`export async function GET(req) { return null; }`),
    ).to.deep.equal(["GET"]);
    expect(
      unwrappedMethods(
        `export const GET = withApiV1({ scope: "members:read" }, async () => new Response());`,
      ),
    ).to.deep.equal([]);
    expect(
      unwrappedMethods(`export const POST = methodNotAllowed(["GET"]);`),
    ).to.deep.equal([]);
  });

  it("never reads the session from a route: that would be an authentication confusion", () => {
    for (const file of routeFiles) {
      const source = fs.readFileSync(file, "utf-8");
      expect(
        source.includes("getServerSession"),
        `${path.relative(process.cwd(), file)} lit la session`,
      ).to.be.false;
    }
  });

  it("keeps the /api/v1 branch before verifyAuth in the middleware", () => {
    const middleware = fs.readFileSync(
      path.join(process.cwd(), "src/middleware.ts"),
      "utf-8",
    );
    const branch = middleware.indexOf('"/api/v1/"');
    const verify = middleware.indexOf("await verifyAuth(req)");
    expect(branch, "la branche /api/v1/ est absente").to.be.greaterThan(-1);
    expect(verify, "verifyAuth est absent").to.be.greaterThan(-1);
    expect(branch).to.be.lessThan(verify);

    // Le config.matcher ne doit pas exclure /api/v1, sinon le CORS disparait.
    const matcher = /matcher:\s*\[([\s\S]*?)\]/.exec(middleware);
    expect(matcher, "config.matcher introuvable").to.not.be.null;
    expect(matcher![1]).to.not.include("api/v1");
  });
});
