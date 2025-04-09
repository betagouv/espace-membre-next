import { useState, useEffect } from "react";

import { fr } from "@codegouvfr/react-dsfr";

import Checklist from "../Checklist";
import ProgressBar from "../ProgressBar";
import { memberWrapperSchemaType } from "@/models/member";
import { onboardingChecklistSchemaType } from "@/models/onboardingChecklist";
import { userEventSchemaType } from "@/models/userEvent";
import { computeOnboardingProgress } from "@/utils/onboarding/computeOnboardingProgress";

export const OnboardingTabPanel = ({
    userEvents,
    userInfos,
    checklistObject,
}: {
    userEvents: userEventSchemaType[];
    checklistObject: onboardingChecklistSchemaType;
    userInfos: memberWrapperSchemaType["userInfos"];
}) => {
    const [userEventIds, setUserEventIds] = useState<string[]>(
        userEvents
            .filter((event) => event.date !== null)
            .map((event) => event.field_id)
    );
    const [progress, setProgress] = useState<number>(
        computeOnboardingProgress(userEventIds, checklistObject)
    );
    useEffect(() => {
        setProgress(computeOnboardingProgress(userEventIds, checklistObject));
    }, [userEventIds, checklistObject]);

    return (
        <>
            <p>
                Bienvenue dans la communauté ! Cette checklist est là pour
                t'aider à bien débuter ta mission chez beta.gouv.fr.
            </p>
            <ProgressBar
                progress={progress}
                className={fr.cx("fr-mt-4w", "fr-mb-4w")}
            />
            <Checklist
                userUuid={userInfos.uuid}
                userEventIds={userEventIds}
                handleUserEventIdsChange={setUserEventIds}
                sections={checklistObject}
                domaine={userInfos.domaine}
            />
        </>
    );
};
