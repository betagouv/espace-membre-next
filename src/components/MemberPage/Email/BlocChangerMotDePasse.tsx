import React, { useCallback, useMemo } from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert, { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import {
    PasswordInput,
    PasswordInputProps,
} from "@codegouvfr/react-dsfr/blocks/PasswordInput";
import Button from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";
import axios from "axios";

import { EmailStatusCode, memberBaseInfoSchemaType } from "@/models/member";
import routes, { computeRoute } from "@/routes/routes";

function PasswordChange({ username }: { username: string }) {
    const [password, setPassword] = React.useState<string>("");
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: AlertProps.Severity;
    }>();
    const onSubmit = (e) => {
        e.preventDefault();
        setIsSaving(true);
        setAlertMessage(undefined);
        axios
            .post(
                computeRoute(
                    routes.USER_UPDATE_PASSWORD_API.replace(
                        ":username",
                        username
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
    };
    const onPasswordChange = (e) => {
        setPassword(e.target.value);
    };
    const messages = useMemo(
        () =>
            (alertMessage && [
                {
                    severity:
                        alertMessage.type === "warning"
                            ? ("error" as PasswordInputProps.Severity)
                            : ("valid" as PasswordInputProps.Severity),
                    message: alertMessage.message,
                },
            ]) || [
                {
                    message: (
                        <>
                            Le mot de passe doit :
                            <br />
                            - contenir de 14 à 30 caractères,
                            <br />
                            - des majuscules et des minuscules ainsi que des
                            caractères spéciaux,
                            <br />
                            - pas de caractères spéciaux au début ou à la fin,
                            <br />- ne doit pas contenir tout ou partie du nom
                            de compte utilisateur
                        </>
                    ),
                    severity: "info" as PasswordInputProps.Severity,
                },
            ],
        [alertMessage]
    );
    return (
        <form onSubmit={onSubmit}>
            <PasswordInput
                className={fr.cx("fr-mb-2w")}
                label="Nouveau mot de passe du compte email"
                hintText="Ce mot de passe vous permettra d'accéder à votre compte email"
                messages={messages}
                messagesHint={null}
                nativeInputProps={{
                    name: "new_password",
                    minLength: 14,
                    required: true,
                    onChange: onPasswordChange,
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
    );
}
export default function BlocChangerMotDePasse({
    canChangePassword,
    userInfos,
    status,
}: {
    canChangePassword: boolean;
    status: EmailStatusCode;
    userInfos: memberBaseInfoSchemaType;
}) {
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
            {canChangePassword ? (
                <PasswordChange username={userInfos.username} />
            ) : status === EmailStatusCode.EMAIL_SUSPENDED ? (
                <p>
                    Il faut mettre à jour votre date de fin de mission et merger
                    la pull request avant de pouvoir changer votre mot de passe
                </p>
            ) : (
                <p>
                    Sans compte email, vous n'avez pas la possibilité de changer
                    de mot de passe.
                </p>
            )}
        </Accordion>
    );
}
