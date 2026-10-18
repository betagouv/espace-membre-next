"use client";
import { useEffect, useState } from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";

import {
  safeGetWebmailAccessTarget,
  safeResendWebmailAccess,
} from "@/app/api/member/actions/webmailAccess";

export const ResendWebmailAccess = ({ username }: { username: string }) => {
  const [target, setTarget] = useState<{
    mailbox: string | null;
    secondaryEmail: string | null;
  }>();
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "warning";
    message: string;
  }>();

  useEffect(() => {
    safeGetWebmailAccessTarget(username).then((res) => {
      if (res.success) setTarget(res.data);
    });
  }, [username]);

  if (!target?.mailbox) {
    return null;
  }

  return (
    <Accordion label="Renvoyer un lien d'accès au webmail">
      <p className="fr-text--sm">
        Envoie un nouveau lien d'accès à la boîte{" "}
        <strong>{target.mailbox}</strong> (valable 1h, 3 utilisations) à l'email
        secondaire
        {target.secondaryEmail ? (
          <>
            {" "}
            <strong>{target.secondaryEmail}</strong>
          </>
        ) : (
          " (non renseigné)"
        )}
        .
      </p>
      {result && (
        <Alert
          className="fr-mb-2w"
          severity={result.type}
          small
          closable={false}
          description={result.message}
        />
      )}
      <Button
        priority="secondary"
        nativeButtonProps={{
          type: "button",
          disabled: isSaving || !target.secondaryEmail,
        }}
        onClick={async () => {
          if (
            !confirm(
              `Envoyer un lien d'accès à ${target.mailbox} vers ${target.secondaryEmail} ?`,
            )
          ) {
            return;
          }
          setIsSaving(true);
          const res = await safeResendWebmailAccess(
            username,
            target.secondaryEmail!,
          );
          setIsSaving(false);
          setResult(
            res.success
              ? {
                  type: "success",
                  message: `Lien envoyé à ${res.data.sentTo}.`,
                }
              : { type: "warning", message: res.message || "Erreur" },
          );
        }}
      >
        Envoyer le lien
      </Button>
    </Accordion>
  );
};
