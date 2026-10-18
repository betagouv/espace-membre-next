"use client";
import { useCallback, useEffect, useState } from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";

import {
  safeAllowLegacyEmailLogin,
  safeGetLegacyEmailLoginStatus,
  safeRevokeLegacyEmailLogin,
} from "@/lib/auth/legacyEmailLogin/actions";

// legacy-email-login: remove with src/lib/auth/legacyEmailLogin

const formatDate = (date: Date) =>
  new Date(date).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

export const LegacyEmailLoginException = ({
  username,
}: {
  username: string;
}) => {
  const [status, setStatus] = useState<{
    mode: string;
    exceptionUntil: Date | null;
  }>();
  const [days, setDays] = useState(7);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    const res = await safeGetLegacyEmailLoginStatus(username);
    if (res.success) {
      setStatus(res.data);
    } else {
      setError(res.message);
    }
  }, [username]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!status || status.mode === "off") {
    return null;
  }

  const run = async (
    action: () => Promise<{ success: boolean; message?: string }>,
  ) => {
    setIsSaving(true);
    setError(undefined);
    const res = await action();
    setIsSaving(false);
    if (!res.success) {
      setError(res.message);
    }
    await refresh();
  };

  return (
    <Accordion label="Autoriser la connexion par email (support)">
      <p className="fr-text--sm">
        {status.exceptionUntil
          ? `Connexion par email autorisée jusqu'au ${formatDate(status.exceptionUntil)}.`
          : "Aucune autorisation en cours."}{" "}
        {status.mode === "transition" &&
          "Pendant la transition, les comptes existants pas encore passés à ProConnect y ont accès sans autorisation."}
      </p>
      {error && (
        <Alert
          className="fr-mb-2w"
          severity="warning"
          small
          closable={false}
          description={error}
        />
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => safeAllowLegacyEmailLogin(username, days));
        }}
      >
        <Input
          label="Durée de l'autorisation (jours, 30 maximum)"
          nativeInputProps={{
            type: "number",
            min: 1,
            max: 30,
            value: days,
            onChange: (e) => setDays(parseInt(e.target.value, 10)),
          }}
        />
        <Button
          nativeButtonProps={{ type: "submit", disabled: isSaving }}
          className="fr-mr-2w"
        >
          {status.exceptionUntil ? "Prolonger" : "Autoriser"}
        </Button>
        {status.exceptionUntil && (
          <Button
            priority="secondary"
            nativeButtonProps={{ type: "button", disabled: isSaving }}
            onClick={() => run(() => safeRevokeLegacyEmailLogin(username))}
          >
            Retirer l'autorisation
          </Button>
        )}
      </form>
    </Accordion>
  );
};
