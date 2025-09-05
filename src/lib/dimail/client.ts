import axios from "axios";

const DIMAIL_API_URL =
  process.env.DIMAIL_API_URL || "https://api.ovhprod.dimail1.numerique.gouv.fr";

const DIMAIL_API_USERNAME = process.env.DIMAIL_API_USERNAME;
const DIMAIL_API_PASSWORD = process.env.DIMAIL_API_PASSWORD;

if (!DIMAIL_API_USERNAME || !DIMAIL_API_PASSWORD) {
  console.error(
    "Les identifiants Basic Auth Dimail (DIMAIL_API_USERNAME/DIMAIL_API_PASSWORD) sont manquants.",
  );
}

/*const DIMAIL_API_TOKEN = process.env.DIMAIL_API_TOKEN;
if (!DIMAIL_API_TOKEN) {
  throw new Error('Le token API Dimail (DIMAIL_API_TOKEN) est manquant.');
}*/

const client = axios.create({
  baseURL: DIMAIL_API_URL,
  headers: {
    Authorization:
      "Basic " +
      Buffer.from(`${DIMAIL_API_USERNAME}:${DIMAIL_API_PASSWORD}`).toString(
        "base64",
      ),
    "Content-Type": "application/json",
  },
});

export interface DimailEmailParams {
  user_name: string;
  domain: string;
  displayName?: string;
}

export type DimailMailboxResult = {
  email: string;
  password: string;
};

/**
 * Crée une boîte mail
 * POST /domains/{domain_name}/mailboxes/{user_name}
 * Retourne { email, password }
 */
export async function createMailbox({
  domain,
  user_name,
  displayName,
}: DimailEmailParams): Promise<DimailMailboxResult> {
  const payload = { ...(displayName && { displayName }) };
  const res = await client.post<DimailMailboxResult>(
    `/domains/${encodeURIComponent(domain)}/mailboxes/${encodeURIComponent(user_name)}`,
    payload,
  );
  return res.data;
}

/**
 * reset le mot de passe d'une adresse email
 * POST /domains/{domain_name}/mailboxes/{user_name}/reset-password
 */
export async function resetPassword({
  domain,
  user_name,
}: DimailEmailParams): Promise<{ success: boolean }> {
  const res = await client.post<DimailMailboxResult>(
    `/domains/${encodeURIComponent(domain)}/mailboxes/${encodeURIComponent(user_name)}/reset-password`,
  );
  if (res.status !== 200) {
    return { success: false };
  }
  return { success: true };
}
