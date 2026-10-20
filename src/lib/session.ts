import jwt from "jsonwebtoken";

import config from "@/lib/config";

export const getToken = (req) => {
  if (req.cookies) {
    return (
      req.cookies["next-auth.session-token"] ||
      req.cookies["__Secure-next-auth.session-token"]
    );
  }
  return null;
};

// a ProConnect address stays valid after the member's mailbox is disabled :
// leaving members lose access through the mission expiry check, which only
// runs at login. A short session bounds how long they keep it.
export const SESSION_MAX_AGE_SECONDS = 24 * 3600;

const nowInSeconds = () => Math.floor(Date.now() / 1000);

// next-auth re-encodes the token on every /api/auth/session call (each page
// load or tab focus) : the expiry is anchored to the login time (loginAt),
// otherwise an active session would slide forever without a new login.
export const getSessionExpiry = (loginAt: number) =>
  loginAt + SESSION_MAX_AGE_SECONDS;

export const isSessionLoginExpired = (loginAt: unknown) =>
  typeof loginAt !== "number" || getSessionExpiry(loginAt) <= nowInSeconds();

export const getJwtTokenForUser = (token) => {
  const { exp, iat, jti, ...payload } = token;
  const loginAt =
    typeof payload.loginAt === "number" ? payload.loginAt : nowInSeconds();
  return jwt.sign({ ...payload, loginAt }, config.secret, {
    algorithm: "HS512",
    expiresIn: Math.max(1, getSessionExpiry(loginAt) - nowInSeconds()),
  });
};
