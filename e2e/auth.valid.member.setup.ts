import { test as setup, expect } from "@playwright/test";
import jwt from "jsonwebtoken";
import { Client } from "pg";

const validMemberFile = "./playwright-auth-valid.member.json";
const username = "valid.member";

// login is ProConnect only (no magic link) : e2e tests authenticate by creating
// the same session cookie the app issues after a ProConnect login
// (see getJwtTokenForUser in src/lib/session.ts), signed with SESSION_SECRET.
setup(
  "authenticate as valid.member with a session cookie",
  async ({ page, baseURL }) => {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      throw new Error("SESSION_SECRET is required to run e2e tests");
    }
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const { rows } = await client.query(
      "SELECT uuid, fullname FROM users WHERE username = $1",
      [username],
    );
    await client.end();
    if (!rows.length) {
      throw new Error(`${username} not found : run npm run seed first`);
    }

    const token = jwt.sign(
      {
        sub: username,
        id: username,
        uuid: rows[0].uuid,
        name: rows[0].fullname,
        provider: "proconnect",
      },
      secret,
      { algorithm: "HS512", expiresIn: "1 day" },
    );
    const url = new URL(baseURL || "http://localhost:8100");
    await page.context().addCookies([
      {
        name: "next-auth.session-token",
        value: token,
        domain: url.hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/dashboard");
    await expect(
      page.getByText("Gérer mon compte", { exact: true }).first(),
    ).toBeVisible();

    await page.context().storageState({ path: validMemberFile });
  },
);
