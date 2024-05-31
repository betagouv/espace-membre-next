"use client";
import React from "react";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useFieldArray, useForm } from "react-hook-form";

import {
    UpdateOvhResponder,
    UpdateOvhResponderSchema,
} from "@/models/actions/ovh";
import { memberWrapperSchema } from "@/models/member";
import { OvhResponder } from "@/models/ovh";
import routes, { computeRoute } from "@/routes/routes";

export default function BlocEmailResponder({
    responder,
    username,
}: {
    responder: OvhResponder | null | undefined;
    username: string;
}) {
    const defaultValues = responder
        ? {
              from: responder.from.toISOString().split("T")[0],
              to: responder.to.toISOString().split("T")[0],
              content: responder.content,
          }
        : {
              from: new Date().toISOString().split("T")[0],
              to: "",
              content: "",
          };
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
        getValues,
        control,
        watch,
    } = useForm<UpdateOvhResponder>({
        resolver: zodResolver(UpdateOvhResponderSchema),
        mode: "onChange",
        defaultValues,
    });

    const [isSaving, setIsSaving] = React.useState(false);

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
                onSubmit={handleSubmit(
                    ({ content, from, to }: UpdateOvhResponder) => {
                        if (isSaving) {
                            return;
                        }
                        if (!isValid) {
                            console.log("invalid");
                            return;
                        }
                        setIsSaving(true);
                        axios.post(
                            computeRoute(routes.USER_SET_EMAIL_RESPONDER_API),
                            {
                                content,
                                from,
                                to,
                            },
                            {
                                withCredentials: true,
                            }
                        );
                    }
                )}
            >
                {responder && (
                    <input type="hidden" name="method" value="update" />
                )}
                <Input
                    label="Message d'absence"
                    state="default"
                    stateRelatedMessage="Text de validation / d'explication de l'erreur"
                    textArea
                    nativeTextAreaProps={{
                        defaultValue: getValues("content"),
                        onChange: (e: { target: { value: string } }) => {
                            setValue("content", e.target.value);
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
                        defaultValue: getValues("from"),
                        onChange: (e) => {
                            setValue("from", e.target.value);
                        },
                    }}
                />
                <Input
                    hintText="Au format JJ/MM/YYYY"
                    label="Fin"
                    nativeInputProps={{
                        type: "date",
                        defaultValue: getValues("to"),
                        onChange: (e) => {
                            setValue("to", e.target.value);
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
