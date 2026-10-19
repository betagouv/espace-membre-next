import config from "@/lib/config";
import { getArrayFromEnv } from "@/lib/env";

export const isApiKeyCreationDisabled = () => config.API_KEYS_CREATION_DISABLED;

// Coupe-circuit d'incident et liste de blocage : relus dans process.env a chaque
// appel, pas figes a l'import du module de config. Un blocage doit prendre effet
// a la requete suivante, et les tests peuvent armer la variable sans recharger.
export const isApiKeyAuthDisabled = () =>
  process.env.API_KEYS_AUTH_DISABLED === "true";

export const getBlockedApiKeyUsers = () =>
  getArrayFromEnv("API_KEYS_BLOCKED_USERS");
