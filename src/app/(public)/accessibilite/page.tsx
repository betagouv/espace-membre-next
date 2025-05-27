import { fr } from "@codegouvfr/react-dsfr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Accessibilité`,
};
export default async function Page() {
  return (
    <div className={fr.cx("fr-col-12", "fr-mt-5w")}>
      <h1>Déclaration d’accessibilité</h1>
      <p>Établie le 16 juillet 2024.</p>
      <p>
        La DINUM s’engage à rendre son service accessible, conformément à
        l’article 47 de la loi n° 2005-102 du 11 février 2005.
      </p>
      <p>
        À cette fin, nous mettons en œuvre la stratégie et les actions suivantes
        :{" "}
        <a href="https://beta.gouv.fr/accessibilite/schema-pluriannuel">
          Schéma pluriannuel
        </a>
      </p>
      <p>
        Cette déclaration d’accessibilité s’applique à{" "}
        <a href="https://espace-membre.incubateur.net">Espace Membre</a>.
      </p>
      <h2>État de conformité</h2>
      <p>
        L'espace Membre est non conforme avec le RGAA. Le site n’a encore pas
        été audité.
      </p>
      <h2>Non conformités</h2>
      <p>
        Malgré nos efforts, certains contenus sont inaccessibles. Vous trouverez
        ci-dessous une liste des limitations connues :
      </p>
      <ul>
        <li>
          Tableau de recherche des membres : Le tableau n'est pas triable au
          clavier. Une refonte graphique de ce module est envisagé à l'avenir.
        </li>
        <li>
          Archives des infolettres : les archives ne sont pas accessibles avec
          un lecteur d'écran. Tous les liens ont le même intitulés.
        </li>
      </ul>
      <h2>Amélioration et contact</h2>
      <p>
        Si vous n’arrivez pas à accéder à un contenu ou à un service, vous
        pouvez contacter l'équipe responsable de Espace Membre pour être orienté
        vers une alternative accessible ou obtenir le contenu sous une autre
        forme.
      </p>
      <ul>
        <li>
          E-mail :{" "}
          <a href="mailto:animation@beta.gouv.fr">animation@beta.gouv.fr</a>
        </li>
        <li>Sur Mattermost, dans incubateur-entraide-communauté</li>
      </ul>
      <p>Nous essayons de répondre dans les 2 jours ouvrés.</p>
      <h2>Voie de recours</h2>
      <p>
        Cette procédure est à utiliser dans le cas suivant : vous avez signalé
        au responsable du site internet un défaut d’accessibilité qui vous
        empêche d’accéder à un contenu ou à un des services du portail et vous
        n’avez pas obtenu de réponse satisfaisante.
      </p>
      <p>Vous pouvez :</p>
      <ul>
        <li>
          Écrire un message au{" "}
          <a href="https://formulaire.defenseurdesdroits.fr/">
            Défenseur des droits
          </a>
        </li>
        <li>
          Contacter{" "}
          <a href="https://www.defenseurdesdroits.fr/saisir/delegues">
            le délégué du Défenseur des droits dans votre région
          </a>
        </li>
        <li>
          Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) :
          Défenseur des droits Libre réponse 71120 75342 Paris CEDEX 07
        </li>
      </ul>
      <p>
        Cette déclaration d’accessibilité a été créé le 16 juillet 2024 grâce au{" "}
        <a href="https://betagouv.github.io/a11y-generateur-declaration/#create">
          Générateur de Déclaration d’Accessibilité
        </a>{" "}
        de BetaGouv.
      </p>
    </div>
  );
}
