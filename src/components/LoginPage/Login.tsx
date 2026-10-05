"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import ProConnectButton from "@codegouvfr/react-dsfr/ProConnectButton";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

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
  ExpiredMember: `Ce membre a une date de fin expirée ou pas de mission définie.`,
};

export const LoginPage = function () {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const next = searchParams.get("next");

  const errorMessage =
    (error && oAuthErrors[decodeURIComponent(error)]) ||
    "Impossible de se connecter";

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
              description={errorMessage}
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
