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
export function TeamCompositionEmailTitle() {
    return `Vérifies les membres de votre équipe`;
}

export function TeamCompositionEmail(props: EmailTeamComposition["variables"]) {
    const title = TeamCompositionEmailTitle();

    return (
        <Mjml>
            <MjmlHead>
                <MjmlTitle>Vérifie les membres de votre équipe</MjmlTitle>
                <MjmlPreview>
                    Voici les membres actuellement de ton équipe
                </MjmlPreview>
            </MjmlHead>
            <MjmlBody width={500}>
                <MjmlSection>
                    <MjmlColumn>
                        <MjmlText>
                            <h1>{title}</h1>
                            <p>Bonjour,</p>
                            <p>
                                Tu reçois cet email car tu fais partie de
                                l'équipe : {props.startup.name}
                            </p>
                            <p>
                                Voici les membres actuellements dans ton équipe.
                            </p>
                            {props.activeMembers.map((activeMember, index) => (
                                <ul key={index}>
                                    <li>
                                        Prénom Nom :{" "}
                                        {activeMember.member.fullname}
                                    </li>
                                    <li>Role : {activeMember.member.role}</li>
                                    <li>
                                        Domaine : {activeMember.member.domaine}
                                    </li>
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
                                        Employer :{" "}
                                        {activeMember.activeMission.employer}
                                    </li>
                                </ul>
                            ))}
                        </MjmlText>
                        <MjmlText>
                            <p>
                                Cette personne est-elle bien un membre de ton
                                incubateur ? Si oui, clique sur le bouton
                                ci-dessous.
                            </p>
                        </MjmlText>
                        <MjmlButton href={props.memberAccountLink}>
                            Valider le membre
                        </MjmlButton>
                        <MjmlText></MjmlText>
                    </MjmlColumn>
                </MjmlSection>
            </MjmlBody>
        </Mjml>
    );
}
