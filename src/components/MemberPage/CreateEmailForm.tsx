import { memberBaseInfoSchemaType } from "@/models/member";
import routes, { computeRoute } from "@/routes/routes";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";

export const CreateEmailForm = ({
    userInfos,
    hasPublicServiceEmail,
}: {
    userInfos: memberBaseInfoSchemaType;
    hasPublicServiceEmail: boolean;
}) => {
    const [email, setValue] = useState<string>(userInfos.secondary_email);
    const [alertMessage, setAlertMessage] = useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(
                computeRoute(
                    routes.USER_CREATE_EMAIL_API.replace(
                        ":username",
                        userInfos.username
                    )
                ),
                {
                    method: "POST",
                    credentials: "include", // This is equivalent to `withCredentials: true`
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({}),
                }
            );

            if (!response.ok) {
                const body = await response.json();
                throw new Error(body.errors);
            }

            setAlertMessage({
                title: `L'email est en cours de création`,
                message: `L'email est en train d'être créé. ${userInfos.fullname} recevra un message dès que celui-ci sera actif.`,
                type: "success",
            });
        } catch (e) {
            if (e instanceof Error) {
                setAlertMessage({
                    title: `Une erreur est survenue`,
                    message: e.message,
                    type: "warning",
                });
            }
        }
    };
    return (
        <>
            <p>Tu peux créer un compte email pour {userInfos.fullname}.</p>
            {hasPublicServiceEmail && (
                <p>
                    Attention s'iel a une adresse de service public en adresse
                    primaire. L'adresse @beta.gouv.fr deviendra son adresse
                    primaire : celle à utiliser pour mattermost, et d'autres
                    outils.
                </p>
            )}
            <br />
            <Alert
                severity="info"
                title={`Vérifie que ${userInfos.fullname} ait accès à son adresse ${userInfos.secondary_email}`}
                description={`Les informations de connexion seront envoyées sur ${userInfos.secondary_email} vérifie que ${userInfos.fullname} a toujours accès à cet email, sinon il faudra demander à un admin via le canal mattermost ~incubateur-entraide-communaute de changer cet email.`}
            />
            <br />
            {!!alertMessage && (
                <Alert
                    className="fr-mb-8v"
                    severity={alertMessage.type}
                    closable={false}
                    description={alertMessage.message}
                    title={alertMessage.title}
                />
            )}
            <form onSubmit={onSubmit}>
                <Button
                    nativeButtonProps={{
                        type: "submit",
                    }}
                >
                    Créer un compte
                </Button>
            </form>
        </>
    );
};