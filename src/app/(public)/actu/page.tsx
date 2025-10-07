import type { Metadata } from "next";

import { routeTitles } from "@/utils/routes/routeTitles";
import { Actu } from "./Actu";
import { fr } from "@codegouvfr/react-dsfr";

export const metadata: Metadata = {
  title: `${routeTitles.keskispasse()} / Espace Membre`,
};
/*
 TODO: 
  - github releases
*/

export default async function Page() {
  return (
    <div className={fr.cx("fr-container", "fr-container--fluid")}>
      <Actu />
    </div>
  );
}
