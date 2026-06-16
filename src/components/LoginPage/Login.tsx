"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import ProConnectButton from "@codegouvfr/react-dsfr/ProConnectButton";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import config from "@/frontConfig";

const ConnectBlock = ({ children }) => {
  return (
    <>
      <div className={fr.cx("fr-col-md-6")}>
        <h1
          className={fr.cx("fr-mb-1v")}
          style={{
            color: "var(--text-action-high-blue-france)",
          }}
        >
          Espace membre
        </h1>
        <p
          className={fr.cx("fr-text--bold", "fr-text--bold")}
          style={{
            color: "var(--text-action-high-blue-france)",
          }}
        >
          de la communauté beta.gouv.fr
        </p>
        <ul style={{ listStyleType: "none" }}>
          <li>
            <span
              style={{
                color: "var(--text-action-high-blue-france)",
                marginRight: "1rem",
              }}
            >
              ✔
            </span>{" "}
            pour gérer ses <strong>informations personnelles</strong>
          </li>
          <li>
            <span
              style={{
                color: "var(--text-action-high-blue-france)",
                marginRight: "1rem",
              }}
            >
              ✔
            </span>{" "}
            pour publier sa <strong>fiche produit</strong>
          </li>
          <li>
            <span
              style={{
                color: "var(--text-action-high-blue-france)",
                marginRight: "1rem",
              }}
            >
              ✔
            </span>{" "}
            pour <strong>se former</strong>
          </li>
          <li>
            <span
              style={{
                color: "var(--text-action-high-blue-france)",
                marginRight: "1rem",
              }}
            >
              ✔
            </span>{" "}
            pour accéder <strong>aux actualités</strong>
          </li>
        </ul>
        <img src="/static/images/home-illustration.png" alt="" width={300} />
      </div>
      <div className={fr.cx("fr-col-md-6")}>{children}</div>
    </>
  );
};

const oAuthErrors = {
  OAuthCallback: "Impossible de se connecter via ProConnect",
  OAuthSignin: "Impossible de se connecter via ProConnect",
  UnknownMember:
    "Membre inconnu dans la communauté, veuillez contacter votre équipe référente.",
  ExpiredMember: `Ce membre a une date de fin expirée ou pas de mission définie.`,
};

export const LoginPage = function () {
  const searchParams = useSearchParams();
  const secondary_email = searchParams.get("secondary_email");

  const [formErrors, setFormErrors] = React.useState<string>();
  const [email, setEmail] = React.useState(secondary_email || "");
  const [isFirstTime, setIsFirstTime] = React.useState(secondary_email);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  const errorQuery = decodeURIComponent(searchParams.get("error") || "");

  const showProConnect = !!config.FEATURE_SHOW_PROCONNECT_LOGIN;

  const errorMessage =
    (errorQuery &&
      searchParams.get("error") &&
      oAuthErrors[searchParams.get("error") || errorQuery]) ||
    "Impossible de se connecter";

  const [alertMessage, setAlertMessage] = React.useState<{
    message: string;
    type: "success" | "warning";
    description?: string;
  } | null>(
    searchParams.get("error")
      ? {
          message: "Erreur",
          type: "warning",
          description: errorMessage,
        }
      : null,
  );
  const next = searchParams.get("next");

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
        if (data.error === "Error: UnknownMember") {
          setFormErrors(oAuthErrors["UnknownMember"]);
        } else if (data.error === "Error: ExpiredMember") {
          setFormErrors(oAuthErrors["ExpiredMember"]);
        } else {
          setFormErrors(data.error);
        }
      } else if (data && data.ok && !data.error) {
        setAlertMessage({
          message:
            "Un email avec un lien de connexion a été envoyé à ton adresse.",
          type: "success",
        });
      }
    } catch (e) {
      setIsSaving(false);

      console.log("error", e);
    }
  };

  const connectForm = showProConnect ? (
    <form
      onSubmit={sendLogin}
      method="POST"
      id="login_form"
      noValidate
      style={{
        padding: "4rem",
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <fieldset
        className="fr-fieldset"
        id="login-1760-fieldset"
        aria-labelledby="login-1760-fieldset-legend login-1760-fieldset-messages"
      >
        <legend className="fr-fieldset__legend" id="login-1760-fieldset-legend">
          <h2 className="fr-h3">Me connecter</h2>
        </legend>
      </fieldset>
      <div className={fr.cx("fr-mb-3w")}>
        <div className={fr.cx("fr-mb-1w")}>
          <Badge severity="success" small noIcon>
            Recommandé
          </Badge>
        </div>
        <ProConnectButton onClick={() => signIn("proconnect")} />
      </div>
      <p className={fr.cx("fr-hr-or")} aria-hidden="true">
        ou
      </p>
      <Accordion label="Se connecter par email" titleAs="h3">
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
      <hr className={fr.cx("fr-mt-2w")} />
    </form>
  ) : (
    <form
      onSubmit={sendLogin}
      method="POST"
      id="login_form"
      style={{
        padding: "4rem",
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <fieldset
        className="fr-fieldset"
        id="login-1760-fieldset"
        aria-labelledby="login-1760-fieldset-legend login-1760-fieldset-messages"
      >
        <legend className="fr-fieldset__legend" id="login-1760-fieldset-legend">
          <h2 className="fr-h3">Me connecter</h2>
        </legend>
      </fieldset>
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
          },
        ]}
      />
      <hr />
    </form>
  );

  return (
    <>
      <div className={fr.cx("fr-grid-row", "fr-m-4w")}>
        {!!alertMessage && (
          <div className={fr.cx("fr-col-md-12", "fr-p-2w")}>
            <Alert
              className="fr-mb-8v"
              severity={alertMessage.type}
              closable={false}
              description={alertMessage.description}
              title={alertMessage.message}
            />
          </div>
        )}
        {!!isFirstTime && (
          <>
            <div className={fr.cx("fr-col-md-12", "fr-p-2w")}>
              <center>
                <Alert
                  className="fr-mb-12v"
                  severity={"info"}
                  closable={false}
                  description={`Pour ta première connexion clique sur le bouton suivant pour recevoir un lien de connexion. Tu vas recevoir ce lien sur ton adresse ${email}.`}
                  title={"Bienvenue sur l'espace-membre ! "}
                />
                <form onSubmit={sendLogin} method="POST" id="login_form">
                  <Button
                    nativeButtonProps={{
                      onClick: () => {},
                      disabled: isSaving,
                      type: "submit",
                    }}
                    children={
                      isSaving
                        ? "Envoi du lien de connexion..."
                        : "Recevoir le lien de connexion"
                    }
                  />
                </form>
              </center>
            </div>
          </>
        )}
        {!isFirstTime && <ConnectBlock>{connectForm}</ConnectBlock>}
      </div>
      {!isFirstTime && (
        <div
          className={fr.cx("fr-grid-row")}
          style={{ border: "1px solid #ccc", width: "100%" }}
        >
          <div className={fr.cx("fr-col-md-12", "fr-p-2w")}>
            <h2 className="fr-h3">Accueillir une nouvelle recrue ?&nbsp;👋</h2>
            <p className="fr-text--sm">
              La création d'une nouvelle fiche membre doit être initiée{" "}
              <strong>par une personne déjà membre</strong> de la communauté
              beta.gouv.fr.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
