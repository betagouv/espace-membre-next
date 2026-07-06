import { fr } from "@codegouvfr/react-dsfr";
import { Tile } from "@codegouvfr/react-dsfr/Tile";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/utils/authoptions";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div className={fr.cx("fr-container")}>
      <h2 className={fr.cx("fr-pt-2w")}>Demandes d'accès outils</h2>

      <div
        key="airtable"
        className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}
      >
        <div className={fr.cx("fr-col-6")}>
          <Tile
            small={true}
            title={"Demandes OPS"}
            desc={
              <div>
                Pour les accès scalingo, les demandes de délégation DNS et
                autres besoins;
              </div>
            }
            orientation="horizontal"
            noIcon={true}
            titleAs="h6"
            imageSvg={false}
            imageUrl={`/static/images/logo-betagouv.jpg`}
            linkProps={{
              href: `/services/ops`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
