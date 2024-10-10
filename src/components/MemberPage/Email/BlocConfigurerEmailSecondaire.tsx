import React from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { useSession } from "next-auth/react";

import { safeChangeSecondaryEmailForUser } from "@/app/api/member/actions";

export default function BlocConfigurerEmailSecondaire({
    canChangeEmails,
    secondaryEmail,
}) {
    const sessionWrapper = useSession();
    const [value, setValue] = React.useState(secondaryEmail);
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    return (
        <Accordion label="Configurer mon email secondaire">
            <p>
                L'email secondaire est utile pour récupérer son mot de passe ou
                garder contact après ton départ.
            </p>
            {canChangeEmails && (
                <>
                    {!!alertMessage && (
                        <Alert
                            className="fr-mb-8v"
                            severity={alertMessage.type}
                            closable={false}
                            title={alertMessage.title}
                            description={<div>{alertMessage.message}</div>}
                        />
                    )}
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setIsSaving(true);
                            const res = await safeChangeSecondaryEmailForUser(
                                value,
                                sessionWrapper.data?.user.id!
                            );
                            setIsSaving(false);

                            if (res.success) {
                                setAlertMessage({
                                    title: "Email secondaire mis à jour",
                                    message: "",
                                    type: "success",
                                });
                            } else {
                                setAlertMessage({
                                    title: "Une erreur est survenue",
                                    message: res.message || "",
                                    type: "warning",
                                });
                            }
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
                </>
            )}
        </Accordion>
    );
}
