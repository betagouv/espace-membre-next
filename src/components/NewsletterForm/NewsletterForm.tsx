"use client";
import React, { useEffect } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import _ from "lodash";
import { useForm, useWatch } from "react-hook-form";

import { updateNewsletter } from "@/app/api/newsletters/actions";
import {
    newsletterInfoUpdateSchema,
    newsletterInfoUpdateSchemaType,
} from "@/models/actions/newsletter";
import { newsletterSchemaType } from "@/models/newsletter";

// data from secretariat API
export interface NewsletterFormProps {
    newsletter: newsletterSchemaType;
}

export function NewsletterForm({ newsletter }: NewsletterFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
        getValues,
        watch,
        control,
    } = useForm<newsletterInfoUpdateSchemaType>({
        resolver: zodResolver(newsletterInfoUpdateSchema),
        mode: "onChange",
        defaultValues: {},
    });
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    const [isSaving, setIsSaving] = React.useState(false);

    const onSubmit = (data: newsletterInfoUpdateSchemaType, e) => {
        if (isSaving) {
            return;
        }
        if (!isValid) {
            return;
        }
        setIsSaving(true);
        setAlertMessage(null);

        updateNewsletter(data, newsletter.id)
            .then((resp) => {
                setIsSaving(false);
                window.scrollTo({ top: 20, behavior: "smooth" });
                setAlertMessage({
                    title: `Mise à jour effectuée`,
                    message: `La modification sera visible en ligne d'ici 24 heures.`,
                    type: "success",
                });
            })
            .catch((e: any) => {
                setIsSaving(false);
                window.scrollTo({ top: 20, behavior: "smooth" });
                setAlertMessage({
                    title: "Une erreur est survenue",
                    message: e.message,
                    type: "warning",
                });
            });
    };

    const publishAtValue = useWatch({
        control,
        name: `publish_at`,
    });
    const publishAtString = publishAtValue
        ? new Date(publishAtValue).toISOString()
        : "";

    return (
        <>
            <div>
                {!!alertMessage && (
                    <Alert
                        className="fr-mb-8v"
                        severity={alertMessage.type}
                        closable={false}
                        title={alertMessage.title}
                        description={
                            alertMessage.message ? (
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: alertMessage.message,
                                    }}
                                />
                            ) : undefined
                        }
                    />
                )}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    aria-label="Modifier les informations du produit"
                >
                    <Input
                        label={"url brevo de la newsletters"}
                        nativeInputProps={{ ...register("brevo_url") }}
                        state={errors && errors.brevo_url ? "error" : "default"}
                        stateRelatedMessage={
                            errors && errors.brevo_url?.message
                        }
                    />
                    <Input
                        label={"date de publication"}
                        nativeInputProps={{
                            type: "datetime-local",
                            onChange: (e) => {
                                setValue(
                                    "publish_at",
                                    new Date(e.target.value)
                                );
                            },
                        }}
                        state={
                            errors && errors.publish_at ? "error" : "default"
                        }
                        stateRelatedMessage={
                            errors && errors.publish_at?.message
                        }
                    />
                    <Button
                        className={fr.cx("fr-mt-3w")}
                        disabled={isSaving}
                        children={
                            isSubmitting
                                ? `Enregistrement en cours...`
                                : `Enregistrer`
                        }
                        nativeButtonProps={{
                            type: "submit",
                            disabled: !isDirty || isSubmitting,
                        }}
                    />
                </form>
            </div>
        </>
    );
}
