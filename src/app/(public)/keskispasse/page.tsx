import type { Metadata } from "next";

import { routeTitles } from "@/utils/routes/routeTitles";
import { fr } from "@codegouvfr/react-dsfr";

export const metadata: Metadata = {
  title: `${routeTitles.keskispasse()} / Espace Membre`,
};

export default async function Page() {
  return (
    <div>
      <br />
      <h1>En cas de problème</h1>
      <br />
      <br />
      <ul className={fr.cx("fr-text--xl")}>
        <li>
          Retrouve toutes les informations sur le statut d'un membre{" "}
          <a href="/community">sur sa fiche</a>
        </li>
        <li>
          Consulte{" "}
          <a href="https://faq-betagouv.crisp.help/fr/category/espace-membre-1o8xzu0/">
            la FAQ espace-membre
          </a>
        </li>
        <li>
          Contacte l'équipe support{" "}
          <a href="https://faq-betagouv.crisp.help">via CRISP</a>
        </li>
      </ul>
    </div>
  );
}
