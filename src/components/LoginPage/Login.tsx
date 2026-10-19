"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import ProConnectButton from "@codegouvfr/react-dsfr/ProConnectButton";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
import { LegacyEmailLoginForm } from "@/components/LegacyEmailLogin/LegacyEmailLoginForm";

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
    "Aucun membre ne correspond à ce compte. Connecte-toi avec ton adresse @beta.gouv.fr ou ton adresse du service public (pas ton email personnel).",
  SecondaryEmailNotAllowed:
    "Cette adresse est ton email perso sur ta fiche, elle ne sert pas à te connecter. Connecte-toi avec ton email principal, puis passe cette adresse en principal depuis ta fiche, ou demande-le au support.",
  ExpiredMember: `Ce membre a une date de fin expirée ou pas de mission définie.`,
  MfaRequired:
    "Vous ne pouvez pas accéder au service sans avoir une double authentification installée. Veuillez installer une application d'authentification et vous connecter à nouveau.",
  // legacy-email-login: remove with src/lib/auth/legacyEmailLogin
  EmailLoginClosed:
    "La connexion par email n'est plus disponible pour ton compte. Connecte-toi avec ProConnect.",
  ExtEmailNotAllowed:
    "Les adresses @ext.beta.gouv.fr ne permettent pas de se connecter avec ProConnect. Utilise ton adresse @beta.gouv.fr.",
  MemberNotReady:
    "Ta fiche n'est pas encore validée, ou ton adresse de connexion est en cours de création. Réessaie plus tard ou rapproche-toi de ton incubateur.",
};

// development only, see fakeProConnect.ts
const FakeProConnectForm = ({ next }: { next: string | null }) => {
  const [email, setEmail] = React.useState("");
  return (
    <form
      className={fr.cx("fr-mb-3w", "fr-p-2w")}
      style={{ border: "2px dashed var(--border-plain-warning)" }}
      onSubmit={(e) => {
        e.preventDefault();
        signIn("fake-proconnect", {
          email,
          callbackUrl: next || "/dashboard",
        });
      }}
    >
      <p className={fr.cx("fr-text--sm", "fr-mb-1w")}>
        <strong>Développement</strong> : connexion ProConnect simulée, sans mot
        de passe.
      </p>
      <Input
        label="Email renvoyé par ProConnect"
        hintText="Adresse principale d'un membre présent en base (pas son email personnel)"
        nativeInputProps={{
          type: "email",
          required: true,
          value: email,
          placeholder: "prenom.nom@beta.gouv.fr",
          onChange: (e) => setEmail(e.target.value),
        }}
      />
      <Button type="submit" priority="secondary">
        Simuler la connexion ProConnect
      </Button>
    </form>
  );
};

export const LoginPage = function ({
  fakeProConnect = false,
  // legacy-email-login: remove with src/lib/auth/legacyEmailLogin
  legacyEmailLogin = null,
}: {
  fakeProConnect?: boolean;
  // legacy-email-login: remove with src/lib/auth/legacyEmailLogin
  legacyEmailLogin?: {
    mode: "transition" | "exceptions";
    endDate: string | null;
  } | null;
}) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const next = searchParams.get("next");

  const errorMessage =
    (error && oAuthErrors[decodeURIComponent(error)]) ||
    "Impossible de se connecter";
  // legacy-email-login: remove with src/lib/auth/legacyEmailLogin
  // members who used ProConnect with their personal email, or without MFA,
  // before it became mandatory
  const legacyEmailLoginHint =
    legacyEmailLogin?.mode === "transition" &&
    (error === "UnknownMember" ||
      error === "SecondaryEmailNotAllowed" ||
      error === "MfaRequired" ||
      error === "ExtEmailNotAllowed")
      ? " Pendant la transition, tu peux encore te connecter par email avec le formulaire ci-dessous."
      : "";

  const connectForm = (
    <div
      style={{
        padding: "4rem",
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <h2 className="fr-h3">Me connecter</h2>
      <p className="fr-text--sm">
        Connecte-toi avec ProConnect en utilisant ton adresse{" "}
        <strong>@beta.gouv.fr</strong> ou ton adresse du service public.
      </p>
      <div className={fr.cx("fr-mb-3w")}>
        <ProConnectButton
          onClick={() =>
            signIn("proconnect", next ? { callbackUrl: next } : undefined)
          }
        />
      </div>
      {fakeProConnect && <FakeProConnectForm next={next} />}
      {/* legacy-email-login: remove with src/lib/auth/legacyEmailLogin */}
      {legacyEmailLogin && (
        <LegacyEmailLoginForm
          mode={legacyEmailLogin.mode}
          endDate={legacyEmailLogin.endDate}
          next={next}
        />
      )}
      <p className="fr-text--sm">
        Accès à ta boîte perdu ou impossible de te connecter ?{" "}
        <Link href="/support">Consulte la page d'aide</Link>
      </p>
    </div>
  );

  return (
    <>
      <div className={fr.cx("fr-grid-row", "fr-m-4w")}>
        {!!error && (
          <div className={fr.cx("fr-col-md-12", "fr-p-2w")}>
            <Alert
              className="fr-mb-8v"
              severity="warning"
              closable={false}
              description={`${errorMessage}${legacyEmailLoginHint}`}
              title="Erreur"
            />
          </div>
        )}
        <ConnectBlock>{connectForm}</ConnectBlock>
      </div>
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
    </>
  );
};
