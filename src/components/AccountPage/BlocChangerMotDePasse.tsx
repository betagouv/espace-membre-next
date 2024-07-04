import React from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { PasswordInput } from "@codegouvfr/react-dsfr/blocks/PasswordInput";
import Button from "@codegouvfr/react-dsfr/Button";
import axios from "axios";

import { EmailStatusCode, memberBaseInfoSchemaType } from "@/models/member";
import routes, { computeRoute } from "@/routes/routes";

export default function BlocChangerMotDePasse({
    canChangePassword,
    userInfos,
    status,
}: {
    canChangePassword: boolean;
    status: EmailStatusCode;
    userInfos: memberBaseInfoSchemaType;
}) {
    const [password, setPassword] = React.useState<string>("");
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    }>();
    return (
        <Accordion
            label={
                <span id="password">
                    {status ===
                    EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING
                        ? "Définir mon mot de passe"
                        : "Changer mon mot de passe"}
                </span>
            }
        >
            {!!alertMessage && (
                <Alert
                    className="fr-mb-8v"
                    severity={alertMessage.type}
                    closable={true}
                    title={alertMessage.title}
                    description={alertMessage.message}
                />
            )}
            {canChangePassword && (
                <>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setIsSaving(true);
                            axios
                                .post(
                                    computeRoute(
                                        routes.USER_UPDATE_PASSWORD_API.replace(
                                            ":username",
                                            userInfos.username
                                        )
                                    ),
                                    {
                                        new_password: password,
                                    },
                                    {
                                        withCredentials: true,
                                    }
                                )
                                .then(() => {
                                    setTimeout(() => {
                                        // timeout to let user understand that function ran
                                        setIsSaving(false);
                                        setAlertMessage({
                                            title: `Mot de passe mis à jour avec succès`,
                                            message: `Ton mot de passe a été mis à jour, tu peux maintenant l'utiliser sur le webmail ou dans ton client email.`,
                                            type: "success",
                                        });
                                    }, 1000);
                                })
                                .catch((err) => {
                                    setIsSaving(false);
                                    setAlertMessage({
                                        title: "Une erreur est survenue",
                                        message: `Réessayer plus tard, si l'erreur persiste contacter espace-membre@beta.gouv.fr. Erreur : ${err?.response?.data?.error}`,
                                        type: "warning",
                                    });
                                });
                        }}
                    >
                        <PasswordInput
                            label="Nouveau mot de passe du compte email"
                            hintText="Le mot de passe doit comporter entre 14 et 30 caractères, pas d'accents, et pas
                    d'espace au début ou à la fin."
                            nativeInputProps={{
                                name: "new_password",
                                minLength: 14,
                                required: true,
                                onChange: (e) => setPassword(e.target.value),
                            }}
                        />
                        <Button
                            nativeButtonProps={{
                                type: "submit",
                                disabled: isSaving,
                            }}
                            children={
                                isSaving
                                    ? `Changement du mot de passe...`
                                    : `Changer le mot de passe`
                            }
                        />
                    </form>
                </>
            )}
            {!canChangePassword &&
                status === EmailStatusCode.EMAIL_SUSPENDED && (
                    <p>
                        Il faut mettre à jour votre date de fin de mission et
                        merger la pull request avant de pouvoir changer votre
                        mot de passe
                    </p>
                )}
            {!canChangePassword &&
                status !== EmailStatusCode.EMAIL_SUSPENDED && (
                    <p>
                        Sans compte email, vous n'avez pas la possibilité de
                        changer de mot de passe.
                    </p>
                )}
        </Accordion>
    );
}
