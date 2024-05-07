import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";

export default function Observatoire({
    workplace,
    gender,
    tjm,
    legal_status,
    average_nb_of_days,
}: {
    workplace: string;
    gender: string;
    tjm: number;
    legal_status: string;
    average_nb_of_days: number;
}) {
    return (
        <div className="fr-mb-14v">
            <h2>Observatoire de la Communauté</h2>
            <br />
            <p>
                <span className="font-weight-bold">
                    Lieu de travail principal :{" "}
                </span>{" "}
                {workplace || "Non renseigné"}
                <br />
                <span className="font-weight-bold">Genre : </span>{" "}
                <span className="hide-info-detail">
                    <span>{gender || "Non renseigné"}</span>
                </span>
                <br />
                <span className="font-weight-bold">TJM : </span>{" "}
                <span className="hide-info-detail">
                    <span>{tjm || "Non renseigné"}</span>
                </span>
                <br />
                <span className="font-weight-bold">Statut Legal : </span>
                {legal_status || "Non renseigné"}
                <br />
                <span className="font-weight-bold">
                    Nombre de jours par semaine :{" "}
                </span>
                {average_nb_of_days || "Non renseigné"}
            </p>
            <p className="fr-text--xs" style={{ fontStyle: "italic" }}>
                Une information n'est pas à jour ?
            </p>
            <ButtonsGroup
                buttons={[
                    {
                        children: "✏️ Mettre à jour",
                        linkProps: {
                            href: "/account/info",
                        },
                    },
                    {
                        children: `Consulter l'observatoire`,
                        iconId: "fr-icon-chat-check-fill",
                        linkProps: {
                            href: "https://metabase.incubateur.net/public/dashboard/554ff353-6104-4c25-a261-d8bdc40f75d5",
                            target: "_blank",
                        },
                        priority: "secondary",
                    },
                ]}
                inlineLayoutWhen="md and up"
            />
        </div>
    );
}
