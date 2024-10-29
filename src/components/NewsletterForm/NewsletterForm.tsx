"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns/format";
import { fr as dateFnsFr } from "date-fns/locale/fr";
import _ from "lodash";
import { useForm, useWatch } from "react-hook-form";

import { safeUpdateNewsletter } from "@/app/api/newsletters/actions";
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
        defaultValues: {
            ...newsletter,
        },
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

        safeUpdateNewsletter(data, newsletter.id)
            .then((resp) => {
                setIsSaving(false);
                window.scrollTo({ top: 20, behavior: "smooth" });
                setAlertMessage({
                    title: `Mise à jour effectuée`,
                    message: `L'envoi de la newsletter a été planifié. L'envoi se fait manuellement mais les messages de rappel, dépendent de la date d'envoi, il sont envoyés 6 jours, 1 jour avant, et le jour même de l'envoi.`,
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
                <h3>
                    Infolettre du{" "}
                    {format(
                        newsletter.sent_at ||
                            getValues("publish_at") ||
                            new Date(),
                        "d MMMM yyyy",
                        { locale: dateFnsFr }
                    )}
                </h3>
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
                    {!newsletter.sent_at && (
                        <Input
                            label={"date de publication"}
                            nativeInputProps={{
                                type: "datetime-local",
                                defaultValue: format(
                                    newsletter.publish_at || new Date(),
                                    "yyyy-MM-dd'T'HH:mm"
                                ),
                                onChange: (e) => {
                                    setValue(
                                        "publish_at",
                                        new Date(e.target.value)
                                    );
                                },
                            }}
                            state={
                                errors && errors.publish_at
                                    ? "error"
                                    : "default"
                            }
                            stateRelatedMessage={
                                errors && errors.publish_at?.message
                            }
                        />
                    )}
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
