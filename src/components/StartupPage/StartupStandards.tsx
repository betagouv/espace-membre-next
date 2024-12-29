import { Table } from "@codegouvfr/react-dsfr/Table";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { fr } from "@codegouvfr/react-dsfr/fr";
import { startupSchemaType } from "@/models/startup";

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

export const StartupStandards = ({
    startupInfos,
}: {
    startupInfos: startupSchemaType;
}) => {
    return (
        <>
            <Accordion
                label="Accessibilité"
                expanded={true}
                onExpandedChange={(expanded, e) => {}}
            >
                <Table
                    fixed
                    headers={["Nom", "Statut"]}
                    data={[
                        [
                            "Déclaration d'accessibilité",
                            <AccessibilityBadge
                                status={startupInfos.accessibility_status}
                            />,
                        ],
                    ]}
                />
            </Accordion>
            <Accordion
                label="Qualité logicielle"
                expanded={true}
                onExpandedChange={(expanded, e) => {}}
            >
                <Table
                    fixed
                    headers={["Nom", "Statut"]}
                    data={[
                        [
                            "Suivi DashLord",
                            startupInfos.dashlord_url ? <OK /> : <NOK />,
                        ],
                        ["Une sonde sentry est implémentée", "-"],
                    ]}
                />
            </Accordion>
            <Accordion
                label="Transparence"
                expanded={true}
                onExpandedChange={(expanded, e) => {}}
            >
                <Table
                    fixed
                    headers={["Nom", "Statut"]}
                    data={[
                        [
                            "Publication des statistiques d'impact",
                            startupInfos.stats_url ? <OK /> : <NOK />,
                        ],
                        [
                            "Publication du budget",
                            startupInfos.budget_url ? <OK /> : <NOK />,
                        ],
                        [
                            "Publication des codes sources",
                            startupInfos.repository ? <OK /> : <NOK />,
                        ],
                    ]}
                />
            </Accordion>
            <Accordion
                label="Qualité du support"
                expanded={true}
                onExpandedChange={(expanded, e) => {}}
            >
                <Table
                    fixed
                    headers={["Nom", "Statut"]}
                    data={[
                        [
                            "Les utilisateurs peuvent faire des retours facilement",
                            "-",
                        ],
                        [
                            "Le support répond à chaque demande d'un utilisateur",
                            "-",
                        ],
                    ]}
                />
            </Accordion>
            <Accordion
                label="Sécurité"
                expanded={true}
                onExpandedChange={(expanded, e) => {}}
            >
                <Table
                    fixed
                    headers={["Nom", "Statut"]}
                    data={[
                        [
                            "Audit de risque",
                            startupInfos.analyse_risques ? <OK /> : <NOK />,
                        ],
                        [
                            "Utilise MonServiceSécurisé",
                            startupInfos.mon_service_securise ? (
                                <OK />
                            ) : (
                                <NOK />
                            ),
                            ,
                        ],
                    ]}
                />
            </Accordion>
            <Accordion
                label="Données personnelles"
                expanded={true}
                onExpandedChange={(expanded, e) => {}}
            >
                <Table
                    fixed
                    headers={["Nom", "Statut"]}
                    data={[
                        [
                            "Audit de risque",
                            startupInfos.analyse_risques ? <OK /> : <NOK />,
                        ],
                        [
                            "MonServiceSécurisé",
                            startupInfos.mon_service_securise ? (
                                <OK />
                            ) : (
                                <NOK />
                            ),
                            ,
                        ],
                    ]}
                />
            </Accordion>
            <Accordion
                label="Design"
                expanded={true}
                onExpandedChange={(expanded, e) => {}}
            >
                <Table
                    fixed
                    headers={["Nom", "Statut"]}
                    data={[
                        [
                            "Priorise les fonctionnalités grâce aux retours utilisateurs",
                            "-",
                        ],
                        ["Utilise le système de design de l'Etat", "-"],
                    ]}
                />
            </Accordion>
            <Accordion
                label="Éco-conception"
                expanded={true}
                onExpandedChange={(expanded, e) => {}}
            >
                <Table
                    fixed
                    headers={["Nom", "Statut"]}
                    data={[["Démarche d'éco-conception engagée", "-"]]}
                />
            </Accordion>
        </>
    );
};
