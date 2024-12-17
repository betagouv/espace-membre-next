"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import MatomoSiteSelect from "../MatomoSiteSelect";
import { askAccountCreationForService } from "@/app/api/services/actions";
import {
    MATOMO_SITE_TYPE,
    matomoAccountRequestSchema,
    matomoAccountRequestSchemaType,
} from "@/models/actions/service";
import { SERVICES } from "@/models/services";

export default function MatomoServiceForm(props: { sites }) {
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();

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
                        {!props.sites.length && (
                            <p>
                                Nous n'avons pas enregistré de site matomo
                                existant pour les produits sur lesquels tu
                                travailles actuellemment. Si pourtant des sites
                                existes merci de nous le signaler en envoyant un
                                message dans le chatbot crips présent sur cette
                                page.
                            </p>
                        )}
                        <AddMatomoServiceForm
                            sites={props.sites}
                            setAlertMessage={setAlertMessage}
                        />
                        {props.sites.length && <p className="fr-hr-or">ou</p>}
                        <CreateMatomoServiceForm
                            setAlertMessage={setAlertMessage}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

const CreateMatomoServiceForm = ({ setAlertMessage }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        control,
        setValue,
        watch,
    } = useForm<matomoAccountRequestSchemaType>({
        resolver: zodResolver(matomoAccountRequestSchema),
        mode: "onChange",
        defaultValues: {
            newSite: {},
        },
    });
    const [isSaving, setIsSaving] = React.useState(false);

    const newSite = watch("newSite"); // Watch newSites array

    return (
        <form>
            <fieldset
                className="fr-mt-5v fr-mb-0v fr-fieldset"
                id="identity-fieldset"
                aria-labelledby="identity-fieldset-legend identity-fieldset-messages"
            >
                <legend
                    className="fr-fieldset__legend"
                    id="login-9355-fieldset-legend"
                >
                    <h3 className="fr-h5">Créer un nouveau site</h3>
                </legend>
                <div className="fr-fieldset__element">
                    <p className="fr-text--sm">
                        Si un site ou une app dont tu veux suivres les stats
                        n'existe pas encore dans matomo, tu peux la créer via ce
                        formulaire.
                    </p>
                </div>
                <div
                    className={fr.cx(
                        "fr-fieldset__element",
                        "fr-col-12",
                        "fr-col-lg-12",
                        "fr-col-md-12"
                    )}
                >
                    <Select
                        label="Sélectionne le type de site dont il s'agit"
                        nativeSelectProps={{
                            ...register(`newSite.type`, {
                                required: true,
                            }),
                            required: true,
                        }}
                    >
                        <option
                            key={MATOMO_SITE_TYPE.website}
                            value={MATOMO_SITE_TYPE.website}
                        >
                            Site web
                        </option>
                        <option
                            key={MATOMO_SITE_TYPE.mobileapp}
                            value={MATOMO_SITE_TYPE.mobileapp}
                        >
                            App mobile
                        </option>
                    </Select>
                    {newSite.type === MATOMO_SITE_TYPE.mobileapp && (
                        <Input
                            label="Nom de l'app"
                            nativeInputProps={{
                                placeholder: "Nom de la startup app mobile",
                                ...register(`newSite.name`, {
                                    required: true,
                                }),
                                required: true,
                            }}
                        />
                    )}
                    {newSite.type === MATOMO_SITE_TYPE.website && (
                        <Input
                            label="Entre l'url du site que tu veux suivre"
                            nativeInputProps={{
                                placeholder:
                                    "https://nomdelastartup.beta.gouv.fr",
                                ...register(`newSite.url`, {
                                    required: true,
                                }),
                                required: true,
                            }}
                        />
                    )}
                </div>
            </fieldset>
            <Button
                className={fr.cx("fr-mt-3w")}
                disabled={isSaving}
                children={
                    isSubmitting
                        ? `Enregistrement de la demande...`
                        : `Créer ce site`
                }
                nativeButtonProps={{
                    type: "submit",
                    disabled: !isDirty || isSubmitting,
                }}
            />
        </form>
    );
};

const AddMatomoServiceForm = ({ setAlertMessage, sites }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        control,
        setValue,
        watch,
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

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            aria-label="Demander les accès a un ou plusieurs site matomo"
        >
            {!!sites.length && (
                <>
                    <fieldset
                        className="fr-mt-5v fr-mb-0v fr-fieldset"
                        id="identity-fieldset"
                        aria-labelledby="identity-fieldset-legend identity-fieldset-messages"
                    >
                        <legend
                            className="fr-fieldset__legend"
                            id="login-9355-fieldset-legend"
                        >
                            <h3 className="fr-h5">
                                Accèder à un site existant
                            </h3>
                        </legend>
                        {siteFields.map((field, index) => (
                            <div
                                key={index}
                                className={fr.cx(
                                    "fr-fieldset__element",
                                    "fr-col-12",
                                    "fr-col-lg-10",
                                    "fr-col-md-10",
                                    "fr-col-offset-lg-2--right",
                                    "fr-col-offset-md-2--right"
                                )}
                            >
                                <MatomoSiteSelect
                                    sites={sites}
                                    defaultValue={[]}
                                    onChange={(sites) => {
                                        setValue(
                                            "sites",
                                            sites.map((startup) => ({
                                                id: parseInt(startup.value),
                                            })),
                                            {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                            }
                                        );
                                    }}
                                    isMulti={true}
                                    placeholder={`Sélectionne un ou plusieurs sites`}
                                    label="Sites des produits pour lesquels tu travailles :"
                                />
                            </div>
                        ))}
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
                </>
            )}
        </form>
    );
};
