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

// custom table for custom styling
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
                    {data.map((row, i) => {
                        if (row[1] === null) {
                            return (
                                <tr
                                    key={"title-" + row[0] + i}
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
                                key={row[0] + 1}
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

const BooleanBadge = ({ value, validText = "Actif", invalidText = "Absent" }) =>
    !!value ? (
        <Badge severity="success">{validText}</Badge>
    ) : (
        <Badge severity="error">{invalidText}</Badge>
    );

export const StartupStandards = ({
    startupInfos,
}: {
    startupInfos: startupSchemaType;
}) => {
    return (
        <>
            <h2>Standards</h2>
            <TableStandards
                headers={["Nom", "Statut", "Commentaire"]}
                data={[
                    [<h3 key="title">Accessibilité</h3>, null, null],
                    [
                        "Déclaration d'accessibilité",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.accessibility_status}
                            validText="Publiée"
                            invalidText="Non publiée"
                        />,
                        "La déclaration d'accessibilité est obligatoire dès la mise en ligne",
                    ],
                    [
                        "Conformité",
                        <AccessibilityBadge
                            key="badge"
                            status={startupInfos.accessibility_status}
                        />,
                        "L'audit de conformité doit être réalisé avant la sortie d'accéleration",
                    ],
                    [<h3 key="title">Qualité logicielle</h3>, null, null],
                    [
                        "Suivi DashLord",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.dashlord_url}
                        />,
                        "Le suivi DashLord est obligatoire dès la mise en ligne",
                    ],
                    [
                        "Audit tech",
                        // <BooleanBadge
                        //     value={false}
                        //     validText="Oui"
                        //     invalidText="Non"
                        // />,
                        "à venir",
                        "L'audit tech est obligaroire dès la conception",
                    ],
                    //["Audit tech", "TODO", "TODO"],
                    [<h3 key="title">Transparence</h3>, null, null],
                    [
                        "Publication des statistiques d'impact",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.stats_url}
                            validText="Publié"
                            invalidText="Non publié"
                        />,
                        "La page /stats doit être publiée dès la mise en ligne",
                    ],
                    [
                        "Publication du budget",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.budget_url}
                            validText="Publié"
                            invalidText="Non publié"
                        />,
                        "La page /budget doit être publiée dès la mise en ligne",
                    ],
                    [
                        "Publication des codes sources",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.repository}
                            validText="Publié"
                            invalidText="Non publié"
                        />,
                        "Le code source doit être ouvert dès la mise en ligne",
                    ],
                    [<h3 key="title">Qualité du support</h3>, null, null],
                    [
                        "Les utilisateurs peuvent faire des retours facilement",
                        "à venir",
                        "",
                    ],
                    [
                        "Le support répond à chaque demande d'un utilisateur",
                        "à venir",
                        "",
                    ],
                    [<h3 key="title">Sécurité</h3>, null, null],
                    [
                        "Audit de risque",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.analyse_risques}
                            validText="Oui"
                            invalidText="Non"
                        />,
                        "L'analyse de risque doit être lancée pendant la phase d'accélération",
                    ],
                    [
                        "Utilise MonServiceSécurisé",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.mon_service_securise}
                            validText="Oui"
                            invalidText="Non"
                        />,
                        "L'inscription à MonServiceSécurisé doit être lancée en fin de constructions",
                    ],
                    [<h3 key="title">Données personnelles</h3>, null, null],
                    ["Analyse AIPD", "à venir", ""],
                    ["Conformité des mentions légales", "à venir", ""],
                    [<h3 key="title">Design</h3>, null, null],
                    [
                        "Priorise les fonctionnalités grâce aux retours utilisateurs",
                        "à venir",
                        "",
                    ],
                    ["Utilise le système de design de l'Etat", "à venir", ""],
                    [<h3 key="title">Éco-conception</h3>, null, null],
                    ["Démarche d'éco-conception engagée", "à venir", ""],
                ]}
            />
        </>
    );
};
