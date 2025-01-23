"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import SESelect, { StartupType } from "../SESelect";
import { askAccountCreationForService } from "@/app/api/services/actions";
import {
    sentryAccountRequestSchema,
    sentryAccountRequestSchemaType,
} from "@/models/actions/service";
import { AlertMessageType } from "@/models/common";
import { SERVICES } from "@/models/services";

export const CreateSentryServiceForm = ({
    startupOptions,
}: {
    startupOptions: StartupType[];
}) => {
    const {
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
    } = useForm<sentryAccountRequestSchemaType>({
        resolver: zodResolver(sentryAccountRequestSchema),
        mode: "onChange",
        defaultValues: {},
    });
    const router = useRouter();
    const [isSaving, setIsSaving] = React.useState(false);
    const [alertMessage, setAlertMessage] =
        React.useState<AlertMessageType | null>();
    console.log(startupOptions);
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
            router.push("/services/sentry");
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
                    description={`Attention tu n'as actuellement aucune mission avec un produit. Tu ne peux créer un team sentry que pour un produit dont tu es membre.`}
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
                        <h3 className="fr-h5">Créer une nouvelle équipe</h3>
                    </legend>
                    <div className="fr-fieldset__element">
                        <p className="fr-text--sm">
                            Si tu veux suivres un produit sur sentry, tu peux
                            créer ici l'équipe correspondante.
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
                        <SESelect
                            onChange={(startup) => {
                                setValue(`newTeam.startupId`, startup.value, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                });
                            }}
                            isMulti={false}
                            placeholder={`Sélectionne un produits`}
                            startups={startupOptions}
                            label="Produit dont tu veux suivre les erreurs"
                        />
                    </div>
                </fieldset>
                <Button
                    // className={fr.cx("fr-mt-3w")}
                    disabled={isSaving}
                    children={
                        isSubmitting
                            ? `Enregistrement de la demande...`
                            : `Créer cette équipe`
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
