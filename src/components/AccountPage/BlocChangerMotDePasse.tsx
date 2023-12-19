import React from "react";
import routes, { computeRoute } from "@/routes/routes";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import { PasswordInput } from "@codegouvfr/react-dsfr/blocks/PasswordInput";
import axios from "axios";
import Alert from "@codegouvfr/react-dsfr/Alert";

export default function BlocChangerMotDePasse({
    canChangePassword,
    emailSuspended,
    userInfos,
}) {
    const [password, setPassword] = React.useState<string>("");
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    }>();
    return (
        <Accordion label="Changer mon mot de passe">
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
                                            userInfos.id
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

                                    console.log("Done");
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
            {!canChangePassword && emailSuspended && (
                <p>
                    Il faut mettre à jour votre date de fin de mission et merger
                    la pull request avant de pouvoir changer votre mot de passe
                </p>
            )}
            {!canChangePassword && !emailSuspended && (
                <p>
                    Sans compte email, vous n'avez pas la possibilité de changer
                    de mot de passe.
                </p>
            )}
        </Accordion>
    );
}
