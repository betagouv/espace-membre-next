import { useState } from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";

import { safeManagePrimaryEmailForUser } from "@/app/api/member/actions/managePrimaryEmailForUser";
import { memberBaseInfoSchemaType } from "@/models/member";

export const ChangePrimaryEmail = ({
    userInfos,
}: {
    userInfos: memberBaseInfoSchemaType;
}) => {
    const [newPrimaryEmail, setNewPrimaryEmail] = useState<string>(
        userInfos.primary_email || ""
    );
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    return (
        <Accordion label="Définir/changer l'email primaire pour cette personne">
            {!!alertMessage && (
                <Alert
                    className="fr-mb-8v"
                    severity={alertMessage.type}
                    closable={false}
                    title={alertMessage.title}
                    description={<div>{alertMessage.message}</div>}
                />
            )}
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
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
                }}
            >
                <Input
                    label="Email primaire"
                    hintText="L'email primaire est l'email utilisé comme email principal pour recevoir les communications, se connecter aux services beta.gouv.fr, etc.."
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
                            : `Sauvegarder l'email primaire`
                    }
                />
            </form>
        </Accordion>
    );
};
