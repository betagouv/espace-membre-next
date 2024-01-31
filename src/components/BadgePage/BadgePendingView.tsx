import { useState } from "react";
import { BadgeDossier } from "@/models/badgeDemande";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import config from "@/frontConfig";

const STATUS = {
    "En attente de traitement": {
        status: `En attente de traitement`,
        description: `La demande est en attente de traitement. Tu recevras un email quand la demande sera traitée côté DINUM`,
    },
    "": {
        status: `En attente de traitement`,
        description: `La demande est en attente de traitement. Tu recevras un email quand la demande sera traitée côté DINUM`,
    },
    "En attente de validation par responsable incubateur": {
        status: `En attente de validation par le responsable d'incubateur`,
        description: `Ta demande a été traitée côté DINUM et en attente de validation par le responsable d'incubateur.`,
    },
    "En attente de création par bureau des badges": {
        status: `En attente du bureau des badges`,
        description: `Ta demande a été validée par le responsable d'incubateur et commandé auprès du bureau des badges.`,
    },
    "En attente de récupération": {
        status: `En attente de récupération`,
        description: `Tu peux aller chercher ton badge au bureau des badges qui est en attente de récupération.`,
    },
    Récupéré: {
        status: `Récupéré`,
        description: `Tu as récupéré ton badge.`,
    },
    "Formulaire non valide": {
        status: `Formulaire non valide`,
        description: `Ton formulaire est non valide tu as du recevoir un message dans tes emails.`,
    },
    ERROR: {
        status: `Impossible de récupérer le status du badge`,
        description: `Impossible de récupérer le status du badge, il faut contacter le support par email ${config.SUPPORT_EMAIL}`,
    },
};

export const BadgePendingView = ({
    dossier,
    dsToken,
    primaryEmail,
}: {
    dossier: BadgeDossier;
    dsToken: string | null;
    primaryEmail: string;
}) => {
    const [understoodBox, setUnderstoodBox] = useState<boolean>(false);

    function getStatus(dossier: BadgeDossier) {
        const statusObject = dossier.annotations.find(
            (annotation) => annotation.label === "Status"
        );
        const status: string = statusObject
            ? statusObject.stringValue
            : "ERROR";
        return (
            <>
                <p>
                    <b>Statut du badge :</b>
                    {STATUS[status].status}
                </p>
                <p>{STATUS[status].description}</p>
            </>
        );
    }
    return (
        <>
            {dsToken && !dossier && (
                <>
                    <p>
                        Votre démarche a été préremplie, vous pouvez maintenant
                        cliquer sur le bouton ci-dessous pour la terminer.
                    </p>
                    <p>⚠️ Veillez à respecter les règles suivantes :</p>
                    <ul>
                        <li>
                            Le compte à utiliser pour remplir la demande doit
                            être lié à votre adresse : {primaryEmail}
                        </li>
                        <li>
                            La date de fin de votre badge a été préremplie, si
                            vous la changez, mettez maximum 1 an{" "}
                        </li>
                    </ul>
                    <Checkbox
                        options={[
                            {
                                label: "J'ai compris",
                                nativeInputProps: {
                                    name: "checkboxes-1",
                                    value: "true",
                                    onChange: (e) => {
                                        setUnderstoodBox(!understoodBox);
                                    },
                                },
                            },
                        ]}
                        state="default"
                    ></Checkbox>
                    {!understoodBox && (
                        <Button disabled={true}>
                            Poursuivre la démarche sur démarches-simplifiees.fr
                        </Button>
                    )}
                    {understoodBox && (
                        <Button
                            linkProps={{
                                target: "_blank",
                                href: `${config.DS_BADGE_FORM_URL}${dsToken}`,
                            }}
                        >
                            Poursuivre la démarche sur démarches-simplifiees.fr
                        </Button>
                    )}
                </>
            )}
            {dossier && (
                <>
                    <p>{getStatus(dossier)}</p>
                </>
            )}
        </>
    );
};
