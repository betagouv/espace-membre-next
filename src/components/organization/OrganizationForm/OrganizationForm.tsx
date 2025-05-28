"use client";
import React, { useCallback } from "react";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import SponsorDomainSelect from "@/components/SponsorForm/SponsorDomainSelect";
import SponsorTypeSelect from "@/components/SponsorForm/SponsorTypeSelect";
import {
    organizationUpdateSchema,
    organizationUpdateSchemaType,
} from "@/models/actions/organization";
import { sponsorSchemaType } from "@/models/sponsor";

import "react-markdown-editor-lite/lib/index.css";

// data from secretariat API
export interface OrganizationFormProps {
    organization?: sponsorSchemaType;
    save: (data: organizationUpdateSchemaType) => any;
}

// boilerplate for text inputs
function BasicFormInput({
    register,
    errors,
    id,
    placeholder,
    rows,
    ...props
}: {
    id: keyof organizationUpdateSchemaType;
    placeholder?: string;
    [some: string]: any;
}) {
    const fieldShape = organizationUpdateSchema.shape[id];
    const nativeProps =
        props.textArea === true
            ? {
                  nativeTextAreaProps: {
                      placeholder,
                      rows,
                      ...register(`${id}`),
                  },
              }
            : {
                  nativeInputProps: {
                      placeholder,
                      ...register(`${id}`),
                  },
              };
    return (
        (fieldShape && (
            <Input
                label={fieldShape.description}
                {...nativeProps}
                state={errors && errors[id] ? "error" : "default"}
                stateRelatedMessage={errors && errors[id]?.message}
                {...(props ? props : {})}
            />
        )) || <>Not found in schema: {id}</>
    );
}

export function OrganizationForm(props: OrganizationFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
        getValues,
        watch,
        control,
    } = useForm<organizationUpdateSchemaType>({
        resolver: zodResolver(organizationUpdateSchema),
        mode: "onChange",
        defaultValues: {
            ...props.organization,
        },
    });
    const [alertMessage, setAlertMessage] = React.useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    const [isSaving, setIsSaving] = React.useState(false);

    const BasicInput = useCallback(
        (props) => (
            <BasicFormInput register={register} errors={errors} {...props} />
        ),
        [register, errors],
    );
    const onSubmit = (data: organizationUpdateSchemaType, e) => {
        if (isSaving) {
            return;
        }
        if (!isValid) {
            return;
        }
        setIsSaving(true);
        setAlertMessage(null);

        props
            .save({ ...data })
            .then((resp) => {
                setIsSaving(false);
                setAlertMessage({
                    title: props.organization
                        ? `Mise à jour effectuée`
                        : `Organisation créée`,
                    message: props.organization ? (
                        <>
                            La modification sera visible en ligne d'ici quelques
                            heures.
                        </>
                    ) : (
                        <>L'organisation a bien été créée</>
                    ),
                    type: "success",
                });
                return resp;
            })
            .catch((e) => {
                setIsSaving(false);
                if (e) {
                    setAlertMessage({
                        title: "Une erreur est survenue",
                        message: e.message,
                        type: "warning",
                    });
                } else {
                    setAlertMessage({
                        title: "Une erreur est survenue",
                        message: "Merci de vérifier les champs du formulaire",
                        type: "warning",
                    });
                }
                setIsSaving(false);
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
                        description={<div>{alertMessage.message}</div>}
                    />
                )}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    aria-label="Modifier mes informations"
                >
                    <BasicInput
                        id="name"
                        label="Nom de l'organisation (obligatoire)"
                        placeholder="ex: Direction Interministerielle du Numérique"
                        hintText={`Le nom complet de l'organisation sponsor et
                                ne doit pas dépasser 30 caractères.`}
                    />
                    <BasicInput
                        id="acronym"
                        label="Acronyme de l'organisation (obligatoire)"
                        placeholder="DINUM"
                        hintText={`Par exemple : "DINUM"`}
                    />
                    <SponsorTypeSelect
                        isMulti={false}
                        onChange={(value) => {
                            setValue("type", value.value, {
                                shouldValidate: true,
                                shouldDirty: true,
                            });
                        }}
                        state={errors && errors["type"] ? "error" : "default"}
                        stateRelatedMessage={errors && errors["type"]?.message}
                        defaultValue={getValues("type")}
                    />
                    {getValues("type")}
                    <SponsorDomainSelect
                        isMulti={false}
                        onChange={(value) => {
                            setValue("domaine_ministeriel", value.value, {
                                shouldValidate: true,
                                shouldDirty: true,
                            });
                        }}
                        state={
                            errors && errors["domaine_ministeriel"]
                                ? "error"
                                : "default"
                        }
                        stateRelatedMessage={
                            errors && errors["domaine_ministeriel"]?.message
                        }
                        defaultValue={getValues("domaine_ministeriel")}
                    />
                    <hr />
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
