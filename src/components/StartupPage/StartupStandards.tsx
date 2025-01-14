import { Table } from "@codegouvfr/react-dsfr/Table";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { fr } from "@codegouvfr/react-dsfr/fr";
import { startupSchemaType } from "@/models/startup";

import "./standards.css";

const OK = () => (
    <i
        className={fr.cx("fr-icon--sm", "fr-icon-checkbox-line")}
        style={{
            color: "var(--text-default-success)",
        }}
    />
);

const NOK = () => (
    <i
        className={fr.cx("fr-icon--sm", "fr-icon-warning-line")}
        style={{
            color: "var(--text-default-error)",
        }}
    />
);

const AccessibilityBadge = ({ status }: { status?: string | null }) => {
    const severity =
        status === "totalement conforme"
            ? "success"
            : status === "partiellement conforme"
            ? "info"
            : "error";
    return <Badge severity={severity}>{status || "inconnu"}</Badge>;
};

// custom table for custom styles
const TableStandards = ({ data, headers }) => {
    return (
        <div
            className="fr-table startup-files-list-table"
            data-fr-js-table="true"
        >
            <table
                data-fr-js-table-element="true"
                className="startup-standards-table"
            >
                <thead>
                    <tr>
                        {headers.map((h) => (
                            <th scope="col" key={h}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => {
                        console.log({ row });
                        if (row[1] === null) {
                            return (
                                <tr
                                    key="row"
                                    data-fr-js-table-row="true"
                                    style={{
                                        backgroundColor: "transparent",
                                    }}
                                >
                                    <td
                                        className={fr.cx("fr-text--md")}
                                        colSpan={headers.length}
                                    >
                                        {row[0]}
                                    </td>
                                </tr>
                            );
                        }
                        return (
                            <tr
                                key="details"
                                data-fr-js-table-row="true"
                                style={{
                                    backgroundColor:
                                        "var(--background-alt-grey)",
                                }}
                            >
                                <td>{row[0]}</td>
                                <td>{row[1]}</td>
                                <td>{row[2]}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export const StartupStandards = ({
    startupInfos,
}: {
    startupInfos: startupSchemaType;
}) => {
    return (
        <TableStandards
            headers={["Nom", "Statut", "Commentaire"]}
            data={[
                [
                    <>
                        <b>Accessibilité</b>
                    </>,
                    null,
                    null,
                ],
                [
                    "Déclaration d'accessibilité",
                    startupInfos.accessibility_status ? (
                        <Badge severity="success">Publiée</Badge>
                    ) : (
                        <Badge severity="error">Non publiée</Badge>
                    ),
                    "La déclaration d'accessibilité est obligatoire dès la mise en ligne",
                ],
                [
                    "Conformité",
                    <AccessibilityBadge
                        key="badge"
                        status={startupInfos.accessibility_status}
                    />,
                    "L'audit de conformité doit être réalisé avant la sortie d'incubation",
                ],
                [
                    <>
                        <b>Qualité logicielle</b>
                    </>,
                    null,
                    null,
                ],
                [
                    "Suivi DashLord",
                    startupInfos.dashlord_url ? <OK /> : <NOK />,
                    "TODO",
                ],
                ["Audit tech", "TODO", "TODO"],
                [
                    <>
                        <b>Transparence</b>
                    </>,
                    null,
                    null,
                ],
                [
                    "Publication des statistiques d'impact",
                    startupInfos.stats_url ? <OK /> : <NOK />,
                    "TODO",
                ],
                [
                    "Publication du budget",
                    startupInfos.budget_url ? <OK /> : <NOK />,
                    "TODO",
                ],
                [
                    "Publication des codes sources",
                    startupInfos.repository ? <OK /> : <NOK />,
                    "TODO",
                ],
                [
                    <>
                        <b>Qualité du support</b>
                    </>,
                    null,
                    null,
                ],
                [
                    "Les utilisateurs peuvent faire des retours facilement",
                    "TODO",
                    "TODO",
                ],
                [
                    "Le support répond à chaque demande d'un utilisateur",
                    "TODO",
                    "TODO",
                ],
                [
                    <>
                        <b>Sécurité</b>
                    </>,
                    null,
                    null,
                ],
                [
                    "Audit de risque",
                    startupInfos.analyse_risques ? <OK /> : <NOK />,
                    "TODO",
                ],
                [
                    "Utilise MonServiceSécurisé",
                    startupInfos.mon_service_securise ? <OK /> : <NOK />,
                    "TODO",
                ],
                [
                    <>
                        <b>Données personnelles</b>
                    </>,
                    null,
                    null,
                ],
                ["Analyse AIPD", "TODO", "TODO"],
                [
                    <>
                        <b>Design</b>
                    </>,
                    null,
                    null,
                ],
                [
                    "Priorise les fonctionnalités grâce aux retours utilisateurs",
                    "TODO",
                    "TODO",
                ],
                ["Utilise le système de design de l'Etat", "TODO", "TODO"],
                [
                    <>
                        <b>Données personnelles</b>
                    </>,
                    null,
                    null,
                ],
                ["Analyse AIPD", "TODO", "TODO"],
                [
                    <>
                        <b>Éco-conception</b>
                    </>,
                    null,
                    null,
                ],
                ["Démarche d'éco-conception engagée", "TODO", "TODO"],
            ]}
        />
    );
};
