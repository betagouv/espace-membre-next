import axios from "axios";

const DIMAIL_API_URL = process.env.DIMAIL_API_URL;

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

export interface DimailEmailParams {
  user_name: string;
  domain: string;
  displayName: string;
  givenName: string;
  surName: string;
}

export interface DimailAliasParams {
  domain: string;
  user_name: string;
  destination: string;
}

export type DimailMailboxResult = {
  email: string;
  password: string;
};

export type DimailAliasResult = {
  username: string;
  domain: string;
  destination: string;
  allow_to_send: boolean;
};

export type DimailTokenResult = {
  access_token: string;
  token_type: string;
};

export type DimailNewAccesTokenResult = string;

/**
 * récupère un nouveau token
 * GET /token
 * Retourne access_token
 */
async function getAccessToken(): Promise<string> {
  const response = await axios.get(
    `${DIMAIL_API_URL}/token/?username=${encodeURIComponent(DIMAIL_API_USERNAME || "unknown")}`,
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${DIMAIL_API_USERNAME}:${DIMAIL_API_PASSWORD}`)
            .toString("base64")
            .trim(),
      },
    },
  );

  return response.data.access_token;
}

const client = axios.create({
  baseURL: DIMAIL_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to every request
client.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Crée une boîte mail
 * POST /domains/{domain_name}/mailboxes/{user_name}
 * Retourne { email, password }
 */
export async function createMailbox({
  domain,
  user_name,
  displayName,
  givenName,
  surName,
}: DimailEmailParams): Promise<DimailMailboxResult> {
  const payload = {
    ...{ displayName, givenName, surName },
  };
  const res = await client.post<DimailMailboxResult>(
    `/domains/${encodeURIComponent(domain)}/mailboxes/${encodeURIComponent(user_name)}`,
    payload,
  );
  return res.data;
}

/**
 * Crée un alias
 * POST /domains/{domain_name}/aliases
 * Retourne { email, password }
 */
export async function createAlias({
  domain,
  user_name,
  destination,
}: DimailAliasParams): Promise<DimailMailboxResult> {
  const payload = {
    user_name,
    destination,
    allow_to_send: true,
  };
  const res = await client.post<DimailMailboxResult>(
    `/domains/${encodeURIComponent(domain)}/aliases`,
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
