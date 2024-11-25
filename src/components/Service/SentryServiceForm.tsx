"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
<<<<<<< HEAD
<<<<<<< HEAD
import { Select } from "@codegouvfr/react-dsfr/Select";
=======
import Input from "@codegouvfr/react-dsfr/Input";
>>>>>>> b68805ca (feat: add sentry create account)
=======
import { Select } from "@codegouvfr/react-dsfr/Select";
>>>>>>> c8eeeb14 (chore: add sentry form interface, and sentry method to add user)
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import { askAccountCreationForService } from "@/app/api/services/actions";
import {
    sentryAccountRequestSchema,
    sentryAccountRequestSchemaType,
} from "@/models/actions/service";
import { SERVICES } from "@/models/services";

export default function SentryServiceForm(props: { teams }) {
    const {
        register,
        handleSubmit,
        formState: { isDirty, isSubmitting, isValid },
        control,
    } = useForm<sentryAccountRequestSchemaType>({
        resolver: zodResolver(sentryAccountRequestSchema),
        mode: "onChange",
        defaultValues: {
<<<<<<< HEAD
            teams: [
                {
                    name: "",
                },
            ],
=======
            teams: [""],
>>>>>>> c8eeeb14 (chore: add sentry form interface, and sentry method to add user)
        },
    });
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    const [isSaving, setIsSaving] = React.useState(false);
    const [sentryTeam, setSentryTeam] = React.useState<string | undefined>();

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
<<<<<<< HEAD
=======
        console.log("LCS DATA", data);
>>>>>>> c8eeeb14 (chore: add sentry form interface, and sentry method to add user)
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

    const { fields: teamFields, append: teamsAppend } = useFieldArray({
        rules: { minLength: 1 },
        control,
        name: "teams",
    });

    const addTeamClick = (e) => {
<<<<<<< HEAD
        teamsAppend({
            name: "",
        });
=======
        teamsAppend("");
>>>>>>> c8eeeb14 (chore: add sentry form interface, and sentry method to add user)
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
                            aria-label="Demander les accès a un ou plusieurs site sentry"
                        >
                            <fieldset
                                className="fr-mt-5v fr-mb-0v fr-fieldset"
                                id="identity-fieldset"
                                aria-labelledby="identity-fieldset-legend identity-fieldset-messages"
                            >
                                {teamFields.map((field, index) => (
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
                                            label="Équipe"
                                            nativeSelectProps={{
                                                // onChange: (event) =>
                                                //     setSentryTeam(
                                                //         event.target.value
                                                //     ),
                                                // sentryTeam,
<<<<<<< HEAD
                                                ...register(
                                                    `teams.${index}.name`,
                                                    {
                                                        required: true,
                                                    }
                                                ),
=======
                                                ...register(`teams.${index}`, {
                                                    required: true,
                                                }),
>>>>>>> c8eeeb14 (chore: add sentry form interface, and sentry method to add user)
                                            }}
                                        >
                                            <option value="" disabled hidden>
                                                Selectionnez une option
                                            </option>
                                            {props.teams.map((team) => (
                                                <option
                                                    key={team.slug}
                                                    value={team.slug}
                                                >
                                                    {team.name}
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
                                    onClick={addTeamClick}
                                >
                                    Ajouter une équipe
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
