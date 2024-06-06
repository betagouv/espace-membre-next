"use client";
import { useState } from "react";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";

import { BadgeExistingView } from "./BadgeExistingView";
import { WelcomeScreen } from "./BadgeWelcomeScreen";
import { badgeDossierSchemaType } from "@/models/badgeDemande";
import { badgeRequestSchemaType } from "@/models/badgeRequests";

interface BadgeProps {
    badgeRequest?: badgeRequestSchemaType;
    dossier: badgeDossierSchemaType;
}

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
};

export const Badge = function ({ badgeRequest, dossier }: BadgeProps) {
    const [forceRequest, setForceRequest] = useState<boolean>(false);

    function getStatus(dossier) {
        const status = dossier.annotations.find(
            (annotation) => annotation.label === "Status"
        ).stringValue;
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
            <h2>Demande de badge</h2>
            {!!dossier && (
                <>
                    {dossier.state === "en_instruction" && (
                        <Alert
                            title="Vous avez déjà un badge en cours d'instruction"
                            description={`Vous avez déjà un badge en cours de création, vous serez notifié par email quand le badge sera crée. Cela peux prendre une semaine.
                            Si vous n'avez pas de nouvelle, merci de faire un message dans le canal ~bureau-segur de mattermost.`}
                            severity="info"
                        />
                    )}
                    {dossier.state === "accepte" && (
                        <>
                            <Alert
                                title="Votre badge va être créé."
                                description="Votre aller recevoir un email quand il sera disponible"
                                severity="info"
                            />
                            <BadgeExistingView dossier={dossier} />
                        </>
                    )}

                    <p>{getStatus(dossier)}</p>
                    <br />

                    {!forceRequest && (
                        <>
                            <p>
                                Si tu penses qu'il y a une erreur, tu peux
                                refaire une demande.
                            </p>
                            <Button
                                priority="secondary"
                                nativeButtonProps={{
                                    onClick: () => {
                                        setForceRequest(true);
                                    },
                                }}
                            >
                                Refaire une demande
                            </Button>
                        </>
                    )}
                </>
            )}
            {(!dossier || forceRequest) && (
                <WelcomeScreen badgeRequest={badgeRequest}></WelcomeScreen>
            )}
        </>
    );
};
