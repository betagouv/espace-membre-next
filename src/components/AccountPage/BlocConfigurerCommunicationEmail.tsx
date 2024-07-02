import React from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";

import { updateCommunicationEmail } from "@/app/api/member/actions";
import {
    CommunicationEmailCode,
    memberBaseInfoSchemaType,
} from "@/models/member";

export default function BlocConfigurerCommunicationEmail({
    userInfos: { communication_email, primary_email, secondary_email },
}: {
    userInfos: memberBaseInfoSchemaType;
}) {
    const [value, setValue] = React.useState<
        CommunicationEmailCode.PRIMARY | CommunicationEmailCode.SECONDARY
    >(communication_email);
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    return (
        <Accordion label="Quel email utiliser pour les communications @beta.gouv.fr ?">
            {!!primary_email &&
                !secondary_email &&
                `Tu n'as qu'une seule adresse ${primary_email}. Ajoute une adresse secondaire pour choisir sur quelles adresses tu souhaites recevoir les communications`}
            {!!primary_email && !!secondary_email && (
                <form
                    method="POST"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSaving(true);
                        try {
                            await updateCommunicationEmail(value);
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
                                label: primary_email,
                                nativeInputProps: {
                                    defaultChecked:
                                        value ===
                                        CommunicationEmailCode.PRIMARY,
                                    checked:
                                        value ===
                                        CommunicationEmailCode.PRIMARY,
                                    onChange: () =>
                                        setValue(
                                            CommunicationEmailCode.PRIMARY
                                        ),
                                },
                            },
                            {
                                label: secondary_email,
                                nativeInputProps: {
                                    defaultChecked:
                                        value ===
                                        CommunicationEmailCode.SECONDARY,
                                    checked:
                                        value ===
                                        CommunicationEmailCode.SECONDARY,
                                    onChange: () =>
                                        setValue(
                                            CommunicationEmailCode.SECONDARY
                                        ),
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
