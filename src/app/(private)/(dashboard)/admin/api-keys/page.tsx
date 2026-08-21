import { Metadata } from "next";

import { ApiKeyTable } from "@/components/ApiKeys/ApiKeyTable";
import { toApiKeyRow } from "@/lib/api-keys/listItem";
import { isUuid } from "@/lib/api/identifier";
import { requireAdmin } from "@/lib/authorization/subject";
import { listAllApiKeys } from "@/lib/kysely/queries/apiKeys";
import { getAllIncubatorsOptions } from "@/lib/kysely/queries/incubators";

export const metadata: Metadata = { title: "Clefs d'API" };

const KINDS = ["personal", "service"] as const;
const STATES = ["live", "expired", "revoked"] as const;

export default async function Page(props: {
  searchParams: Promise<{ kind?: string; state?: string; incubator?: string }>;
}) {
  await requireAdmin();
  const { kind, state, incubator } = await props.searchParams;

  const filters = {
    kind: KINDS.includes(kind as never) ? (kind as (typeof KINDS)[number]) : undefined,
    state: STATES.includes(state as never)
      ? (state as (typeof STATES)[number])
      : undefined,
    // Meme piege que sur la page de detail : un filtre qui n'est pas un uuid
    // ferait lever Postgres en 22P02 et casserait l'ecran entier.
    incubatorUuid: incubator && isUuid(incubator) ? incubator : undefined,
  };

  const apiKeys = (await listAllApiKeys(filters)).map(toApiKeyRow);
  const incubators = await getAllIncubatorsOptions();

  return (
    <div>
      <h1>Clefs d&apos;API</h1>
      <form method="get" className="fr-mb-4w">
        <select name="kind" defaultValue={filters.kind ?? ""}>
          <option value="">Toutes natures</option>
          <option value="personal">Clefs personnelles</option>
          <option value="service">Clefs d&apos;application</option>
        </select>{" "}
        <select name="state" defaultValue={filters.state ?? ""}>
          <option value="">Tous états</option>
          <option value="live">Actives</option>
          <option value="expired">Expirées</option>
          <option value="revoked">Révoquées</option>
        </select>{" "}
        <select name="incubator" defaultValue={filters.incubatorUuid ?? ""}>
          <option value="">Tous incubateurs</option>
          {incubators.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>{" "}
        <button type="submit" className="fr-btn fr-btn--secondary">
          Filtrer
        </button>
      </form>
      {/* La colonne « dernier usage » rend visible la revocation automatique a
          180 jours d'inactivite. */}
      <ApiKeyTable apiKeys={apiKeys} canManage />
    </div>
  );
}
