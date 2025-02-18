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

import { EmailTeamComposition } from "@/server/modules/email";
import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
export function TeamCompositionEmailTitle() {
    return `Vérifies les membres de ton équipe`;
}

export function TeamCompositionEmail(props: EmailTeamComposition["variables"]) {
    const title = TeamCompositionEmailTitle();

    return (
        <StandardLayout title={title}>
            <MjmlText>
                <h1>{title}</h1>
                <p>Bonjour,</p>
                <p>
                    Tu reçois cet email car tu fais partie de l'équipe :{" "}
                    {props.startup.name}
                </p>
                <p>Voici les membres actuellements dans ton équipe.</p>
                {props.activeMembers.map((activeMember, index) => (
                    <ul key={index}>
                        <li>Prénom Nom : {activeMember.member.fullname}</li>
                        <li>Role : {activeMember.member.role}</li>
                        <li>Domaine : {activeMember.member.domaine}</li>
                        <li>
                            Début de mission :{" "}
                            {format(
                                activeMember.activeMission.start,
                                "dd/MM/yyyy",
                                { locale: fr }
                            )}
                            {}
                        </li>
                        <li>
                            Fin de mission :{" "}
                            {!!activeMember.activeMission.end &&
                                `${format(
                                    activeMember.activeMission.end,
                                    "dd/MM/yyyy",
                                    { locale: fr }
                                )}`}
                            {!activeMember.activeMission.end &&
                                `Pas de date de fin`}
                        </li>
                        <li>
                            Employer : {activeMember.activeMission.employer}
                        </li>
                    </ul>
                ))}
            </MjmlText>
            <MjmlText>
                <p>
                    Si tes informations ne sont pas à jour tu peux les mettres à
                    jour en cliquant sur le bouton ci-dessous.
                </p>
            </MjmlText>
            <MjmlButton href={props.memberAccountLink}>
                Changer mes informations
            </MjmlButton>
            <MjmlText>
                <hr />
            </MjmlText>
            <MjmlText>
                <p>
                    Si un des autres membres n'est plus dans l'équipe tu peux le
                    signaler aux responsables de ton incubateur
                </p>
            </MjmlText>
            <MjmlText></MjmlText>
        </StandardLayout>
    );
}
