import { useState, useEffect } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import yaml from "yaml";

import Checklist from "../Checklist";
import ProgressBar from "../ProgressBar";
import { memberWrapperSchemaType } from "@/models/member";
import { userEventSchemaType } from "@/models/userEvent";

export const OnboardingTabPanel = ({
    userEvents,
    userInfos,
}: {
    userEvents: userEventSchemaType[];
    userInfos: memberWrapperSchemaType["userInfos"];
}) => {
    const [checklist, setChecklist] = useState<any>(null);

    useEffect(() => {
        fetch("/onboarding/checklist.yml")
            .then((res) => res.text())
            .then((text) => setChecklist(yaml.parse(text)));
    }, []);
    return (
        <>
            {!!checklist && (
                <>
                    <p>
                        Bienvenue dans la communauté ! Cette checklist est là
                        pour t'aider à bien débuter ta mission chez
                        beta.gouv.fr.
                    </p>
                    <ProgressBar
                        progress={70}
                        className={fr.cx("fr-mt-4w", "fr-mb-4w")}
                    />
                    <Checklist
                        sections={checklist}
                        domaine={userInfos.domaine}
                    />
                </>
            )}
        </>
    );
};
