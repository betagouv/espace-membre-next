"use client";
import React from "react";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { setEmailResponder } from "@/app/api/member/actions";
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
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    const onSubmit = async ({ content, from, to }: UpdateOvhResponder) => {
        if (isSaving) {
            return;
        }
        if (!isValid) {
            console.log("invalid");
            return;
        }
        setAlertMessage(null);
        setIsSaving(true);
        try {
            await setEmailResponder({
                content,
                from,
                to,
            });
            setAlertMessage({
                title: `Réponse automatique enregistrée`,
                message: "Votre réponse automatique a bien été enregistrée",
                type: "success",
            });
        } catch (e) {
            alert(e);
            setAlertMessage({
                title: "Erreur",
                //@ts-ignore
                message: e.response?.data?.message || e.message,
                type: "warning",
            });
        }

        setIsSaving(false);
    };

    return (
        <Accordion label="Configurer une réponse automatique">
            {!!alertMessage && (
                <Alert
                    className="fr-mb-8v"
                    severity={alertMessage.type}
                    closable={false}
                    title={alertMessage.title}
                />
            )}
            <p>
                Informez vos correspondants de votre absence. Cette réponse
                automatique sera envoyée à tous les messages que vous recevez.
                (la mise en place effective de la réponse automatique peut
                prendre quelques minutes)
            </p>

            <form className="fr-mb-6v" onSubmit={handleSubmit(onSubmit)}>
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
