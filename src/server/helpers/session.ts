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
  return jwt.sign(token, config.secret, {
    algorithm: "HS512", // Assurez-vous que l'algorithme correspond à celui utilisé pour signer le token
    // expiresIn: "7 days",
  });
};
