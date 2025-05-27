import {
  MjmlButton,
  MjmlText,
  Mjml,
  MjmlHead,
  MjmlPreview,
  MjmlTitle,
  MjmlBody,
  MjmlSection,
  MjmlColumn,
} from "@luma-team/mjml-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailStartupNewMemberArrival } from "@/server/modules/email";
export function StartupNewMemberArrivalEmailTitle() {
  return `Une nouvelle personne arrive dans votre équipe !`;
}

export function StartupNewMemberArrivalEmail(
  props: EmailStartupNewMemberArrival["variables"],
) {
  const title = StartupNewMemberArrivalEmailTitle();

  return (
    <StandardLayout title={title}>
      <MjmlText>
        <h1>{title}</h1>
        <p>Bonjour l'équipe {props.startup.name} !</p>
        <p>
          <b>{props.userInfos.fullname}</b> vient de rejoindre votre équipe en
          tant que <b>{props.userInfos.role}</b> !
        </p>
        <p>
          N'hésitez pas à lui souhaiter la bienvenue et à lui donner toutes les
          informations nécessaires, notamment en lui proposant de lire la{" "}
          <a href="https://doc.incubateur.net">doc</a> et de participer au
          prochain embarquement beta.gouv.fr !
        </p>
        <hr />
        <p style={{ fontStyle: "italic" }}>
          Si l'ajout de cette personne à votre équipe est une erreur, vous
          pouvez le signifier auprès de votre responsable d'incubateur.
        </p>
      </MjmlText>
      <MjmlText></MjmlText>
    </StandardLayout>
  );
}
