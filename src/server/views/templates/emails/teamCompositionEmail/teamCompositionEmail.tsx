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
import { EmailTeamComposition } from "@/server/modules/email";
export function TeamCompositionEmailTitle() {
    return `Vérifie les membres de ton équipe.`;
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
                    {props.startup.name}.
                </p>
                <p>Voici les membres actuellement dans ton équipe : </p>
                <table className="member-info" style={{ width: "100%" }}>
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Rôle</th>
                            <th>Mission</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.activeMembers.map((activeMember, index) => (
                            <tr key={index}>
                                <td style={{ width: "25%" }}>
                                    {activeMember.member.fullname}
                                </td>
                                <td style={{ width: "40%" }}>
                                    {activeMember.member.role}
                                </td>
                                <td style={{ width: "35%" }}>
                                    Début :{" "}
                                    {format(
                                        activeMember.activeMission.start,
                                        "dd/MM/yyyy",
                                        {
                                            locale: fr,
                                        },
                                    )}{" "}
                                    <br />
                                    Fin:{" "}
                                    {!!activeMember.activeMission.end
                                        ? format(
                                              activeMember.activeMission.end,
                                              "dd/MM/yyyy",
                                              {
                                                  locale: fr,
                                              },
                                          )
                                        : "Pas de date de fin"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </MjmlText>
            <MjmlText>
                <p>
                    Si tes informations ne sont pas à jour, tu peux les modifier
                    en cliquant sur le bouton ci-dessous.
                </p>
            </MjmlText>
            <MjmlButton href={props.memberAccountLink}>
                Changer mes informations
            </MjmlButton>
            <MjmlText>
                <p className="fr-hr-or">ou</p>
            </MjmlText>
            <MjmlText>
                <p>
                    Si un des autres membres n'est plus dans l'équipe tu peux le
                    signaler aux responsables de ton incubateur.
                </p>
            </MjmlText>
            <MjmlText></MjmlText>
        </StandardLayout>
    );
}
