import { randomBytes } from "crypto";

import { API_KEY_PREFIX } from "@/lib/api/bearer";
import { hashToken } from "@/lib/auth/hashToken";
import config from "@/lib/config";

const SECRET_BYTES = 32; // base64url -> 43 caracteres, alphabet [A-Za-z0-9_-]
const PREFIX_VISIBLE_CHARS = 8;

export function hashApiKeyToken(token: string) {
  return hashToken(token, config.secret);
}

export function generateApiKeyToken() {
  const token = `${API_KEY_PREFIX}${randomBytes(SECRET_BYTES).toString("base64url")}`;
  return {
    token,
    tokenHash: hashApiKeyToken(token),
    tokenPrefix: token.slice(0, API_KEY_PREFIX.length + PREFIX_VISIBLE_CHARS),
  };
}
