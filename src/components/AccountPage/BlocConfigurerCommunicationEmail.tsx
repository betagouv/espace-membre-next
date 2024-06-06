import React from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import axios from "axios";

import { updateCommunicationEmail } from "@/app/api/member/actions";
import routes, { computeRoute } from "@/routes/routes";

export default function BlocConfigurerCommunicationEmail({
    primaryEmail,
    secondaryEmail,
    communication_email,
}) {
    const [value, setValue] = React.useState<
        "primary" | "secondary" | undefined
    >(communication_email);
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    return (
        <Accordion label="Quel email utiliser pour les communications @beta.gouv.fr ?">
            {!!primaryEmail &&
                !secondaryEmail &&
                `Tu n'as qu'une seule adresse ${primaryEmail}. Ajoute une adresse secondaire pour choisir sur quelles adresses tu souhaites recevoir les communications`}
            {!!primaryEmail && !!secondaryEmail && (
                <form
                    method="POST"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSaving(true);
                        try {
                            await updateCommunicationEmail(communication_email);
                        } catch (e) {
                            setIsSaving(false);
                            console.error(e);
                        }
                        setIsSaving(false);
                    }}
                >
                    <RadioButtons
                        legend="Choisi l'email a utiliser pour recevoir les emails de communications @beta.gouv.fr"
                        options={[
                            {
                                label: primaryEmail,
                                nativeInputProps: {
                                    defaultChecked: value === "primary",
                                    checked: value === "primary",
                                    onChange: () => setValue("primary"),
                                },
                            },
                            {
                                label: secondaryEmail,
                                nativeInputProps: {
                                    defaultChecked: value === "secondary",
                                    checked: value === "secondary",
                                    onChange: () => setValue("secondary"),
                                },
                            },
                        ]}
                    />
                    <Button
                        nativeButtonProps={{
                            type: "submit",
                            disabled: isSaving,
                        }}
                        children={
                            isSaving ? `Sauvegarde en cours...` : `Sauvegarder`
                        }
                    />
                </form>
            )}
        </Accordion>
    );
}
