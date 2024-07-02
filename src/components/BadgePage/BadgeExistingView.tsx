import { badgeDossierSchemaType } from "@/models/badgeDemande";

export const BadgeExistingView = ({
    dossier,
}: {
    dossier: badgeDossierSchemaType;
}) => {
    return (
        <p>
            <b>Date de fin de validité du badge :</b>{" "}
            {
                dossier.champs.find((c) => c.label === "Date de fin de mission")
                    ?.stringValue
            }
        </p>
    );
};
