"use client";
import React, { useState } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import AutoComplete, { OptionType } from "../AutoComplete";
import { askAccountCreationForService } from "@/app/api/services/actions";
import {
    sentryAccountRequestSchema,
    sentryAccountRequestSchemaType,
} from "@/models/actions/service";
import { AlertMessageType } from "@/models/common";
import { SERVICES } from "@/models/services";

export default function SentryServiceForm(props: {
    teams: SentryTeamType[];
    createAccount: boolean;
    userEmail: string;
}) {
    const [alertMessage, setAlertMessage] =
        React.useState<AlertMessageType | null>();

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
                    <div className="fr-col-12 fr-col-md-6 fr-col-lg-6">
                        {!props.createAccount && (
                            <>
                                <p>
                                    Ton compte sentry sera créé avec ton adresse{" "}
                                    <b>{props.userEmail}.</b>
                                    <br />
                                    Tu dois le rattacher à une équipe
                                    enregistrée sur sentry.
                                </p>
                            </>
                        )}
                        <h3 className="fr-h5">
                            Accèder à une équipe existante
                        </h3>
                        {!props.teams.length && (
                            <p>
                                Nous n'avons pas d'équipe sentry enregistrée
                                pour les produits sur lesquels tu travailles
                                actuellemment. Si pourtant une équipe existe
                                merci de nous le signaler en envoyant un message
                                dans le chatbot crips présent sur cette page.
                            </p>
                        )}
                        {!!props.teams.length && (
                            <AddSentryServiceForm
                                teams={props.teams}
                                setAlertMessage={setAlertMessage}
                            />
                        )}
                        <p className="fr-hr-or fr-mt-4w">ou</p>
                        <h3 className="fr-h5">Créer une nouvelle équipe</h3>
                        <p>
                            Si il n'existe pas encore d'équipe sentry pour ton
                            produit tu peux la créer :
                        </p>
                        <Button
                            linkProps={{
                                href: "/services/sentry/request/new",
                            }}
                        >
                            Créer une nouvelle équipe
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

const AddSentryServiceForm = ({ setAlertMessage, teams }) => {
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
            <form
                onSubmit={handleSubmit(onSubmit)}
                aria-label="Demander les accès a un ou plusieurs team sentry"
            >
                {!!teams.length && (
                    <>
                        <fieldset
                            className="fr-mt-5v fr-mb-0v fr-fieldset"
                            id="identity-fieldset"
                            aria-labelledby="identity-fieldset-legend identity-fieldset-messages"
                        >
                            <div
                                className={fr.cx(
                                    "fr-fieldset__element",
                                    "fr-col-12",
                                    "fr-col-lg-10",
                                    "fr-col-md-10",
                                    "fr-col-offset-lg-2--right",
                                    "fr-col-offset-md-2--right"
                                )}
                            >
                                <SentryTeamSelect
                                    sentryTeams={teams.map((team) => ({
                                        label: team.name,
                                        value: team.name,
                                    }))}
                                    placeholder="Sélectionner une ou plusieurs équipes"
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
                            </div>
                        </fieldset>
                        <Button
                            // className={fr.cx("fr-mt-3w")}
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
                    </>
                )}
            </form>
        </>
    );
};

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
