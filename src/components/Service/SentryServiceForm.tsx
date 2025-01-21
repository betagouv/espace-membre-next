"use client";
import React, { useState } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import { askAccountCreationForService } from "@/app/api/services/actions";
import AutoComplete, { OptionType } from "@/components/AutoComplete";
import {
    sentryAccountRequestSchema,
    sentryAccountRequestSchemaType,
} from "@/models/actions/service";
import { SERVICES } from "@/models/services";

export default function SentryServiceForm({
    teams,
}: {
    teams: {
        name: string;
    }[];
}) {
    const {
        handleSubmit,
        setValue,
        formState: { isDirty, isSubmitting, isValid, errors },
        control,
    } = useForm<sentryAccountRequestSchemaType>({
        resolver: zodResolver(sentryAccountRequestSchema),
        mode: "onChange",
        defaultValues: {
            teams: [],
        },
    });
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    const [isSaving, setIsSaving] = React.useState(false);

    const onSubmit = async (data: sentryAccountRequestSchemaType, e) => {
        if (isSaving) {
            return;
        }
        if (!isValid) {
            return;
        }
        setIsSaving(true);
        setAlertMessage(null);
        const service = SERVICES.SENTRY;
        const res = await askAccountCreationForService({
            service: service,
            data,
        });
        if (res.success) {
            setAlertMessage({
                title: "Compte sentry en cours de création",
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
                        {!!Object.keys(errors).length && (
                            <p className="fr-error-text">
                                Des erreurs inattendues dans le formulaire
                            </p>
                        )}
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            aria-label="Demander les accès a un ou plusieurs site sentry"
                        >
                            <fieldset
                                className="fr-mt-5v fr-mb-0v fr-fieldset"
                                id="identity-fieldset"
                                aria-labelledby="identity-fieldset-legend identity-fieldset-messages"
                            >
                                <div
                                    className={fr.cx(
                                        "fr-fieldset__element",
                                        "fr-col-12",
                                        "fr-col-lg-4",
                                        "fr-col-md-4",
                                        "fr-col-offset-lg-8--right",
                                        "fr-col-offset-md-8--right"
                                    )}
                                >
                                    <SentryTeamSelect
                                        sentryTeams={teams.map((team) => ({
                                            label: team.name,
                                            value: team.name,
                                        }))}
                                        isMulti={true}
                                        onChange={(selectedTeams) => {
                                            setValue(
                                                "teams",
                                                selectedTeams.map((team) => ({
                                                    name: team.value,
                                                })),
                                                {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                }
                                            );
                                        }}
                                    ></SentryTeamSelect>
                                    {errors &&
                                        errors.teams &&
                                        errors.teams.message && (
                                            <p className="fr-error-text">
                                                {errors.teams.message}
                                            </p>
                                        )}
                                </div>
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

export type SentryTeamType = OptionType<false> & {
    value: string;
};

function SentryTeamSelect({
    sentryTeams,
    onChange,
    onBlur,
    isMulti,
    placeholder,
    defaultValue,
    hint,
    label,
    state,
    stateMessageRelated,
}: {
    sentryTeams: SentryTeamType[];
    onChange?: any;
    onBlur?: any;
    isMulti?: boolean;
    placeholder?: string;
    defaultValue?:
        | { value: string; label: string }
        | { value: string; label: string }[];
    hint?: string;
    label?: string;
    state?: "default" | "success" | "error" | undefined;
    stateMessageRelated?: string;
}) {
    const onTagsChange = (values) => {
        onChange(values);
    };
    const [initialValue] = useState(
        defaultValue ? (defaultValue as SentryTeamType[]) : undefined
    );

    return (
        <div className="fr-select-group">
            <label className="fr-label">
                {label}
                {!!hint && <span className="fr-hint-text">{hint}</span>}
            </label>
            <AutoComplete
                placeholder={placeholder}
                multiple={isMulti}
                options={sentryTeams}
                onSelect={onTagsChange}
                onBlur={onBlur}
                defaultValue={initialValue}
                // sx={{ width: "500px" }}
            />
            {!!state && !!stateMessageRelated && (
                <p className="fr-error-text">{stateMessageRelated}</p>
            )}
        </div>
    );
}
