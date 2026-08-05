import { createHash } from "crypto";

export function hashToken(token: string, secret: string) {
  return (
    createHash("sha256")
      .update(`${token}${secret}`)
      .digest("hex")
  );
}
