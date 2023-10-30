import axios from "axios";
import React from "react";
import routes, { computeRoute } from "@/routes/routes";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import Button from "@codegouvfr/react-dsfr/Button";

export default function BlocConfigurerCommunicationEmail({
    primaryEmail,
    secondaryEmail,
    communication_email,
}) {
    const [value, setValue] = React.useState<
        "primary" | "secondary" | undefined
    >(communication_email);

    return (
        <Accordion label="Quel email utiliser pour les communications @beta.gouv.fr ?">
            {!!primaryEmail &&
                !secondaryEmail &&
                `Tu n'as qu'une seule adresse ${primaryEmail}. Ajoute une adresse secondaire pour choisir sur quelles adresses tu souhaites recevoir les communications`}
            {!!primaryEmail && !!secondaryEmail && (
                <form
                    method="POST"
                    onSubmit={() => {
                        axios.put(
                            computeRoute(routes.USER_UPDATE_SECONDARY_EMAIL),
                            {
                                communication_email,
                            }
                        );
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
                        }}
                    >
                        Sauvegarder
                    </Button>
                </form>
            )}
        </Accordion>
    );
}
