import React from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import axios from "axios";

import { changeSecondaryEmailForUser } from "@/app/api/member/actions";
import { useSession } from "@/proxies/next-auth";
import routes, { computeRoute } from "@/routes/routes";

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
                        changeSecondaryEmailForUser(
                            value,
                            sessionWrapper.data?.user?.name!
                        )
                            .then((data) => {
                                setIsSaving(false);
                            })
                            .catch((e) => {
                                setIsSaving(false);
                                console.error(e);
                            });
                    }}
                >
                    <Input
                        label="Email"
                        hintText="Attention les emails en @octo.com ne sont pas conseillés à cause de probleme de déliverabilité"
                        nativeInputProps={{
                            type: "email",
                            value: value,
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
                                : `Sauvegarder l'email secondaire`
                        }
                    />
                </form>
            )}
        </Accordion>
    );
}
