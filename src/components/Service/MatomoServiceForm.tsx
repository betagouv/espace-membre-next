"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import MatomoSiteSelect from "../MatomoSiteSelect";
import { askAccountCreationForService } from "@/app/api/services/actions";
import {
    matomoAccountRequestSchema,
    matomoAccountRequestSchemaType,
} from "@/models/actions/service";
import { AlertMessageType } from "@/models/common";
import { matomoSiteSchemaType } from "@/models/matomo";
import { SERVICES } from "@/models/services";

export default function MatomoServiceForm(props: {
    sites: matomoSiteSchemaType[];
    createAccount: boolean;
    userEmail?: string;
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
                                    Ton compte matomo sera créé avec ton adresse{" "}
                                    <b>{props.userEmail}.</b>
                                    <br />
                                    Tu dois le rattacher à un site enregistré
                                    sur matomo.
                                </p>
                            </>
                        )}
                        <h3 className="fr-h5">Accèder à un site existant</h3>
                        {!props.sites.length && (
                            <p>
                                Nous n'avons pas enregistré de site matomo
                                existant pour les produits sur lesquels tu
                                travailles actuellemment. Si pourtant des sites
                                existent merci de nous le signaler en envoyant
                                un message dans le chatbot crips présent sur
                                cette page.
                            </p>
                        )}
                        {!!props.sites.length && (
                            <AddMatomoServiceForm
                                sites={props.sites}
                                setAlertMessage={setAlertMessage}
                            />
                        )}
                        <p className="fr-hr-or fr-mt-4w">ou</p>
                        <h3 className="fr-h5">Créer un nouveau site</h3>
                        <p>
                            Si il n'existe pas encore de site pour le site que
                            tu veux ajouter. Tu peux le créer
                        </p>
                        <Button
                            linkProps={{
                                href: "/services/matomo/request/new",
                            }}
                        >
                            Créer un nouveau site
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

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
        <>
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
