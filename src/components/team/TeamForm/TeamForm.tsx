"use client";
import React, { useCallback } from "react";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import _ from "lodash";
import MarkdownIt from "markdown-it";

import "react-markdown-editor-lite/lib/index.css";

import { useForm } from "react-hook-form";
import MdEditor from "react-markdown-editor-lite";

import { ClientOnly } from "@/components/ClientOnly";
import SEIncubateurSelect from "@/components/SEIncubateurSelect";
import { teamUpdateSchema, teamUpdateSchemaType } from "@/models/actions/team";
import { Option } from "@/models/misc";
import { teamSchemaType } from "@/models/team";

import "react-markdown-editor-lite/lib/index.css";

const NEW_TEAM_DATA: teamUpdateSchemaType = {
    name: "",
    incubator_id: "",
    mission: "",
};

const mdParser = new MarkdownIt(/* Markdown-it options */);

// data from secretariat API
export interface TeamFormProps {
    incubatorOptions: Option[];
    team?: teamSchemaType;
    save: (data: teamUpdateSchemaType) => any;
}

const DEFAULT_SHORT_DESCRIPTION =
    "Programme d’accélération de beta.gouv.fr composé d'un cofinancement de la DINUM et d’un accompagnement par l'equipe <a href='https://doc.incubateur.net/communaute/gerer-sa-startup-detat-ou-de-territoires-au-quotidien/la-vie-dune-se/acceleration/programme-gamma'>Gamma</a>. En savoir plus sur le <a href='https://doc.incubateur.net/communaute/gerer-sa-startup-detat-ou-de-territoires-au-quotidien/la-vie-dune-se/acceleration/fonds-dacceleration-des-startups-detat#cest-quoi-le-fast'>FAST</a>.";

// boilerplate for text inputs
function BasicFormInput({
    register,
    errors,
    id,
    placeholder,
    rows,
    ...props
}: {
    id: keyof teamUpdateSchemaType;
    placeholder?: string;
    [some: string]: any;
}) {
    const fieldShape = teamUpdateSchema.shape[id];
    const nativeProps =
        props.textArea === true
            ? {
                  nativeTextAreaProps: {
                      placeholder,
                      rows,
                      ...register(`${String(id)}`),
                  },
              }
            : {
                  nativeInputProps: {
                      placeholder,
                      ...register(`${String(id)}`),
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

export function TeamForm(props: TeamFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
        getValues,
        watch,
        control,
    } = useForm<teamUpdateSchemaType>({
        resolver: zodResolver(teamUpdateSchema),
        mode: "onChange",
        defaultValues: {
            ...(props.team || NEW_TEAM_DATA),
            // teamSponsors: (props.teamSponsors || []).map(
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
    const onSubmit = (data: teamUpdateSchemaType, e) => {
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
    console.log(errors);
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
                        label="Nom de l'équipe (obligatoire)"
                        placeholder="ex: Équipe de Service Numérique"
                        hintText={`Le nom complet de l'équipe et
                                ne doit pas dépasser 30 caractères.`}
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
                                    props.team?.mission ||
                                    DEFAULT_SHORT_DESCRIPTION
                                }
                                style={{
                                    height: "160px",
                                    marginTop: "0.5rem",
                                }}
                                renderHTML={(text) => mdParser.render(text)}
                                onChange={(data, e) => {
                                    setValue("mission", data.text, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                    });
                                }}
                            />
                        </ClientOnly>
                    </div>
                    <SEIncubateurSelect
                        isMulti={false}
                        defaultValue={
                            props.incubatorOptions.filter(
                                (incubator) =>
                                    incubator.value ===
                                    getValues("incubator_id")
                            )[0]
                        }
                        label={"Incubateurs"}
                        incubatorOptions={props.incubatorOptions}
                        onChange={(e, incubator) => {
                            setValue("incubator_id", incubator.value);
                        }}
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
