import { getLastMissionDate } from "@/utils/member";
import { fr } from "@codegouvfr/react-dsfr/fr";
import Button from "@codegouvfr/react-dsfr/Button";
import Alert from "@codegouvfr/react-dsfr/Alert";

import { MemberPageProps } from "./MemberPage";

export const MemberWaitingEmailValidationNotice = ({
    userInfos,
}: {
    userInfos: MemberPageProps["userInfos"];
}) => (
    <Alert
        className={fr.cx("fr-mt-2w", "fr-mb-2w")}
        title={`Email en attente de validation`}
        severity="warning"
        description={
            <p>
                Pour activer son compte beta.gouv.fr, {userInfos.fullname} doit
                suivre les instructions indiquées dans l'email envoyé à{" "}
                <a href={`mailto:${userInfos.secondary_email}`}>
                    {userInfos.secondary_email}
                </a>
            </p>
        }
    />
);
