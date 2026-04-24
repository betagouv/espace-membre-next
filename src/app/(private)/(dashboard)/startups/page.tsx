import { Metadata } from "next";

import { SearchFiles } from "./SearchFiles";
import { getStartupFiles } from "@/app/api/startups/files/list";
import { StartupList } from "@/components/StartupListPage";
import { getAllStartupsWithIncubator } from "@/lib/kysely/queries";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";

export const metadata: Metadata = {
  title: `${routeTitles.startupList()} / Espace Membre`,
};

export default async function Page() {
  const files = await getStartupFiles();
  const incubators = await getAllIncubators();
  const startups = await getAllStartupsWithIncubator();
  return (
    <div className={`${fr.cx("fr-grid-row")}`}>
      <h1>Explorer les produits</h1>
      <div className={`${fr.cx("fr-col-12")}`} style={{ textAlign: "right" }}>
        <Button
          linkProps={{
            href: "/startups/create-form",
          }}
          priority="secondary"
        >
          Créer une nouvelle fiche produit
        </Button>
      </div>
      <div className={fr.cx("fr-col-12")}>
        <h2>Fiches produits</h2>
        <StartupList startups={startups} incubators={incubators} />
        <hr />
        <h2>Documents partagés</h2>
        <SearchFiles files={files} />
      </div>
    </div>
  );
}
