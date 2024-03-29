"use client";
import React from "react";
import routes, { computeRoute } from "@/routes/routes";
import axios from "axios";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";

export default function BlocEmailResponder({
    hasResponder,
    responderFormData,
    username,
}: {
    hasResponder: boolean;
    responderFormData?: {
        from: string;
        to: string;
        content: string;
    };
    username: string;
}) {
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    const [from, setFrom] = React.useState<string>(
        (responderFormData && responderFormData.from) || ""
    );
    const [to, setTo] = React.useState<string>(
        (responderFormData && responderFormData.to) || ""
    );
    const [content, setContent] = React.useState<string>(
        (responderFormData && responderFormData.content) || ""
    );
    return (
        <Accordion label="Configurer une réponse automatique">
            <p>
                Informez vos correspondants de votre absence. Cette réponse
                automatique sera envoyée à tous les messages que vous recevez.
                (la mise en place effective de la réponse automatique peut
                prendre quelques minutes)
            </p>
            <form
                className="fr-mb-6v"
                onSubmit={(e) => {
                    e.preventDefault();
                    setIsSaving(true);
                    axios
                        .post(
                            computeRoute(routes.USER_SET_EMAIL_RESPONDER_API),
                            {
                                content,
                                from,
                                to,
                            },
                            {
                                withCredentials: true,
                            }
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
                {hasResponder && (
                    <input type="hidden" name="method" value="update" />
                )}
                <Input
                    label="Message d'absence"
                    state="default"
                    stateRelatedMessage="Text de validation / d'explication de l'erreur"
                    textArea
                    nativeTextAreaProps={{
                        defaultValue: content,
                        onChange: (e: { target: { value: string } }) => {
                            setContent(e.target.value);
                        },
                        placeholder:
                            "Je ne serai pas en mesure de vous répondre du XX/XX au XX/XX. En cas d'urgence, n'hésitez pas à contacter ...",
                    }}
                />
                <Input
                    hintText="Au format JJ/MM/YYYY"
                    label="Début"
                    nativeInputProps={{
                        type: "date",
                        defaultValue: from,
                        onChange: (e) => {
                            setFrom(e.target.value);
                        },
                    }}
                />
                <Input
                    hintText="Au format JJ/MM/YYYY"
                    label="Fin"
                    nativeInputProps={{
                        type: "date",
                        defaultValue: to,
                        onChange: (e) => {
                            setTo(e.target.value);
                        },
                    }}
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
        </Accordion>
    );
}
