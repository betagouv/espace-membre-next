import React, { useState } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";

import { safeManagePrimaryEmailForUser } from "@/app/api/member/actions/managePrimaryEmailForUser";
import { memberBaseInfoSchemaType } from "@/models/member";

export default function BlocConfigurerEmailPrincipal({
  canChangeEmails,
  isAdmin,
  userInfos,
}: {
  canChangeEmails: boolean;
  isAdmin?: boolean;
  userInfos: memberBaseInfoSchemaType;
}) {
  const [newPrimaryEmail, setNewPrimaryEmail] = useState<string>(
    userInfos.primary_email || "",
  );
  const [alertMessage, setAlertMessage] = useState<{
    title: string;
    message: NonNullable<React.ReactNode>;
    type: "success" | "warning";
  } | null>();
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  return (
    <Accordion
      label={
        isAdmin
          ? `Définir/changer l'email primaire pour cette personne`
          : `Configurer mon email principal`
      }
    >
      {!!alertMessage && (
        <Alert
          className="fr-mb-8v"
          severity={alertMessage.type}
          closable={false}
          title={alertMessage.title}
          description={<div>{alertMessage.message}</div>}
        />
      )}
      <p>
        L'email principal est utilisé pour toutes les communications en rapport
        avec Betagouv. Ce doit être un email d'agent public. Il s'agit par
        défaut de {userInfos.primary_email}. .
      </p>
      <p>
        <i className={fr.cx("fr-icon--md", "fr-icon-warning-fill")} /> L'email
        du compte mattermost doit être le même que l'adresse primaire. Pensez à
        le changer si ce n'est pas le cas.
      </p>
      {(canChangeEmails || isAdmin) && (
        <form
          method="POST"
          onSubmit={async (e) => {
            e.preventDefault();
            const confirmed = confirm(
              "Êtes-vous vraiment certain(e) de vouloir changer cet email ?",
            );
            if (confirmed) {
              setIsSaving(true);
              const res = await safeManagePrimaryEmailForUser({
                primaryEmail: newPrimaryEmail,
                username: userInfos.username,
              });
              setIsSaving(false);
              if (res.success) {
                setAlertMessage({
                  title: "Email primaire mis à jour",
                  message: "",
                  type: "success",
                });
              } else {
                setAlertMessage({
                  title: "Une erreur est survenue",
                  message: res.message || "",
                  type: "warning",
                });
              }
            }
          }}
        >
          <Input
            label="Email"
            nativeInputProps={{
              name: "primaryEmail",
              defaultValue: newPrimaryEmail,
              type: "email",
              onChange: (e) => {
                setNewPrimaryEmail(e.target.value);
              },
            }}
          />
          <Button
            nativeButtonProps={{
              type: "submit",
              disabled: isSaving,
            }}
            children={
              isSaving
                ? `Sauvegarde en cours...`
                : `Sauvegarder l'email principal`
            }
          />
        </form>
      )}
    </Accordion>
  );
}
