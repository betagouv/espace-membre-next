import jwt from "jsonwebtoken";

import config from "@/server/config";

export const getToken = (req) => {
  if (req.cookies) {
    return (
      req.cookies["next-auth.session-token"] ||
      req.cookies["__Secure-next-auth.session-token"]
    );
  }
  return null;
};

export const getJwtTokenForUser = (token) => {
  const { exp, iat, jti, ...payload } = token;
  return jwt.sign(payload, config.secret, {
    algorithm: "HS512",
    expiresIn: "7 days",
  });
};
