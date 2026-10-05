import { fr } from "@codegouvfr/react-dsfr";
import type { Metadata } from "next";
import Link from "next/link";

import config from "@/lib/config";
import { routeTitles } from "@/lib/routes";

export const metadata: Metadata = {
  title: `${routeTitles.support()} / Espace Membre`,
};

// public page : no session required, no form (nothing is submitted)
export default async function Page() {
  const supportEmail = config.SUPPORT_EMAIL;
  return (
    <div className={fr.cx("fr-col-12", "fr-mt-5w", "fr-mb-10w")}>
      <h1>Aide à la connexion</h1>
      <p>
        La connexion à l'espace-membre se fait uniquement avec{" "}
        <strong>ProConnect</strong>, en utilisant ton adresse{" "}
        <strong>@beta.gouv.fr</strong> ou ton adresse du service public. Ton
        email personnel ne permet pas de te connecter.
      </p>

      <h2>Je viens d'arriver dans la communauté</h2>
      <p>
        Une fois ta fiche validée, ta boîte @beta.gouv.fr est créée
        automatiquement. Tu as alors reçu deux emails sur ton adresse
        personnelle : un lien d'accès temporaire à ta boîte, puis une
        invitation à te connecter avec ProConnect.
      </p>
      <p>
        Si tu n'as rien reçu, vérifie tes spams puis rapproche-toi de la
        personne qui t'a invité ou de ton incubateur : ta fiche est peut-être
        encore en attente de validation.
      </p>

      <h2>Je n'arrive plus à accéder à ma boîte @beta.gouv.fr</h2>
      <p>
        Lien d'accès expiré ou déjà utilisé, mot de passe perdu : sans accès à
        ta boîte, tu ne peux pas te connecter avec ProConnect. Contacte le
        support pour retrouver l'accès : les nouveaux accès seront envoyés sur
        ton email personnel.
      </p>

      <h2>ProConnect refuse ma connexion</h2>
      <ul>
        <li>
          Vérifie que tu utilises bien ton adresse @beta.gouv.fr ou ton adresse
          du service public, et pas ton email personnel.
        </li>
        <li>
          Si ta mission est terminée, ton accès est désactivé : demande à ton
          équipe de mettre à jour ta fiche.
        </li>
        <li>Si ProConnect est indisponible, réessaie un peu plus tard.</li>
      </ul>

      <h2>Contacter le support</h2>
      {supportEmail ? (
        <p>
          Écris à <a href={`mailto:${supportEmail}`}>{supportEmail}</a> en
          précisant ton nom, ton adresse @beta.gouv.fr et ton incubateur.
        </p>
      ) : (
        <p>
          Contacte l'équipe de ton incubateur, qui pourra relayer ta demande aux
          administrateurs de l'espace-membre.
        </p>
      )}

      <p>
        <Link href="/login">Retour à la page de connexion</Link>
      </p>
    </div>
  );
}
