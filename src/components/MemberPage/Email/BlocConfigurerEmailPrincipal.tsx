import React, { useCallback, useEffect, useState } from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { signIn } from "next-auth/react";

import {
  safeCancelPendingPrimaryEmail,
  safeChoosePrimaryEmailFromDimail,
  safeGetPrimaryEmailSettings,
  safeRequestPrimaryEmailChange,
  safeRequestPrimaryEmailSwap,
} from "@/app/api/member/actions/primaryEmail";
import { memberBaseInfoSchemaType } from "@/models/member";

type Settings = {
  primaryEmail: string | null;
  pending: {
    email: string;
    expiresAt: Date;
    requestedBy: string | null;
  } | null;
  dimailAddresses: string[];
  secondaryEmail: string | null;
  expired: boolean;
  canChooseDimail: boolean;
  canRequest: boolean;
  canSwap: boolean;
};

const formatDate = (date: Date) =>
  new Date(date).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });

// prompt=login : an open ProConnect session would otherwise answer with the
// address it is already logged in with, never the new one
const reconnectWithProConnect = (loginHint?: string) =>
  signIn(
    "proconnect",
    { callbackUrl: window.location.pathname },
    { prompt: "login", ...(loginHint ? { login_hint: loginHint } : {}) },
  );

export default function BlocConfigurerEmailPrincipal({
  isAdmin,
  userInfos,
}: {
  isAdmin?: boolean;
  userInfos: memberBaseInfoSchemaType;
}) {
  const [settings, setSettings] = useState<Settings>();
  const [newEmail, setNewEmail] = useState("");
  const [dimailChoice, setDimailChoice] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    title: string;
    message?: string;
    type: "success" | "warning";
  } | null>(null);

  const refresh = useCallback(async () => {
    const res = await safeGetPrimaryEmailSettings(userInfos.username);
    if (res.success) {
      setSettings(res.data);
    } else {
      setAlertMessage({
        title: "Une erreur est survenue",
        message: res.message,
        type: "warning",
      });
    }
  }, [userInfos.username]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = async (
    action: () => Promise<{ success: boolean; message?: string }>,
    successTitle: string,
  ) => {
    setIsSaving(true);
    setAlertMessage(null);
    const res = await action();
    setIsSaving(false);
    setAlertMessage(
      res.success
        ? { title: successTitle, type: "success" }
        : {
            title: "Une erreur est survenue",
            message: res.message,
            type: "warning",
          },
    );
    await refresh();
  };

  return (
    <Accordion
      label={
        isAdmin
          ? `Proposer un nouvel email principal pour cette personne`
          : `Configurer mon email principal`
      }
    >
      {!!alertMessage && (
        <Alert
          className="fr-mb-4w"
          severity={alertMessage.type}
          closable={false}
          title={alertMessage.title}
          description={alertMessage.message || ""}
        />
      )}
      <p>
        Adresse de connexion ProConnect et de communication, obligatoirement
        d'agent public. Actuellement :{" "}
        <strong>{settings?.primaryEmail || userInfos.primary_email}</strong>.
      </p>

      {settings?.pending && (
        <Alert
          className="fr-mb-4w"
          severity="info"
          closable={false}
          title={`Adresse en attente : ${settings.pending.email}`}
          description={
            <>
              <p>
                Elle deviendra l'email principal à la prochaine connexion
                ProConnect avec cette adresse, avant le{" "}
                {formatDate(settings.pending.expiresAt)}.
                {settings.pending.requestedBy &&
                  settings.pending.requestedBy !== userInfos.username &&
                  ` Proposée par ${settings.pending.requestedBy}.`}
              </p>
              {!isAdmin && (
                <Button
                  className="fr-mr-2w"
                  nativeButtonProps={{ type: "button" }}
                  onClick={() =>
                    reconnectWithProConnect(settings.pending!.email)
                  }
                >
                  Me reconnecter avec ProConnect
                </Button>
              )}
              {settings.canRequest && (
                <Button
                  priority="secondary"
                  nativeButtonProps={{ type: "button", disabled: isSaving }}
                  onClick={() =>
                    run(
                      () => safeCancelPendingPrimaryEmail(userInfos.username),
                      "Demande annulée",
                    )
                  }
                >
                  Annuler la demande
                </Button>
              )}
            </>
          }
        />
      )}

      {settings?.canChooseDimail && settings.dimailAddresses.length > 0 && (
        <form
          className="fr-mb-4w"
          onSubmit={(e) => {
            e.preventDefault();
            if (!dimailChoice) return;
            run(
              () =>
                safeChoosePrimaryEmailFromDimail(
                  userInfos.username,
                  dimailChoice,
                ),
              "Email principal mis à jour",
            );
          }}
        >
          <RadioButtons
            legend="Utiliser une de mes adresses @beta.gouv.fr"
            options={settings.dimailAddresses.map((email) => ({
              label: email,
              nativeInputProps: {
                value: email,
                checked: dimailChoice === email,
                onChange: () => setDimailChoice(email),
              },
            }))}
          />
          <Button
            nativeButtonProps={{
              type: "submit",
              disabled: isSaving || !dimailChoice,
            }}
          >
            Utiliser cette adresse
          </Button>
        </form>
      )}

      {settings?.canSwap && !settings.pending && (
        <div className="fr-mb-4w">
          <p>
            Email perso : <strong>{settings.secondaryEmail}</strong>. L'inverser
            le met en attente comme email principal. À la connexion ProConnect
            de la personne avec cette adresse, il devient son email principal et
            l'email principal actuel devient son email perso.
          </p>
          <Button
            priority="secondary"
            nativeButtonProps={{ type: "button", disabled: isSaving }}
            onClick={() =>
              run(
                () => safeRequestPrimaryEmailSwap(userInfos.username),
                "Inversion proposée : la personne doit se reconnecter avec ProConnect avec son email perso",
              )
            }
          >
            Inverser email principal et email perso
          </Button>
        </div>
      )}

      {settings?.canRequest && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => safeRequestPrimaryEmailChange(userInfos.username, newEmail),
              isAdmin
                ? "Adresse proposée : la personne doit se reconnecter avec ProConnect en l'utilisant"
                : "Adresse enregistrée : reconnecte-toi avec ProConnect en l'utilisant pour la confirmer",
            );
          }}
        >
          <Input
            label={isAdmin ? "Adresse à proposer" : "Nouvelle adresse"}
            nativeInputProps={{
              type: "email",
              required: true,
              value: newEmail,
              onChange: (e) => setNewEmail(e.target.value),
            }}
          />
          <Button nativeButtonProps={{ type: "submit", disabled: isSaving }}>
            {isAdmin ? "Proposer cette adresse" : "Demander le changement"}
          </Button>
        </form>
      )}

      {settings && !settings.canRequest && isAdmin && (
        <p>
          Reconnecte-toi avec ProConnect pour proposer une adresse à cette
          personne.
        </p>
      )}

      {settings?.expired && (
        <p>
          Ta mission est terminée, tu ne peux plus modifier ton email principal.
        </p>
      )}

      {settings &&
        !settings.expired &&
        !settings.canRequest &&
        !isAdmin &&
        !settings.pending && (
          <>
            <p>
              Pour modifier ton email principal, reconnecte-toi avec ProConnect.
            </p>
            <Button
              priority="secondary"
              nativeButtonProps={{ type: "button" }}
              onClick={() => reconnectWithProConnect()}
            >
              Me reconnecter avec ProConnect
            </Button>
          </>
        )}
    </Accordion>
  );
}
