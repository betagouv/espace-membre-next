"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { signIn } from "next-auth/react";

// legacy-email-login: remove with src/lib/auth/legacyEmailLogin

const oAuthErrors = {
  UnknownMember:
    "Membre inconnu dans la communauté, veuillez contacter votre équipe référente.",
  ExpiredMember: `Ce membre a une date de fin expirée ou pas de mission définie.`,
  TooManyAttempts:
    "Trop de tentatives de connexion pour cette adresse, réessaie dans quelques minutes.",
  MemberNotReady:
    "Ta fiche n'est pas encore validée, ou ton adresse de connexion est en cours de création.",
  EmailLoginClosed:
    "La connexion par email n'est plus disponible pour ton compte. Connecte-toi avec ProConnect.",
};

export const LegacyEmailLoginForm = ({
  mode,
  endDate,
  next,
}: {
  mode: "transition" | "exceptions";
  endDate: string | null;
  next: string | null;
}) => {
  const [formErrors, setFormErrors] = React.useState<string>();
  const [email, setEmail] = React.useState("");
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [alertMessage, setAlertMessage] = React.useState<{
    message: string;
    type: "success" | "warning";
    description?: string;
  } | null>(null);

  const sendLogin = async (event: { preventDefault: () => void }) => {
    if (isSaving) {
      return;
    }
    event.preventDefault();
    setFormErrors("");
    setIsSaving(true);
    setAlertMessage(null);

    try {
      const data = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: next ? next : undefined,
      });
      setIsSaving(false);

      if (data && data.error) {
        setIsSaving(false);
        const code = data.error.replace(/^Error: /, "");
        setFormErrors(oAuthErrors[code] || data.error);
      } else if (data && data.ok && !data.error) {
        setAlertMessage({
          message:
            "Un email avec un lien de connexion a été envoyé à ton adresse.",
          type: "success",
        });
      }
    } catch (e) {
      setIsSaving(false);
      setFormErrors(e instanceof Error ? e.message : String(e));
      console.log("error", e);
    }
  };

  return (
    <>
      {!!alertMessage && (
        <Alert
          className="fr-mb-4v"
          severity={alertMessage.type}
          closable={false}
          description={alertMessage.description}
          title={alertMessage.message}
        />
      )}
      <p className={fr.cx("fr-hr-or")} aria-hidden="true">
        ou
      </p>
      <form onSubmit={sendLogin} method="POST" id="login_form" noValidate>
        <Accordion label="Se connecter par email" titleAs="h3">
          <p className="fr-text--sm">
            {mode === "transition"
              ? `La connexion par email disparaît${endDate ? ` le ${endDate}` : " bientôt"}. Elle reste ouverte aux comptes existants qui ne se sont pas encore connectés avec ProConnect.`
              : "La connexion par email n'est plus ouverte que sur autorisation du support."}
          </p>
          <Input
            hintText="Tu peux te connecter avec ton email en @beta.gouv.fr ou avec ton email secondaire."
            label="Mon email"
            nativeInputProps={{
              type: "email",
              placeholder: "prenom.nom@beta.gouv.fr",
              onChange: (e) => setEmail(e.target.value),
              required: true,
              defaultValue: email,
            }}
            state={formErrors ? "error" : "default"}
            stateRelatedMessage={formErrors}
          />
          <ButtonsGroup
            buttons={[
              {
                children: isSaving
                  ? "Envoi du lien de connexion..."
                  : "Recevoir le lien de connexion",
                onClick: () => {},
                disabled: isSaving,
                type: "submit",
                priority: "secondary",
              },
            ]}
          />
        </Accordion>
      </form>
      <hr className={fr.cx("fr-mt-2w")} />
    </>
  );
};
