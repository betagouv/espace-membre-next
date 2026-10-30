import { v4 as uuidv4 } from "uuid";

// refusals caused by the address of the open ProConnect session : unless it is
// closed, ProConnect logs the person in again with the same one
export const PROCONNECT_REFUSALS = [
  "UnknownMember",
  "SecondaryEmailNotAllowed",
  "ExtEmailNotAllowed",
  "MfaRequired",
];

// https://partenaires.proconnect.gouv.fr/docs/fournisseur-service/implementation_technique#241-d%C3%A9connexion-aupr%C3%A8s-de-proconnect
// post_logout_redirect_uri must be the one declared at ProConnect
export const getProConnectLogoutUrl = ({
  idToken,
  state = uuidv4(),
}: {
  idToken: string | null | undefined;
  state?: string;
}) => {
  const params = new URLSearchParams({
    id_token_hint: idToken ?? "",
    state,
    post_logout_redirect_uri: `${process.env.NEXT_PUBLIC_APP_BASE_URL || ""}/login`,
  });
  return `${process.env.NEXT_PUBLIC_PRO_CONNECT_BASE_URL}/api/v2/session/end?${params}`;
};

// the refusal travels in the state ProConnect sends back to /login
export const getRefusalLogoutUrl = (code: string, idToken: string) =>
  getProConnectLogoutUrl({ idToken, state: `${code}-${uuidv4()}` });

export const getRefusalFromLogoutState = (state: string | null | undefined) =>
  PROCONNECT_REFUSALS.find((code) => state?.startsWith(`${code}-`)) ?? null;
