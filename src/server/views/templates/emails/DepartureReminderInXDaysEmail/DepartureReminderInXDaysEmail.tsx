import { MjmlText } from "@luma-team/mjml-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailEndingContract } from "@/server/modules/email";

export function DepartureReminderInXDaysEmailTitle({
  days,
}: {
  days: EmailEndingContract["variables"]["days"];
}) {
  return `Départ dans ${days} jours 🙂`;
}

export function DepartureReminderInXDaysEmail({
  user,
  endDate,
  jobs,
  days,
}: EmailEndingContract["variables"]) {
  const title = DepartureReminderInXDaysEmailTitle({ days });
  const leavingDate = format(endDate, "dd MMMM yyyy", { locale: fr });

  return (
    <StandardLayout title={title}>
      <MjmlText>
        <h1>Bonjour {user.userInfos.fullname} !</h1>

        <p>
          Ta date de fin de mission est indiquée le {leavingDate}, dans {days}{" "}
          jours.
        </p>

        <p>
          Si cette date a changé, mets-la à jour pour rester membre de la
          communauté. C'est important car elle permet de conserver tes accès aux
          différents services : Mattermost, emails, ...
        </p>
        <p>
          En général, ta nouvelle date de fin doit correspondre à la date du
          prochain comité d'investissement de ton produit (dans 6 mois maximum).
        </p>
        <p>
          Pour mettre à jour ta date de fin de mission, tu peux :
          <ul>
            <li>
              la modifier en te connectant à{" "}
              <a href="https://espace-membre.incubateur.net/account/base-info">
                l'espace membre
              </a>
            </li>
            <li>
              <a href="https://doc.incubateur.net/communaute/travailler-a-beta-gouv/jutilise-les-outils-de-la-communaute/outils/mise-a-jour-de-mes-informations">
                suivre les autres méthodes de modification de ta fiche
              </a>
            </li>
          </ul>
        </p>
        <p>
          Si tu n'y arrives pas, un membre de ton équipe pourra sans doute
          t'aider. Sinon, n'hésite pas à poser tes questions sur Mattermost dans{" "}
          <a href="https://mattermost.incubateur.net/betagouv/channels/incubateur-help">
            ~incubateur-help
          </a>{" "}
          ou à répondre par email à{" "}
          <a href="mailto:contact@beta.gouv.fr">contact@beta.gouv.fr</a>.
        </p>

        <p>
          Rends-toi sur l'onglet{" "}
          <a href="https://espace-membre.beta.gouv.fr/account?tab=desembarquement">
            "désembarquement" de ton espace-membre
          </a>{" "}
          pour connaître toutes les étapes à suivre avant ton départ. Pour
          valider tes derniers services faits, il est obligatoire de compléter
          ta checklist de désembarquement.
          Pour connaitre tous les détails de ton parcours de désembarquement, RDV [ici](https://doc.incubateur.net/communaute/travailler-chez-beta.gouv.fr/je-quitte-beta.gouv.fr)
        </p>

        {jobs.length > 0 && (
          <>
            <p>
              Si ta mission se termine, voici quelques offres actuellement
              ouvertes qui pourraient correspondre à ton domaine :
            </p>
            <ul>
              {jobs.map((job: any, i) => (
                <li key={i}>
                  <a href={job.url}>{job.title.trim()}</a>
                </li>
              ))}
            </ul>
            <p>
              Tu peux retrouver toutes les offres sur :{" "}
              <a href="https://www.welcometothejungle.com/fr/companies/communaute-beta-gouv">
                Welcome to the Jungle
              </a>
            </p>
          </>
        )}

        {jobs.length === 0 && (
          <p>
            Si ta mission se termine, tu peux retrouver toutes les offres sur :{" "}
            <a href="https://www.welcometothejungle.com/fr/companies/communaute-beta-gouv">
              Welcome to the Jungle
            </a>
          </p>
        )}

        <p>Tu peux aussi proposer une candidature spontanée :</p>
        <ul>
          <li>En contactant directement l'équipe qui te fait rêver</li>
          <li>
            En proposant ton profil sur le canal{" "}
            <a href="https://mattermost.incubateur.net/betagouv/channels/incubateur-embauche">
              ~incubateur-embauche
            </a>
          </li>
          <li>
            En laissant tes coordonnées sur ce{" "}
            <a href="https://airtable.com/shrzxJlITsisv09L6">
              formulaire de candidature spontanée
            </a>
          </li>
        </ul>

        <p>Bonne journée</p>
      </MjmlText>
    </StandardLayout>
  );
}
