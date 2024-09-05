"use client";
import React, { useCallback } from "react";


import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import _ from "lodash";
import MarkdownIt from "markdown-it";
import { useForm } from "react-hook-form";
import MdEditor from "react-markdown-editor-lite";

import { ClientOnly } from "../ClientOnly";
import SESponsorSelect from "../SESponsorSelect";
import {
    incubatorUpdateSchema,
    incubatorUpdateSchemaType,
} from "@/models/actions/incubator";
import { incubatorSchemaType } from "@/models/incubator";
import { Option } from "@/models/misc";

import "react-markdown-editor-lite/lib/index.css";

const NEW_INCUBATOR_DATA: incubatorUpdateSchemaType = {
    title: "",
    ghid: "",
    contact: "",
    owner_id: "",
    website: "",
    description: "",
    short_description: "",
};

const mdParser = new MarkdownIt(/* Markdown-it options */);

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
    rows,
    ...props
}: {
    id: keyof incubatorUpdateSchemaType;
    placeholder?: string;
    [some: string]: any;
}) {
    const fieldShape = incubatorUpdateSchema.shape[id];
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

const DEFAULT_SHORT_DESCRIPTION =
    "Lancé en XXXX, cet incubateur a pour mission de soutenir les services en faveur de **politique publique cible**.";

const DEFAULT_DESCRIPTION = `
L’Incubateur XXXX est un programme de XXXX.

Membre du réseau beta.gouv dont il suit et diffuse [l'approche](https://beta.gouv.fr/manifeste), il vise à **accompagner XXX dans leurs usages du numérique** en :

- **intervenant directement auprès d'elles pour diagnostiquer leurs besoins** et préconiser les solutions _open source_ qui y répondent ;
- **développant, selon la méthodologie "startup d'Etat", des services publics numériques** à impact répondant à leurs besoins ;
- **transformant les méthodologies et outils des agents publics de XXX** ;
- **s'impliquant dans la structuration et l'écosystème des communs numériques**


`;
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
                    <div
                        className={`fr-input-group ${
                            errors?.short_description
                                ? "fr-input-group--error"
                                : ""
                        }`}
                    >
                        <label className="fr-label">
                            Description rapide de l'incubateur (obligatoire) :
                            <span className="fr-hint-text">
                                Aperçu en une phrase de cet incubateur.
                            </span>
                        </label>

                        <ClientOnly>
                            <MdEditor
                                plugins={[
                                    "font-bold",
                                    "font-italic",
                                    "font-underline",
                                    "font-strikethrough",
                                ]}
                                defaultValue={
                                    props.incubator?.short_description ||
                                    DEFAULT_SHORT_DESCRIPTION
                                }
                                style={{
                                    height: "160px",
                                    marginTop: "0.5rem",
                                }}
                                renderHTML={(text) => mdParser.render(text)}
                                onChange={(data, e) => {
                                    setValue("short_description", data.text, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                    });
                                }}
                            />
                        </ClientOnly>
                    </div>

                    <div
                        className={`fr-input-group ${
                            errors?.description ? "fr-input-group--error" : ""
                        }`}
                    >
                        <label className="fr-label">
                            Description complète de l'incubateur (obligatoire) :
                            <span className="fr-hint-text">
                                Pour la fiche de l'incubateur.
                            </span>
                        </label>

                        <ClientOnly>
                            <MdEditor
                                plugins={[
                                    "header",
                                    "font-bold",
                                    "font-italic",
                                    "font-underline",
                                    "font-strikethrough",
                                    "list-unordered",
                                    "list-ordered",
                                    "block-quote",
                                    "block-wrap",
                                    "table",
                                    "image",
                                    "link",
                                    "clear",
                                    "full-screen",
                                    "tab-insert",
                                ]}
                                defaultValue={
                                    props.incubator?.description ||
                                    DEFAULT_DESCRIPTION
                                }
                                style={{
                                    height: "500px",
                                    marginTop: "0.5rem",
                                }}
                                renderHTML={(text) => mdParser.render(text)}
                                onChange={(data, e) => {
                                    setValue("description", data.text, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                    });
                                }}
                            />
                        </ClientOnly>
                    </div>

                    <BasicInput
                        id="contact"
                        label="Contact"
                        placeholder="ex: contact@[incubator].beta.gouv.fr"
                        hintText="L'email a utiliser pour contacter l'incubateur"
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
                        label="URL de l'organisation GitHub de l'incubateur"
                        placeholder="ex: https://github.com/beta.gouv.fr"
                    />
                    <SESponsorSelect
                        label="Sponsor"
                        defaultValue={getValues("owner_id")}
                        allSponsors={props.sponsorOptions}
                        onChange={(newSponsor) => {
                            setValue("owner_id", newSponsor || "");
                        }}
                        placeholder={"Sélectionnez un sponsor"}
                        containerStyle={{
                            marginBottom: `0.5rem`,
                        }}
                        hint={
                            "Indiquez l'administration qui porte cet incubateur"
                        }
                        state={errors.owner_id && "error"}
                        stateMessageRelated={
                            errors.owner_id && errors.owner_id.message
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
