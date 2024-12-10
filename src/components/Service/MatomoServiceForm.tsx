"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import { askAccountCreationForService } from "@/app/api/services/actions";
import {
    matomoAccountRequestSchema,
    matomoAccountRequestSchemaType,
} from "@/models/actions/service";
import { SERVICES } from "@/models/services";

export default function MatomoServiceForm(props: { sites }) {
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        control,
    } = useForm<matomoAccountRequestSchemaType>({
        resolver: zodResolver(matomoAccountRequestSchema),
        mode: "onChange",
        defaultValues: {
            sites: [
                {
                    id: undefined,
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

    const onSubmit = async (data: matomoAccountRequestSchemaType, e) => {
        if (isSaving) {
            return;
        }
        if (!isValid) {
            return;
        }
        setIsSaving(true);
        setAlertMessage(null);
        const service = SERVICES.MATOMO;
        const res = await askAccountCreationForService({
            service: service,
            data,
        });
        if (res.success) {
            setAlertMessage({
                title: "Compte matomo en cours de création",
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
        setIsSaving(false);
        window.scrollTo({ top: 20, behavior: "smooth" });
    };

    const { fields: siteFields, append: sitesAppend } = useFieldArray({
        rules: { minLength: 1 },
        control,
        name: "sites",
    });

    const addSiteClick = (e) => {
        sitesAppend({
            //@ts-ignore id can be undefined when filling but not after submissions
            id: undefined,
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
                                {siteFields.map((field, index) => (
                                    <div
                                        key={index}
                                        className={fr.cx(
                                            "fr-fieldset__element",
                                            "fr-col-12",
                                            "fr-col-lg-4",
                                            "fr-col-md-4",
                                            "fr-col-offset-lg-8--right",
                                            "fr-col-offset-md-8--right"
                                        )}
                                    >
                                        <Select
                                            label="Site"
                                            nativeSelectProps={{
                                                // onChange: (event) =>
                                                //     setMatomoSite(
                                                //         event.target.value
                                                //     ),
                                                // matomoSite,
                                                ...register(
                                                    `sites.${index}.id`,
                                                    {
                                                        required: true,
                                                        valueAsNumber: true,
                                                    }
                                                ),
                                            }}
                                        >
                                            <option value="" disabled hidden>
                                                Selectionnez une option
                                            </option>
                                            {props.sites.map((site) => (
                                                <option
                                                    key={site.id}
                                                    value={site.id}
                                                >
                                                    {site.name} {site.id}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                ))}
                                <Button
                                    className={fr.cx(
                                        "fr-fieldset__element",
                                        "fr-col-12",
                                        "fr-col-lg-4",
                                        "fr-col-md-4",
                                        "fr-col-offset-lg-8--right",
                                        "fr-col-offset-md-8--right"
                                    )}
                                    iconId="fr-icon-add-circle-line"
                                    priority="secondary"
                                    size="small"
                                    type="button"
                                    onClick={addSiteClick}
                                >
                                    Ajouter une site
                                </Button>
                            </fieldset>
                            <Button
                                className={fr.cx("fr-mt-3w")}
                                disabled={isSaving}
                                children={
                                    isSubmitting
                                        ? `Enregistrement de la demande...`
                                        : `Demander les accès`
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
