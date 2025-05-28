import { useState } from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";

import { safeChangeSecondaryEmailForUser } from "@/app/api/member/actions";
import { memberBaseInfoSchemaType } from "@/models/member";

export const ChangeSecondaryEmail = ({
    userInfos,
}: {
    userInfos: memberBaseInfoSchemaType;
}) => {
    const [newSecondaryEmail, setNewSecondaryEmail] = useState<string>(
        userInfos.secondary_email,
    );
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    return (
        <Accordion label="Définir/changer l'email secondaire pour cette personne">
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
                    const res = await safeChangeSecondaryEmailForUser(
                        newSecondaryEmail,
                        userInfos.username,
                    );
                    setIsSaving(false);
                    if (res.success) {
                        setAlertMessage({
                            title: "Email secondaire mis à jour",
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
                    label="Email secondaire"
                    hintText="L'email secondaire est utile pour récupérer son mot de passe ou garder contact après ton départ."
                    nativeInputProps={{
                        name: "secondaryEmail",
                        defaultValue: newSecondaryEmail,
                        type: "email",
                        onChange: (e) => {
                            setNewSecondaryEmail(e.target.value);
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
                            : `Sauvegarder l'email secondaire`
                    }
                />
            </form>
        </Accordion>
    );
};
