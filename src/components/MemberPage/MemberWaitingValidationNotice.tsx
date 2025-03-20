import { getLastMissionDate } from "@/utils/member";
import { fr } from "@codegouvfr/react-dsfr/fr";
import Button from "@codegouvfr/react-dsfr/Button";
import Alert from "@codegouvfr/react-dsfr/Alert";

import { MemberPageProps } from "./MemberPage";

export const MemberWaitingValidationNotice = ({
    userInfos,
    canValidate,
}: {
    userInfos: MemberPageProps["userInfos"];
    canValidate: boolean;
}) => (
    <Alert
        className={fr.cx("fr-mt-2w", "fr-mb-2w")}
        title={`En attente de validation`}
        severity="info"
        description={
            <div>
                <p>
                    La fiche de {userInfos.fullname} doit être validée par
                    l'équipe de son incubateur.
                </p>
                <br />
                {canValidate && (
                    <Button
                        linkProps={{
                            href: `/community/${userInfos.username}/validate`,
                        }}
                    >
                        Valider la fiche de {userInfos.fullname}
                    </Button>
                )}
                <br />
            </div>
        }
    />
);
