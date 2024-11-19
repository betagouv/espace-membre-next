"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import { askAccountCreationForService } from "@/app/api/services/actions";
import {
    matomoAccountRequestSchema,
    matomoAccountRequestSchemaType,
} from "@/models/actions/service";
import { SERVICES } from "@/models/services";

export default function MatomoServiceForm() {
    const {
        register,
        handleSubmit,
        formState: { isDirty, isSubmitting, isValid },
        control,
    } = useForm<matomoAccountRequestSchemaType>({
        resolver: zodResolver(matomoAccountRequestSchema),
        mode: "onChange",
        defaultValues: {
            sites: [
                {
                    url: "",
                },
            ],
        },
    });
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    const [isSaving, setIsSaving] = React.useState(false);

    const onSubmit = (data: matomoAccountRequestSchemaType, e) => {
        if (isSaving) {
            return;
        }
        if (!isValid) {
            return;
        }
        setIsSaving(true);
        setAlertMessage(null);
        const service = SERVICES.MATOMO;
        askAccountCreationForService({
            service: service,
            data,
        })
            .then((resp) => {
                setIsSaving(false);
                window.scrollTo({ top: 20, behavior: "smooth" });
                setAlertMessage({
                    title: `Mise à jour effectuée`,
                    message: "Le compte matomo va être créé",
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

    const { fields: urlsFields, append: urlsAppend } = useFieldArray({
        rules: { minLength: 1 },
        control,
        name: "sites",
    });

    const addUrlClick = (e) => {
        urlsAppend({
            url: "",
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
                <div className="fr-grid-row fr-grid-row-gutters">
                    <div className="fr-col-12 fr-col-md-12 fr-col-lg-12">
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            aria-label="Demander les accès a un ou plusieurs site matomo"
                        >
                            <fieldset
                                className="fr-mt-5v fr-mb-0v fr-fieldset"
                                id="identity-fieldset"
                                aria-labelledby="identity-fieldset-legend identity-fieldset-messages"
                            >
                                {urlsFields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className={fr.cx(
                                            "fr-fieldset__element",
                                            "fr-col-12",
                                            "fr-col-lg-4",
                                            "fr-col-md-4",
                                            "fr-col-offset-lg-8--right",
                                            "fr-col-offset-md-8--right"
                                        )}
                                    >
                                        <Input
                                            label={`Url du site ${index + 1}`}
                                            hintText="Ajoute l'url du site : si le site existe déjà tu y seras ajouté, sinon il sera créé"
                                            nativeInputProps={{
                                                type: "text",
                                                placeholder:
                                                    "https://www.toto.beta.gouv.fr",
                                                ...register(
                                                    `sites.${index}.url`,
                                                    {
                                                        required: true,
                                                    }
                                                ), // Register each url input
                                            }}
                                        />
                                    </div>
                                ))}
                                <Button
                                    iconId="fr-icon-add-circle-line"
                                    priority="secondary"
                                    size="small"
                                    type="button"
                                    onClick={addUrlClick}
                                >
                                    Ajouter une url
                                </Button>
                            </fieldset>
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
                </div>
            </div>
        </>
    );
}
