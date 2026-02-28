"use client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { fr } from "@codegouvfr/react-dsfr/fr";

import { MemberPageProps } from "./MemberPage";
import Button from "@codegouvfr/react-dsfr/Button";

import { verify } from "@/app/api/members/actions/verify";
import { useState } from "react";

export const MemberWaitingEmailVerificationNotice = ({
  userInfos,
  canValidate,
}: {
  userInfos: MemberPageProps["userInfos"];
  canValidate: boolean;
}) => {
  const [success, setSuccess] = useState<boolean | null>();
  const onClick = async () => {
    if (success) return;
    const result = await verify({ uuid: userInfos.uuid });
    setSuccess(!!result);
  };
  return success ? (
    <Alert
      severity="success"
      className={fr.cx("fr-mt-2w", "fr-mb-2w")}
      title={`Compte vérifié`}
      description={
        <>
          La personne peut désormais se connecter avec son email primaire ou
          secondaire directement.
        </>
      }
    ></Alert>
  ) : (
    <Alert
      className={fr.cx("fr-mt-2w", "fr-mb-2w")}
      title={`${userInfos.fullname} n'a pas encore vérifié son compte.`}
      severity="warning"
      description={
        <>
          {(userInfos.secondary_email && (
            <div>
              Pour vérifier son compte beta.gouv.fr, {userInfos.fullname} doit
              suivre les instructions indiquées dans l'email envoyé à "
              <a href={`mailto:${userInfos.secondary_email}`}>
                {userInfos.secondary_email}
              </a>
              ""
            </div>
          )) || (
            <div>Aucun email secondaire n'est renseigné pour ce membre</div>
          )}
          {canValidate && (
            <div className={fr.cx("fr-mt-2w")}>
              <Button
                onClick={onClick}
                title="La personne peut se connecter à l'espace membre avec son email primaire ou secondaire directement"
              >
                Forcer la vérification
              </Button>
            </div>
          )}
        </>
      }
    />
  );
};
