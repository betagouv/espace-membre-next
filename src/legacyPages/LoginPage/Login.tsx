"use client";
import React from "react";
import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useRouter } from "next/navigation";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { getSession } from "next-auth/react";

interface Props {
    errors: any[];
    messages: string;
    domain: string;
    next: string;
}

interface FormErrorResponse {
    errors?: Record<string, string[]>;
    message: string;
}

/* Pure component */
export const LoginPage = function (props: Props) {
    const [errorMessage, setErrorMessage] = React.useState("");
    const [formErrors, setFormErrors] =
        React.useState<Record<string, string[]>>();
    const [email, setEmail] = React.useState("");
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    const [alertMessage, setAlertMessage] = React.useState<{
        message: string;
        type: "success" | "warning";
        description?: string;
    }>();

    const pingConnection = async () => {
        const user = await getSession();
    };
    const sendLogin = (event: { preventDefault: () => void }) => {
        if (isSaving) {
            return;
        }
        event.preventDefault();
        setIsSaving(true);
        axios
            .post(computeRoute(`${routes.LOGIN_API}${props.next}#test`), {
                emailInput: email,
            })
            .then(async (resp) => {
                setIsSaving(false);
                setAlertMessage({
                    message:
                        "Un email avec un lien de connexion a été envoyé à ton adresse.",
                    type: "success",
                });
                await pingConnection();
            })
            .catch(
                ({
                    response: { data },
                }: {
                    response: { data: FormErrorResponse };
                }) => {
                    console.log("Error", data);
                    setIsSaving(false);
                    const ErrorResponse: FormErrorResponse = data;
                    setErrorMessage(ErrorResponse.message);
                    if (ErrorResponse.errors) {
                        setFormErrors(ErrorResponse.errors);
                    }
                }
            )
            .catch((e) => {
                console.log(e);
            });
    };

    return (
        <>
            <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
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
                                        title="Le formulaire a renvoyer une erreur"
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
                                        hintText="Email beta.gouv.fr ou ton email secondaire"
                                        label="Mon email"
                                        nativeInputProps={{
                                            type: "email",
                                            placeholder:
                                                "prenom.nom@beta.gouv.fr",
                                            onChange: (e) =>
                                                setEmail(e.target.value),
                                            required: true,
                                        }}
                                        state={
                                            formErrors &&
                                            formErrors["emailInput"]
                                                ? "error"
                                                : "default"
                                        }
                                        stateRelatedMessage={
                                            formErrors &&
                                            formErrors["emailInput"]
                                        }
                                    />
                                    <ButtonsGroup
                                        buttons={[
                                            {
                                                children: isSaving
                                                    ? "Envoie du lien de connexion..."
                                                    : "Recevoir le lien de connexion",
                                                onClick: () => {},
                                                disabled: isSaving,
                                                type: "submit",
                                            },
                                        ]}
                                    />
                                </form>
                                <p className="fr-text--sm fr-mt-3v">
                                    <a href="#forgot" className="fr-link">
                                        Mot de passe oublié ?
                                    </a>
                                </p>
                                <p className="fr-hr-or">ou</p>
                            </div>
                            <div className="fr-mb-6v">
                                <h2>👋&nbsp;Tu viens d'arriver ?</h2>
                                <p className="fr-text--sm">
                                    Crée ta fiche Github pour rejoindre la
                                    communauté. Tu pourras obtenir une adresse
                                    email @{props.domain}.
                                </p>
                                <ButtonsGroup
                                    buttons={[
                                        {
                                            children: "Créer ma fiche Github",
                                            linkProps: {
                                                href: "/onboarding",
                                            },
                                            priority: "secondary",
                                        },
                                    ]}
                                />
                            </div>
                            <div id="forgot">
                                <CallOut
                                    iconId="ri-information-line"
                                    title="Besoin d'aide ?"
                                >
                                    <>
                                        <ul>
                                            <li>
                                                <b>
                                                    J'ai oublié mon email pour
                                                    me connecter :
                                                </b>{" "}
                                                l'accès à l'espace membre se
                                                fait avec une adresse du service
                                                public (@beta.gouv.fr,
                                                @pole-emploi.fr...) ou un email
                                                secondaire (celui sur lequel tu
                                                as reçu tes accès). En cas
                                                d'oubli, demande de l'aide sur
                                                Mattermost{" "}
                                                <a
                                                    href="https://mattermost.incubateur.net/betagouv/channels/incubateur-help"
                                                    target="_blank"
                                                    title="Lien vers le channel secretariat sur Mattermost"
                                                >
                                                    ~incubateur-help
                                                </a>
                                            </li>
                                            <li>
                                                <b>
                                                    Je n'arrive pas à accéder à
                                                    mes emails :
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
                                            </li>
                                        </ul>
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
