import { expect } from "chai";
import { NextRequest } from "next/server";

import { middleware } from "@/middleware";

const call = async (
  path: string,
  init?: { method?: string; headers?: Record<string, string> },
) => {
  const response = await middleware(
    new NextRequest(`https://espace-membre.beta.gouv.fr${path}`, init),
  );
  return response!;
};

describe("middleware : ancienne API /api/protected", () => {
  it("repond 410 en problem+json en orientant vers /api/v1", async () => {
    const response = await call("/api/protected/members", {
      headers: { "X-API-KEY": "ancienne-clef" },
    });

    expect(response.status).to.equal(410);
    expect(response.headers.get("content-type")).to.equal(
      "application/problem+json",
    );
    const body = await response.json();
    expect(body.type).to.match(/\/problems\/gone$/);
    expect(body.instance).to.equal("/api/protected/members");
    expect(body.detail).to.include("/api/v1");
    expect(body.detail).to.include("Authorization: Bearer em1_");
  });

  it("couvre la racine, mais pas un chemin voisin", async () => {
    expect((await call("/api/protected")).status).to.equal(410);
    expect((await call("/api/protected-autre")).status).to.equal(401);
  });

  it("repond au preflight CORS, pour qu'un navigateur puisse lire le 410", async () => {
    const preflight = await call("/api/protected/members", {
      method: "OPTIONS",
      headers: { origin: "https://app.beta.gouv.fr" },
    });
    expect(preflight.status).to.equal(204);
    expect(preflight.headers.get("access-control-allow-origin")).to.equal(
      "https://app.beta.gouv.fr",
    );

    const response = await call("/api/protected/members", {
      headers: { origin: "https://app.beta.gouv.fr" },
    });
    expect(response.status).to.equal(410);
    expect(response.headers.get("access-control-allow-origin")).to.equal(
      "https://app.beta.gouv.fr",
    );
  });

  it("laisse /api/v1 repondre 401 sur un jeton absent", async () => {
    const response = await call("/api/v1/members");
    expect(response.status).to.equal(401);
    expect((await response.json()).type).to.match(/\/problems\/unauthorized$/);
  });
});
