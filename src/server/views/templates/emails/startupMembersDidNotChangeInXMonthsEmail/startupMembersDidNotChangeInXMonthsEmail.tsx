import { MjmlButton, MjmlText } from "@luma-team/mjml-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import config from "@/server/config";
import { EmailStartupMembersDidNotChangeInXMonths } from "@/server/modules/email";

export function StartupMembersDidNotChangeInXMonthsEmailTitle() {
    return `Vérifie les produits de ton incubateur.`;
}

export function StartupMembersDidNotChangeInXMonthsEmail(
    props: EmailStartupMembersDidNotChangeInXMonths["variables"]
) {
    const title = StartupMembersDidNotChangeInXMonthsEmailTitle();

    return (
        <StandardLayout title={title}>
            <MjmlText>
                <h1>{title}</h1>
                <p>Bonjour,</p>
                <p>
                    Tu reçois cet email car tu fais partie de l'incubateur :{" "}
                    {props.incubator.title}.
                </p>
                <p>
                    Les équipes suivantes non pas changées depuis 3 mois, tu
                    peux vérifier via l'espace-membre que leurs informations
                    sont bien à jour.
                </p>
                <table className="member-info" style={{ width: "100%" }}>
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Membres actifs</th>
                            <th>Dernière modification de la fiche</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.startupWrappers.map((wrapper, index) => (
                            <tr key={index}>
                                <td style={{ width: "40%" }}>
                                    <a
                                        href={`${config.protocol}://${config.host}/startups/${wrapper.startup.ghid}`}
                                    >
                                        {wrapper.startup.name}
                                    </a>
                                </td>
                                <td style={{ width: "25%" }}>
                                    {wrapper.activeMembers}
                                </td>
                                <td style={{ width: "25%" }}>
                                    {wrapper.lastModification
                                        ? format(
                                              wrapper.lastModification,
                                              "dd/MM/yyyy"
                                          )
                                        : "date inconnue"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </MjmlText>
            <MjmlText>
                <p>
                    Si les informations ne sont pas à jour tu peux les mettres à
                    jour via l'espace-membre.
                </p>
            </MjmlText>
            <MjmlText></MjmlText>
        </StandardLayout>
    );
}
