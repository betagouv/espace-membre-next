import { ApiKeyRow } from "@/components/ApiKeys/ApiKeyTable";

type DbRow = {
  uuid: string;
  kind: string;
  name: string;
  token_prefix: string;
  scopes: string[];
  read_perimeter_kind: string;
  read_perimeter_ghid: string | null;
  write_perimeter_kind: string | null;
  write_perimeter_ghid: string | null;
  expires_at: Date | null;
  last_used_at: Date | null;
  revoked_at: Date | null;
  revoked_reason: string | null;
  created_at: Date;
};

const label = (kind: string | null, ghid: string | null) => {
  if (!kind) return null;
  if (kind === "global") return "global";
  // Cible du perimetre supprimee : la clef est deja refusee a
  // l'authentification, l'UI l'affiche comme inexploitable plutot que de
  // masquer le probleme.
  return ghid ? `${kind}/${ghid}` : null;
};

/** Projection unique des lignes api_keys vers l'UI. token_hash n'y figure pas. */
export const toApiKeyRow = (row: DbRow): ApiKeyRow => ({
  uuid: row.uuid,
  kind: row.kind,
  name: row.name,
  token_prefix: row.token_prefix,
  scopes: row.scopes,
  read_perimeter: label(row.read_perimeter_kind, row.read_perimeter_ghid),
  write_perimeter: label(row.write_perimeter_kind, row.write_perimeter_ghid),
  expires_at: row.expires_at,
  last_used_at: row.last_used_at,
  revoked_at: row.revoked_at,
  revoked_reason: row.revoked_reason,
  created_at: row.created_at,
});
