import { MjmlText } from "@luma-team/mjml-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailNoMoreContract } from "@/server/modules/email";

export function NoMoreContractXDaysEmailTitle() {
  return "A bientôt 🙂";
}

export function NoMoreContractXDaysEmail({
  user,
  days,
}: EmailNoMoreContract["variables"]) {
  const title = NoMoreContractXDaysEmailTitle();

  const latestMission = user.missions.reduce((a, v) =>
    //@ts-ignore todo
    !v.end || v.end > a.end ? v : a,
  );

  return (
    <StandardLayout title={title}>
      <MjmlText>
        <h1>Bonjour {user.fullname} !</h1>

        <p>
          Un petit mot pour te rappeler que lorsque ta fiche de membre chez
          beta.gouv.fr a été créée ou mise à jour, ta date de fin de mission a
          été définie pour le{" "}
          <strong>{`${latestMission.end ? format(latestMission.end, "d MMMM", { locale: fr }) : ""}`}</strong>
          .{" "}
          {days === 1
            ? `Cette date était hier`
            : `C'était il y a ${days} jours`}{" "}
          ! Tes différents comptes relatifs à la communauté seront bientôt
          supprimés ou désactivés.
        </p>

        <p>
          Si la date est incorrecte (tu l’avais peut-être mise sans avoir d’info
          sur la date réelle de fin, ou alors la date de fin a été revue),{" "}
          <a href="https://doc.incubateur.net/communaute/travailler-a-beta-gouv/jutilise-les-outils-de-la-communaute/outils/mise-a-jour-de-mes-informations#comment-mettre-a-jour-mes-dates-de-mission">
            mets-la à jour
          </a>{" "}
          pour rester membre de la communauté.
        </p>

        <p>
          Si la date est correcte et que ta mission se termine, tu peux déjà :
        </p>

        <ul>
          <li>
            Te retirer les droits d’écriture de l’
            <a href="https://calendar.google.com/calendar/embed?src=0ieonqap1r5jeal5ugeuhoovlg%40group.calendar.google.com&ctz=Europe/Paris">
              agenda public de l’incubateur
            </a>
            .
          </li>
          <li>
            Supprimer ton compte Mattermost si tu ne comptes plus être actif ou
            changer l'adresse email de ton compte (l'adresse beta.gouv.fr va
            être supprimée)
          </li>
        </ul>

        <p>
          Dans les jours qui viennent, tes{" "}
          <a href="https://doc.incubateur.net/communaute/travailler-chez-beta.gouv.fr/je-quitte-beta.gouv.fr">
            différents comptes vont être désactivés
          </a>
          .
        </p>

        <p>
          On espère que tu as passé un moment positif avec nous ! Si tu as des
          questions, n'hésite pas à les poser en répondant à cet email.
        </p>
      </MjmlText>
    </StandardLayout>
  );
}
