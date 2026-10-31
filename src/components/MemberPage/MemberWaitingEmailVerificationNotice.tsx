"use client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { fr } from "@codegouvfr/react-dsfr/fr";

import { MemberPageProps } from "./MemberPage";
import Button from "@codegouvfr/react-dsfr/Button";

import { safeVerify, VerifyResult } from "@/app/api/members/actions/verify";
import { useState } from "react";

export const MemberWaitingEmailVerificationNotice = ({
  userInfos,
  canValidate,
}: {
  userInfos: MemberPageProps["userInfos"];
  canValidate: boolean;
}) => {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onClick = async () => {
    if (result) return;
    setError(null);
    const res = await safeVerify({ uuid: userInfos.uuid });
    if (res.success) {
      setResult(res.data);
    } else {
      setError(res.message);
    }
  };
  return result ? (
    <Alert
      severity="success"
      className={fr.cx("fr-mt-2w", "fr-mb-2w")}
      title={`Compte vérifié`}
      description={
        "loginEmail" in result ? (
          <>
            La personne peut se connecter avec ProConnect en utilisant{" "}
            {result.loginEmail}.
          </>
        ) : (
          <>
            Sa boîte Dimail est en cours de création : le lien d'accès au
            webmail sera envoyé à {userInfos.secondary_email}. C'est avec cette
            boîte que la personne se connectera avec ProConnect.
          </>
        )
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
              "
            </div>
          )) || (
            <div>Aucun email secondaire n'est renseigné pour ce membre</div>
          )}
          {canValidate && (
            <div className={fr.cx("fr-mt-2w")}>
              <Button
                onClick={onClick}
                title="Active la fiche sans attendre que la personne la complète"
              >
                Forcer la vérification
              </Button>
            </div>
          )}
          {error && (
            <Alert
              className={fr.cx("fr-mt-2w")}
              severity="error"
              small
              description={error}
            />
          )}
        </>
      }
    />
  );
};
