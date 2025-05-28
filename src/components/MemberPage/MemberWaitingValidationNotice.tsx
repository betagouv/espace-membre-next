import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";

import { MemberPageProps } from "./MemberPage";
import { getLastMissionDate } from "@/utils/member";

export const MemberWaitingValidationNotice = ({
  userInfos,
  canValidate,
}: {
  userInfos: MemberPageProps["userInfos"];
  canValidate: boolean;
}) => (
  <Alert
    className={fr.cx("fr-mt-2w", "fr-mb-2w")}
    title={`Fiche en attente de validation`}
    severity="warning"
    description={
      <p>
        <p>
          La fiche de {userInfos.fullname} doit être validée par l'équipe de son
          incubateur.
        </p>
        {canValidate && (
          <>
            <br />
            <Button
              linkProps={{
                href: `/community/${userInfos.username}/validate`,
              }}
            >
              Valider la fiche de {userInfos.fullname}
            </Button>
          </>
        )}
      </p>
    }
  />
);
