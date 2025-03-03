import { match } from "ts-pattern";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { fr } from "@codegouvfr/react-dsfr/fr";

import { DSFR_STATUSES, startupSchemaType } from "@/models/startup";

import "./standards.css";

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
            {!startupInfos.link && (
                <Alert
                    severity="info"
                    title="Ce produit n'a pas d'URL publique."
                    description="Certains critères, vérifiés automatiquement, ne sont pas disponibles."
                />
            )}
            <TableStandards
                headers={["Nom", "Statut", "Commentaire"]}
                data={[
                    [
                        <h3 className={fr.cx("fr-text--md")} key="title">
                            Accessibilité
                        </h3>,
                        null,
                        null,
                    ],
                    [
                        "Déclaration d'accessibilité",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.accessibility_status}
                            validText="Publiée"
                            invalidText="Non publiée"
                        />,
                        "La déclaration d'accessibilité est obligatoire dès la mise en ligne.",
                    ],
                    [
                        "Conformité",
                        <AccessibilityBadge
                            key="badge"
                            status={startupInfos.accessibility_status}
                        />,
                        "L'audit de conformité doit être réalisé avant la sortie d'accéleration.",
                    ],
                    [
                        <h3 className={fr.cx("fr-text--md")} key="title">
                            Qualité logicielle
                        </h3>,
                        null,
                        null,
                    ],
                    [
                        "Suivi DashLord",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.dashlord_url}
                        />,
                        "Le suivi DashLord est obligatoire dès la mise en ligne.",
                    ],
                    [
                        "Audit tech",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.tech_audit_url}
                            validText="Oui"
                            invalidText="Non"
                        />,
                        "L'audit tech est obligatoire dès la conception.",
                    ],
                    [
                        <h3 className={fr.cx("fr-text--md")} key="title">
                            Transparence
                        </h3>,
                        null,
                        null,
                    ],
                    [
                        "Publication des statistiques d'impact",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.stats_url}
                            validText="Publié"
                            invalidText="Non publié"
                        />,
                        "La page /stats doit être publiée dès la mise en ligne.",
                    ],
                    [
                        "Publication du budget",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.budget_url}
                            validText="Publié"
                            invalidText="Non publié"
                        />,
                        "La page /budget doit être publiée dès la mise en ligne.",
                    ],
                    [
                        "Publication du la roadmap",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.roadmap_url}
                            validText="Publiée"
                            invalidText="Non publiée"
                        />,
                        "La page roadmap doit être publiée dès la mise en ligne.",
                    ],
                    [
                        "Publication des codes sources",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.repository}
                            validText="Publié"
                            invalidText="Non publié"
                        />,
                        "Le code source doit être ouvert dès la mise en ligne.",
                    ],
                    [
                        <h3 className={fr.cx("fr-text--md")} key="title">
                            Qualité du support
                        </h3>,
                        null,
                        null,
                    ],
                    ["Aide joignable", "à venir", ""],
                    ["Réponse rapide", "à venir", ""],
                    [
                        <h3 className={fr.cx("fr-text--md")} key="title">
                            Sécurité
                        </h3>,
                        null,
                        null,
                    ],
                    [
                        "Audit de risque",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.analyse_risques}
                            validText="Oui"
                            invalidText="Non"
                        />,
                        "L'analyse de risque doit être lancée pendant la phase d'accélération.",
                    ],
                    [
                        "Utilise MonServiceSécurisé",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.mon_service_securise}
                            validText="Oui"
                            invalidText="Non"
                        />,
                        "L'inscription à MonServiceSécurisé doit être lancée en fin de construction.",
                    ],
                    [
                        <h3 className={fr.cx("fr-text--md")} key="title">
                            Données personnelles
                        </h3>,
                        null,
                        null,
                    ],
                    [
                        "Analyse AIPD",
                        "à venir",
                        "Analyse d’impact relative à la protection des données (AIPD).",
                    ],
                    ["Conformité des mentions légales", "à venir", ""],
                    [
                        <h3 className={fr.cx("fr-text--md")} key="title">
                            Design
                        </h3>,
                        null,
                        null,
                    ],
                    [
                        "Utilisation du système de design de l'Etat",
                        // match
                        match(startupInfos.dsfr_status)
                            .with("Le DSFR est implémenté", () => (
                                <BooleanBadge
                                    key="badge"
                                    value={true}
                                    validText="Oui"
                                />
                            ))
                            .with(
                                "Le DSFR est implémenté partiellement",
                                () => (
                                    <BooleanBadge
                                        key="badge"
                                        value={true}
                                        validText="Partiellement"
                                    />
                                )
                            )
                            .with("Refonte prévue", () => (
                                <BooleanBadge
                                    key="badge"
                                    value={false}
                                    invalidText="Refonte prévue"
                                />
                            ))
                            .with("Service non soumis au DSFR", () => (
                                <BooleanBadge
                                    key="badge"
                                    value={true}
                                    validText="Non soumis"
                                />
                            ))
                            .otherwise(() => (
                                <BooleanBadge
                                    key="badge"
                                    value={false}
                                    invalidText="Inconnu"
                                />
                            )),
                        "Le système de design est obligatoire pour les sites internets de la marque-état.",
                    ],
                    [
                        <h3 className={fr.cx("fr-text--md")} key="title">
                            Éco-conception
                        </h3>,
                        null,
                        null,
                    ],
                    [
                        "Déclaration d'écoconception",
                        <BooleanBadge
                            key="badge"
                            value={startupInfos.ecodesign_url}
                            validText="Publiée"
                            invalidText="Non publiée"
                        />,
                        "La déclaration d'écoconception est recommandée dès la mise en ligne.",
                    ],
                ]}
            />
        </>
    );
};
