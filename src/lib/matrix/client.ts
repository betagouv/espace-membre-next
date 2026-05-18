import crypto from "crypto";
import axios from "axios";
import config from "@/server/config";

const BATCH_SIZE = 50;

function hashEmail(email: string, pepper: string): string {
  const input = `${email.toLowerCase()} email ${pepper}`;
  return crypto
    .createHash("sha256")
    .update(input)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getIdentityToken(): Promise<string | undefined> {
  if (!config.matrix_token || !config.matrix_user_id) {
    return undefined;
  }
  const openidUrl = `${config.matrix_identity_url}/_matrix/client/v3/user/${encodeURIComponent(config.matrix_user_id)}/openid/request_token`;
  const { data: openidData } = await axios.post(
    openidUrl,
    {},
    { headers: { Authorization: `Bearer ${config.matrix_token}` } },
  );
  const registerUrl = `${config.matrix_identity_url}/_matrix/identity/v2/account/register`;
  const { data: registerData } = await axios.post(registerUrl, openidData);
  return registerData.access_token;
}

async function getHashDetails(
  identityToken: string | undefined,
): Promise<{ pepper: string }> {
  const url = `${config.matrix_identity_url}/_matrix/identity/v2/hash_details`;
  const headers = identityToken
    ? { Authorization: `Bearer ${identityToken}` }
    : {};
  const { data } = await axios.get(url, { headers });
  return { pepper: data.lookup_pepper };
}

async function lookupBatch(
  hashes: string[],
  pepper: string,
  identityToken: string | undefined,
): Promise<Record<string, string>> {
  const url = `${config.matrix_identity_url}/_matrix/identity/v2/lookup`;
  const headers = identityToken
    ? { Authorization: `Bearer ${identityToken}` }
    : {};
  const { data } = await axios.post(
    url,
    { algorithm: "sha256", pepper, addresses: hashes },
    { headers },
  );
  return data.mappings || {};
}

export async function lookupMatrixIdsByEmails(
  emails: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (!config.matrix_identity_url || emails.length === 0) return result;

  const identityToken = await getIdentityToken();
  const { pepper } = await getHashDetails(identityToken);
  const hashToEmail = new Map<string, string>();
  for (const email of emails) {
    hashToEmail.set(hashEmail(email, pepper), email);
  }

  const hashes = [...hashToEmail.keys()];
  for (let i = 0; i < hashes.length; i += BATCH_SIZE) {
    const batch = hashes.slice(i, i + BATCH_SIZE);
    const mappings = await lookupBatch(batch, pepper, identityToken);
    for (const [hash, matrixId] of Object.entries(mappings)) {
      const email = hashToEmail.get(hash);
      if (email) result.set(email, matrixId);
    }
  }

  return result;
}
