import React from "react";
import { BadgeDossier } from "@/models/badgeDemande";
import { BadgeRequest } from "@/models/badgeRequests";
import { WelcomeScreen } from "./BadgeWelcomeScreen";
import { BadgePendingView } from "./BadgePendingView";
import { BadgeExistingView } from "./BadgeExistingView";
import Button from "@codegouvfr/react-dsfr/Button";

enum STEP {
    infoScreen = "infoScreen",
    welcomeScreen = "welcomeScreen",
    documentScreen = "documentScreen",
    finalScreen = "finalScreen",
}

export interface BadgeProps {
    title: string;
    currentUserId: string;
    dossier: BadgeDossier;
    errors: string[];
    messages: string[];
    activeTab: string;
    request: Request;
    formData: FormData;
    badgeRequest: BadgeRequest;
    formValidationErrors: any;
    startups: string[];
    isAdmin: boolean;
    firstName: string;
    lastName: string;
    attributaire: string;
    endDate: Date;
    primaryEmail: string;
}

export const Badge = function (props: BadgeProps) {
    const [step, setStep] = React.useState(
        props.badgeRequest || props.dossier
            ? STEP.documentScreen
            : STEP.welcomeScreen
    );
    const [fixes] = React.useState([STEP.welcomeScreen, STEP.documentScreen]);
    const [dsToken, setDSToken] = React.useState(
        props.badgeRequest ? props.badgeRequest.ds_token : null
    );

    function goBack() {
        const currentStepIndex = fixes.findIndex((s) => s === step);
        const previousStep = fixes[currentStepIndex - 1] || STEP.welcomeScreen;
        setStep(previousStep);
    }

    function next() {
        const currentStepIndex = fixes.findIndex((s) => s === step);
        const nextStep = fixes[currentStepIndex + 1];
        setStep(nextStep);
        const state = {
            step: nextStep,
        };
        history.pushState(state, "");
    }

    let stepView;
    if (props.dossier && props.dossier.state === "accepte") {
        stepView = <BadgeExistingView dossier={props.dossier} />;
    } else if (step === STEP.welcomeScreen) {
        stepView = (
            <WelcomeScreen
                setDSToken={setDSToken}
                next={next}
                dossier={props.dossier}
                badgeRequest={props.badgeRequest}
            />
        );
    } else {
        stepView = (
            <BadgePendingView
                dossier={props.dossier}
                dsToken={dsToken}
                primaryEmail={props.primaryEmail}
            />
        );
    }
    return (
        <div>
            {step !== STEP.welcomeScreen && (
                <Button
                    size="small"
                    iconId="fr-icon-arrow-left-s-line"
                    priority="tertiary no outline"
                    onClick={() => goBack()}
                >
                    Retour
                </Button>
            )}
            {stepView}
        </div>
    );
};
