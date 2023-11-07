import routes, { computeRoute } from "@/routes/routes";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import axios from "axios";
import React from "react";

export default function BlocConfigurerEmailPrincipal({
    canChangeEmails,
    userInfos,
    primaryEmail,
}) {
    const [value, setValue] = React.useState<string>(primaryEmail);
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    return (
        <Accordion label="Configurer mon email principal">
            <p>
                L'email principal est utilisé pour toutes les communications en
                rapport avec Betagouv. Ce doit être un email d'agent public. Il
                s'agit par défaut de {userInfos.id}@beta.gouv.fr.
                <br />
                <br />
                En cas d'utilisation d'une adresse autre, l'email {userInfos.id}
                @beta.gouv.fr sera supprimé.
            </p>
            {canChangeEmails && (
                <form
                    method="POST"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setIsSaving(true);
                        axios
                            .put(
                                computeRoute(
                                    routes.USER_UPDATE_PRIMARY_EMAIL_API
                                ).replace(":username", userInfos.id),
                                {
                                    primaryEmail: value,
                                },
                                {
                                    withCredentials: true,
                                }
                            )
                            .then((resp) => {
                                setIsSaving(false);
                                console.log(resp);
                            })
                            .catch((err) => {
                                setIsSaving(false);
                                console.log(err);
                            });
                    }}
                >
                    <Input
                        label="Email"
                        nativeInputProps={{
                            type: "email",
                            value,
                            onChange: (e) => {
                                setValue(e.target.value);
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
