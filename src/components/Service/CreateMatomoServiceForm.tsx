"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import SESelect, { StartupType } from "../SESelect";
import { askAccountCreationForService } from "@/app/api/services/actions";
import {
    MATOMO_SITE_TYPE,
    matomoAccountRequestSchema,
    matomoAccountRequestSchemaType,
} from "@/models/actions/service";
import { AlertMessageType } from "@/models/common";
import { SERVICES } from "@/models/services";

export const CreateMatomoServiceForm = ({
    startupOptions,
}: {
    startupOptions: StartupType[];
}) => {
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
            newSite: {
                type: MATOMO_SITE_TYPE.website,
            },
        },
    });
    const router = useRouter();
    const [isSaving, setIsSaving] = React.useState(false);
    const [alertMessage, setAlertMessage] =
        React.useState<AlertMessageType | null>();
    const newSite = watch("newSite"); // Watch newSites array

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
            router.push("/services/matomo");
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
    console.log("zod errors :", errors);
    return (
        <>
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
            {!startupOptions.length && (
                <Alert
                    small={true}
                    severity="warning"
                    description={`Attention tu n'as actuellement aucune mission avec un produit. Tu ne peux créer un site matomo que pour un produit dont tu es membre.`}
                />
            )}
            <form onSubmit={handleSubmit(onSubmit)}>
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
                            Si un site ou une app dont tu veux suivre les stats
                            n'existe pas encore dans matomo, tu peux la créer
                            via ce formulaire.
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
                        <SESelect
                            onChange={(startup) => {
                                setValue(`newSite.startupId`, startup.value, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                });
                            }}
                            isMulti={false}
                            placeholder={`Sélectionne un produits`}
                            startups={startupOptions}
                            label="Produit auquel appartient l'url"
                        />
                        {newSite &&
                            newSite.type === MATOMO_SITE_TYPE.mobileapp && (
                                <Input
                                    label="Nom de l'app"
                                    hintText="Un nom clair mentionnant le nom de la startup pour identifier l'application parmi tous les autres sites dans matomo."
                                    stateRelatedMessage={
                                        errors.newSite?.name?.message
                                    }
                                    state={
                                        errors.newSite?.name
                                            ? "error"
                                            : undefined
                                    }
                                    nativeInputProps={{
                                        placeholder:
                                            "exemple: SignalConso App Mobile",
                                        ...register(`newSite.name`, {
                                            required: true,
                                        }),
                                        required: true,
                                    }}
                                />
                            )}
                        {newSite &&
                            newSite.type === MATOMO_SITE_TYPE.website && (
                                <Input
                                    label="Entre l'url du site que tu veux suivre"
                                    stateRelatedMessage={
                                        errors.newSite?.url?.message
                                    }
                                    state={
                                        errors.newSite?.message
                                            ? "error"
                                            : undefined
                                    }
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
                    // className={fr.cx("fr-mt-3w")}
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
            </form>{" "}
        </>
    );
};
