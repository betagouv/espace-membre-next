"use client";
import React, { useCallback } from "react";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import _ from "lodash";
import { useForm } from "react-hook-form";

import SESponsorSelect from "../SESponsorSelect";
import {
    incubatorUpdateSchema,
    incubatorUpdateSchemaType,
} from "@/models/actions/incubator";
import { incubatorSchemaType } from "@/models/incubator";
import { Option } from "@/models/misc";

const NEW_INCUBATOR_DATA: incubatorUpdateSchemaType = {
    title: "",
    ghid: "",
    contact: "",
    owner_id: "",
};

// data from secretariat API
export interface IncubatorFormProps {
    sponsorOptions: Option[];
    incubator?: incubatorSchemaType;
    save: (data: incubatorUpdateSchemaType) => any;
}

// boilerplate for text inputs
function BasicFormInput({
    register,
    errors,
    id,
    placeholder,
    ...props
}: {
    id: keyof incubatorUpdateSchemaType;
    placeholder?: string;
    [some: string]: any;
}) {
    const fieldShape = incubatorUpdateSchema.shape[id];
    return (
        (fieldShape && (
            <Input
                label={fieldShape.description}
                nativeInputProps={{
                    placeholder,
                    ...register(`${id}`),
                }}
                state={errors && errors[id] ? "error" : "default"}
                stateRelatedMessage={errors && errors[id]?.message}
                {...(props ? props : {})}
            />
        )) || <>Not found in schema: {id}</>
    );
}

export function IncubatorForm(props: IncubatorFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
        getValues,
        watch,
        control,
    } = useForm<incubatorUpdateSchemaType>({
        resolver: zodResolver(incubatorUpdateSchema),
        mode: "onChange",
        defaultValues: {
            ...(props.incubator || NEW_INCUBATOR_DATA),
            // incubatorSponsors: (props.incubatorSponsors || []).map(
            //     (s) => s.uuid
            // ),
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
        [register, errors]
    );
    const onSubmit = (data: incubatorUpdateSchemaType, e) => {
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
                    title: `Mise à jour effectuée`,
                    message: <>La mise à jour a bien été effectuée</>,
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
                        id="title"
                        label="Nom de l'incubateur (obligatoire)"
                        placeholder="ex: Incubateur de Service Numérique"
                        hintText={`Le nom complet de l'incubateur et
                                ne doit pas dépasser 30 caractères.`}
                    />
                    <BasicInput
                        id="ghid"
                        label="Acronyme de l'incubateur (obligatoire)"
                        placeholder="ISN"
                        hintText={`Par exemple : "ISN"`}
                    />
                    <BasicInput
                        id="contact"
                        label="Contact"
                        placeholder="ex: contact@[incubator].beta.gouv.fr"
                        hintText="L'email a utilisé pour contacter l'incubateur"
                    />
                    <BasicInput
                        id="address"
                        label="Adresse"
                        placeholder="ex: 27 avenue de Ségur, 75006, Paris"
                    />
                    <BasicInput
                        id="website"
                        label="Site web"
                        placeholder="ex: https://beta.gouv.fr"
                    />
                    <BasicInput
                        id="github"
                        label="Organisation github de l'incubateur"
                        placeholder="ex: https://github.com/beta.gouv.fr"
                    />
                    <SESponsorSelect
                        value={getValues("owner_id")}
                        allSponsors={props.sponsorOptions}
                        onChange={(newSponsor) => {
                            setValue("owner_id", newSponsor);
                        }}
                        placeholder={"Sélectionnez des sponsors"}
                        containerStyle={{
                            marginBottom: `0.5rem`,
                        }}
                        hint={
                            "Indiquez la ou les administrations qui sponsorisent votre produit"
                        }
                        isMulti={false}
                    ></SESponsorSelect>
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
