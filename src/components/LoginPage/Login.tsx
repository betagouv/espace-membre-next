"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { Input } from "@codegouvfr/react-dsfr/Input";
import axios from "axios";
import { useRouter } from "next/navigation";
import { getSession, signIn, useSession } from "next-auth/react";

import routes, { computeRoute } from "@/routes/routes";

interface Props {
    errors: any[];
    messages: string;
    domain: string;
    next: string;
}

interface FormErrorResponse {
    errors?: string;
    message: string;
}

/* Pure component */
export const LoginPage = function (props: Props) {
    const { data: session, status } = useSession();
    const [errorMessage, setErrorMessage] = React.useState("");
    const [formErrors, setFormErrors] = React.useState<string>();
    const [email, setEmail] = React.useState("");
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    const [alertMessage, setAlertMessage] = React.useState<{
        message: string;
        type: "success" | "warning";
        description?: string;
    } | null>();

    const pingConnection = async () => {
        const user = await getSession();
    };
    const sendLogin = async (event: { preventDefault: () => void }) => {
        if (isSaving) {
            return;
        }
        event.preventDefault();
        setFormErrors("");
        setErrorMessage("");
        setIsSaving(true);
        setAlertMessage(null);
        try {
            const data = await signIn("email", { email, redirect: false });
            console.log(data);
            setIsSaving(false);

            if (data && data.error) {
                setIsSaving(false);
                setFormErrors(data.error);
            } else if (data && data.ok && !data.error) {
                setAlertMessage({
                    message:
                        "Un email avec un lien de connexion a été envoyé à ton adresse.",
                    type: "success",
                });
            }
        } catch (e) {
            setIsSaving(false);
            // const ErrorResponse: FormErrorResponse = e;
            // setErrorMessage(ErrorResponse.message);
            // if (ErrorResponse.errors) {
            //     setFormErrors(ErrorResponse.errors);
            // }
            console.log("LCS ERROR", e);
        }

        // axios
        //     .post(computeRoute(`${routes.LOGIN_API}${props.next}#test`), {
        //         emailInput: email,
        //     })
        //     .then(async (resp) => {
        //         setIsSaving(false);
        //         if (resp.data && resp.data.errors) {
        //             const message = resp.data.errors;
        //             setErrorMessage(message);
        //             setFormErrors(message);
        //         } else {
        //             setAlertMessage({
        //                 message:
        //                     "Un email avec un lien de connexion a été envoyé à ton adresse.",
        //                 type: "success",
        //             });
        //         }
        //         await pingConnection();
        //     })
        //     .catch(
        //         ({
        //             response: { data },
        //         }: {
        //             response: { data: FormErrorResponse };
        //         }) => {
        //             setIsSaving(false);
        //             const ErrorResponse: FormErrorResponse = data;
        //             setErrorMessage(ErrorResponse.message);
        //             if (ErrorResponse.errors) {
        //                 setFormErrors(ErrorResponse.errors);
        //             }
        //         }
        //     )
        //     .catch((e) => {
        //         // arrive quand il n'y a pas de "data"
        //         console.log("Error no data", e);
        //         setIsSaving(false);
        //         const ErrorResponse: FormErrorResponse = e;
        //         setErrorMessage(ErrorResponse.message);
        //         if (ErrorResponse.errors) {
        //             setFormErrors(ErrorResponse.errors);
        //         }
        //     });
    };

    return (
        <>
            <div className="fr-col-12">
                <div className="fr-container fr-background-alt--grey fr-px-md-0 fr-py-10v fr-py-md-14v">
                    <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
                        <div className="fr-col-12 fr-col-md-9 fr-col-lg-8">
                            <div className="fr-mb-6v">
                                {!!errorMessage && (
                                    <Alert
                                        closable
                                        description={errorMessage}
                                        onClose={function noRefCheck() {}}
                                        severity="error"
                                        title="Le formulaire a renvoyé une erreur"
                                        className={fr.cx("fr-mb-5v")}
                                    />
                                )}
                                {!!alertMessage && (
                                    <Alert
                                        className="fr-mb-8v"
                                        severity={alertMessage.type}
                                        closable={false}
                                        description={alertMessage.description}
                                        title={alertMessage.message}
                                    />
                                )}
                                <form
                                    onSubmit={sendLogin}
                                    method="POST"
                                    id="login_form"
                                >
                                    <fieldset
                                        className="fr-fieldset"
                                        id="login-1760-fieldset"
                                        aria-labelledby="login-1760-fieldset-legend login-1760-fieldset-messages"
                                    >
                                        <legend
                                            className="fr-fieldset__legend"
                                            id="login-1760-fieldset-legend"
                                        >
                                            <h2>Se connecter avec son email</h2>
                                        </legend>
                                        {!!props.messages.length && (
                                            <div
                                                className="notification"
                                                dangerouslySetInnerHTML={{
                                                    __html: props.messages,
                                                }}
                                            ></div>
                                        )}
                                    </fieldset>
                                    <Input
                                        hintText="Email beta.gouv.fr ou email secondaire"
                                        label="Mon email"
                                        nativeInputProps={{
                                            type: "email",
                                            placeholder:
                                                "prenom.nom@beta.gouv.fr",
                                            onChange: (e) =>
                                                setEmail(e.target.value),
                                            required: true,
                                        }}
                                        state={formErrors ? "error" : "default"}
                                        stateRelatedMessage={formErrors}
                                    />
                                    <ButtonsGroup
                                        buttons={[
                                            {
                                                children: isSaving
                                                    ? "Envoi du lien de connexion..."
                                                    : "Recevoir le lien de connexion",
                                                onClick: () => {},
                                                disabled: isSaving,
                                                type: "submit",
                                            },
                                        ]}
                                    />
                                </form>
                                <p className="fr-hr-or">ou</p>
                            </div>
                            <div className="fr-mb-6v">
                                <h2>👋&nbsp;Tu viens d'arriver ?</h2>
                                <p className="fr-text--sm">
                                    Un membre de la communauté doit créer ta
                                    fiche depuis l'espace-membre. Tu recevras un
                                    lien de connexion quand celle-ci sera
                                    validée.
                                </p>
                            </div>
                            <div id="forgot">
                                <CallOut
                                    iconId="ri-information-line"
                                    title="Besoin d'aide ?"
                                >
                                    <>
                                        <div className={fr.cx("fr-mt-2v")}>
                                            <b>
                                                Si tu n'arrives pas à te
                                                connecter consulte cette page
                                                pour savoir ce qu'il se passe :
                                            </b>{" "}
                                            <a
                                                className="fr-link"
                                                href="/keskispasse"
                                                title="lien vers la page de diagnostic"
                                            >
                                                Keskispasse
                                            </a>
                                            .
                                        </div>
                                        {/* <div>
                                            <b>
                                                J'ai oublié mon email pour me
                                                connecter :
                                            </b>{" "}
                                            l'accès à l'espace membre se fait
                                            avec une adresse du service public
                                            (@beta.gouv.fr, @pole-emploi.fr...)
                                            ou un email secondaire (celui sur
                                            lequel tu as reçu tes accès). En cas
                                            d'oubli, demande de l'aide sur
                                            Mattermost{" "}
                                            <a
                                                href="https://mattermost.incubateur.net/betagouv/channels/incubateur-help"
                                                target="_blank"
                                                title="Lien vers le channel secretariat sur Mattermost"
                                            >
                                                ~incubateur-help
                                            </a>
                                        </div>
                                        <div className={fr.cx("fr-mt-2v")}>
                                            <b>
                                                Je n'arrive pas à accéder à mes
                                                emails :
                                            </b>{" "}
                                            <a
                                                className="fr-link"
                                                href="https://doc.incubateur.net/communaute/travailler-a-beta-gouv/jutilise-les-outils-de-la-communaute/emails#2.-configurer-la-reception-et-lenvoi-demails"
                                                target="_blank"
                                                title="lien vers la documentation pour se connecter à sa boite mail"
                                            >
                                                configure ton client webmail
                                            </a>
                                            .
                                        </div>
                                        <div className={fr.cx("fr-mt-2v")}>
                                            Voir aussi :{" "}
                                            <a
                                                className="fr-link"
                                                href="https://doc.incubateur.net/communaute/travailler-a-beta-gouv/jutilise-les-outils-de-la-communaute/problemes-frequents"
                                                target="_blank"
                                                title="lien vers les questions fréquentes de la documentation"
                                            >
                                                questions fréquentes
                                            </a>
                                        </div> */}
                                    </>
                                </CallOut>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
