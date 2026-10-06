import jwt from "jsonwebtoken";

// ProConnect double authentication (MFA)
// https://partenaires.proconnect.gouv.fr/docs/fournisseur-service/double_authentification
//
// eidas levels that imply a second factor. When the identity provider cannot
// do MFA itself, ProConnect takes over with an email OTP (acr eidas1-mfa).
export const PROCONNECT_MFA_ACR_VALUES = [
  "eidas0-mfa",
  "eidas1-mfa",
  "eidas2",
  "eidas3",
];

// value of the `claims` parameter sent to the authorization endpoint : asks
// for one of the MFA levels as an essential claim of the id_token
export const proConnectAcrClaims = () =>
  JSON.stringify({
    id_token: {
      acr: {
        essential: true,
        values: PROCONNECT_MFA_ACR_VALUES,
      },
    },
  });

// asking is not enough : the acr actually granted must be read back from the
// id_token returned by the token endpoint. The id_token given here has already
// been validated by next-auth (signature, issuer, audience, nonce), so it is
// only decoded.
export const hasRequiredProConnectAcr = (
  idToken: string | null | undefined,
) => {
  if (!idToken) {
    return false;
  }
  const payload = jwt.decode(idToken);
  if (!payload || typeof payload === "string") {
    return false;
  }
  return (
    typeof payload.acr === "string" &&
    PROCONNECT_MFA_ACR_VALUES.includes(payload.acr)
  );
};
