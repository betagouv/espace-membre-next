import { useSession } from "@/proxies/next-auth";
import routes, { computeRoute } from "@/routes/routes";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import axios from "axios";
import React from "react";

export default function BlocConfigurerEmailSecondaire({
    canChangeEmails,
    secondaryEmail,
}) {
    const sessionWrapper = useSession();
    const [value, setValue] = React.useState(secondaryEmail);
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    return (
        <Accordion label="Configurer mon email secondaire">
            <p>
                L'email secondaire est utile pour récupérer son mot de passe ou
                garder contact après ton départ.
            </p>
            {canChangeEmails && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setIsSaving(true);
                        axios
                            .post(
                                computeRoute(
                                    routes.USER_UPDATE_SECONDARY_EMAIL
                                ).replace(
                                    ":username",
                                    sessionWrapper.data?.user?.name
                                ),
                                {
                                    secondaryEmail: value,
                                },
                                {
                                    withCredentials: true,
                                }
                            )
                            .then((data) => {
                                setIsSaving(false);
                                console.log(data);
                            })
                            .catch((e) => {
                                setIsSaving(false);
                                console.log(e);
                            });
                    }}
                >
                    <Input
                        label="Email"
                        nativeInputProps={{
                            type: "email",
                            value: value,
                            onChange: (e) => {
                                console.log(e.target.value);
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
                                : `Sauvegarder l'email secondaire`
                        }
                    />
                </form>
            )}
        </Accordion>
    );
}
