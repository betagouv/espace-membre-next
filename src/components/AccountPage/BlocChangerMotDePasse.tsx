import React from "react";
import routes, { computeRoute } from "@/routes/routes";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import axios from "axios";

export default function BlocChangerMotDePasse({
    canChangePassword,
    emailSuspended,
    userInfos,
}) {
    const [password, setPassword] = React.useState<string>("");
    return (
        <Accordion label="Changer mon mot de passe">
            {canChangePassword && (
                <>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            axios
                                .post(
                                    computeRoute(
                                        routes.USER_UPDATE_PASSWORD.replace(
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
                                    console.log("Done");
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                        }}
                    >
                        <Input
                            label="Nouveau mot de passe du compte email"
                            hintText="Le mot de passe doit comporter entre 9 et 30 caractères, pas d'accents, et pas
                    d'espace au début ou à la fin."
                            nativeInputProps={{
                                name: "new_password",
                                type: "password",
                                minLength: 9,
                                required: true,
                                onChange: (e) => setPassword(e.target.value),
                            }}
                        />
                        <Button
                            nativeButtonProps={{
                                type: "submit",
                            }}
                        >
                            Changer
                        </Button>
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
