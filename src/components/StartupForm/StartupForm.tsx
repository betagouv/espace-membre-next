"use client";
import React, { useCallback, useState } from "react";

import "react-markdown-editor-lite/lib/index.css";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import MarkdownIt from "markdown-it";
import { useForm } from "react-hook-form";
import MdEditor from "react-markdown-editor-lite";

import { PhasesEditor } from "./PhasesEditor";
import SponsorBlock from "./SponsorBlock";
import { ThematiquesEditor } from "./ThematiquesEditor";
import { UsertypesEditor } from "./UsertypesEditor";
import { ClientOnly } from "../ClientOnly";
import { Option } from "../CommunityPage";
import SelectAccessibilityStatus from "../SelectAccessibilityStatus";
import {
    startupInfoUpdateSchema,
    startupInfoUpdateSchemaType,
} from "@/models/actions/startup";
import { incubatorSchemaType } from "@/models/incubator";
import { sponsorSchemaType } from "@/models/sponsor";
import {
    StartupPhase,
    phaseSchemaType,
    startupSchemaType,
} from "@/models/startup";

// import style manually
const mdParser = new MarkdownIt(/* Markdown-it options */);

const DEFAULT_CONTENT = `Pour t'aider dans la rédaction de ta fiche produit, nous te recommandons de suivre ce plan: 

## Contexte

Quel est le contexte de ta Startup d'Etat ?

## Problème

Les problèmes que vous avez identifiés ou vos hypothèses de problèmes? Qui en souffre ? quels sont les conséquences de ces problèmes ?

## Solution

Décrit ta solution en quelques lignes? qui seront/sont les bénéficiaires ?

## Stratégie

Comment vous vous y prenez pour atteindre votre usagers ? quel impact chiffré visez-vous ?
`;

const NEW_PRODUCT_DATA: startupInfoUpdateSchemaType["startup"] = {
    name: "",
    pitch: "",
    description: "",
    contact: "",
    incubator_id: "",
};

// data from secretariat API
export interface StartupFormProps {
    startup?: startupSchemaType;
    startupSponsors?: sponsorSchemaType[];
    startupPhases?: phaseSchemaType[];
    incubatorOptions: Option[];
    sponsorOptions: Option[];
    save: (data: startupInfoUpdateSchemaType) => any;
}

// boilerplate for text inputs
function BasicFormInput({
    register,
    errors,
    id,
    placeholder,
    ...props
}: {
    id: keyof startupInfoUpdateSchemaType["startup"];
    placeholder?: string;
    [some: string]: any;
}) {
    const fieldShape = startupInfoUpdateSchema.shape["startup"].shape[id];
    return (
        (fieldShape && (
            <Input
                label={fieldShape.description}
                nativeInputProps={{
                    placeholder,
                    ...register(`startup.${id}`),
                }}
                state={
                    errors["startup"] && errors["startup"][id]
                        ? "error"
                        : "default"
                }
                stateRelatedMessage={
                    errors["startup"] && errors["startup"]?.message
                }
                {...(props ? props : {})}
            />
        )) || <>Not found in schema: {id}</>
    );
}

export function StartupForm(props: StartupFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting, isValid },
        setValue,
        getValues,
        watch,
        control,
    } = useForm<startupInfoUpdateSchemaType>({
        resolver: zodResolver(startupInfoUpdateSchema),
        mode: "onChange",
        defaultValues: {
            startup: props.startup || NEW_PRODUCT_DATA,
            startupSponsors: (props.startupSponsors || []).map((s) => s.uuid),
            startupPhases: props.startupPhases || [
                {
                    name: StartupPhase.PHASE_INVESTIGATION,
                    start: new Date(),
                },
            ],
            newSponsors: [],
            newPhases: [],
        },
    });

    const [newSponsors, setNewSponsors] = useState<any[]>([]);

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
    const onSubmit = (data: startupInfoUpdateSchemaType, e) => {
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
                        title: "Une erreur est survenue 2",
                        message: "Merci de vérifier les champs du formulaire",
                        type: "warning",
                    });
                }
                setIsSaving(false);
            });
    };

    watch("startup.analyse_risques"); // allow checkbox interaction
    watch("startupSponsors"); // enable autocomplete update

    const hasAnalyseDeRisque =
        !!props.startup?.analyse_risques ||
        !!props.startup?.analyse_risques_url ||
        !!getValues("startup.analyse_risques");

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
                        placeholder="ex: Démarches simplifiées"
                        hintText={`Ce nom sert d'identifiant pour la startup et
                                ne doit pas dépasser 30 caractères.`}
                    />
                    <BasicInput
                        id="pitch"
                        label="Quel est son objectif principal ?"
                        hintText={`Par exemple : "Faciliter la création d'une
                                    fiche produit". Pas besoin de faire plus
                                    long.`}
                    />
                    <BasicInput
                        id="contact"
                        placeholder="ex: contact@[startup].beta.gouv.fr"
                    />

                    <div
                        className={`fr-input-group ${
                            errors?.startup?.thematiques
                                ? "fr-input-group--error"
                                : ""
                        }`}
                    >
                        <label className="fr-label">
                            Thématiques{" "}
                            <span className="fr-hint-text">
                                Indiquez toutes les thématiques adressées par la
                                startup
                            </span>
                        </label>

                        <ThematiquesEditor
                            defaultValue={
                                getValues("startup.thematiques") || []
                            }
                            onChange={(e, data) => {
                                setValue("startup.thematiques", data, {
                                    shouldDirty: true,
                                });
                            }}
                        />
                    </div>
                    <div
                        className={`fr-input-group ${
                            errors?.startup?.usertypes
                                ? "fr-input-group--error"
                                : ""
                        }`}
                    >
                        <label className="fr-label">
                            Utilisateurs cible{" "}
                            <span className="fr-hint-text">
                                Indiquez toutes les utilisateurs qui
                                bénéficieront du produit
                            </span>
                        </label>

                        <UsertypesEditor
                            defaultValue={getValues("startup.usertypes") || []}
                            onChange={(e, data) => {
                                setValue("startup.usertypes", data, {
                                    shouldDirty: true,
                                });
                            }}
                        />
                    </div>
                    <hr />
                    <div
                        className={`fr-input-group ${
                            errors?.startup?.description
                                ? "fr-input-group--error"
                                : ""
                        }`}
                    >
                        <label className="fr-label">
                            Description du produit :
                            <span className="fr-hint-text">
                                {
                                    startupInfoUpdateSchema.shape.startup.shape
                                        .description.description
                                }
                            </span>
                        </label>
                        <ClientOnly>
                            <MdEditor
                                defaultValue={
                                    props.startup?.description ||
                                    DEFAULT_CONTENT
                                }
                                style={{
                                    height: "500px",
                                    marginTop: "0.5rem",
                                }}
                                renderHTML={(text) => mdParser.render(text)}
                                onChange={(data, e) => {
                                    setValue("startup.description", data.text, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                    });
                                }}
                            />
                        </ClientOnly>
                        {!!errors?.startup?.description && (
                            <p
                                id="text-input-error-desc-error"
                                className="fr-error-text"
                            >
                                {errors?.startup?.description.message}
                            </p>
                        )}
                    </div>
                    <hr />
                    <Select
                        label={
                            startupInfoUpdateSchema.shape.startup.shape
                                .incubator_id.description
                        }
                        nativeSelectProps={register("startup.incubator_id")}
                        hint="Indiquez la structure dans laquelle est portée votre produit"
                        state={
                            errors?.startup?.incubator_id ? "error" : "default"
                        }
                        stateRelatedMessage={
                            errors?.startup?.incubator_id?.message
                        }
                    >
                        <option value="">Séléctionnez un incubateur</option>
                        {props.incubatorOptions.map((incubator) => (
                            <option
                                value={incubator.value}
                                key={incubator.value}
                            >
                                {incubator.label}
                            </option>
                        ))}
                    </Select>

                    <SponsorBlock
                        sponsors={[
                            ...(getValues("startupSponsors") || []),
                            ...getValues("newSponsors").map((s) => s.ghid),
                        ]}
                        allSponsors={{
                            ...props.sponsorOptions.reduce(
                                (a, c) => ({ ...a, [c.value]: c }),
                                {}
                            ),
                            ...getValues("newSponsors").reduce(
                                (a, c) => ({ ...a, [c.ghid]: c }),
                                {}
                            ),
                        }}
                        setSponsors={(data) => {
                            setValue("startupSponsors", data);
                        }}
                        setNewSponsors={(
                            data: startupInfoUpdateSchemaType["newSponsors"]
                        ) => {
                            setValue("newSponsors", [
                                ...(getValues("newSponsors") || []),
                                ...data,
                            ]);
                            // setValue(
                            //     "startupSponsors",
                            //     [
                            //         ...(getValues("startupSponsors") || []),
                            //         ...data.map((s) => s.ghid),
                            //     ],
                            //     { shouldDirty: true }
                            // );
                        }}
                    />
                    <div
                        className={`fr-input-group ${
                            errors.startupPhases ? "fr-input-group--error" : ""
                        }`}
                    >
                        <label className="fr-label">
                            Phase
                            <span className="fr-hint-text">
                                Voici l'historique des phases dans lesquelles a
                                été ce produit.
                            </span>
                        </label>
                        <PhasesEditor
                            control={control}
                            register={register}
                            setValue={setValue}
                            getValues={getValues}
                            errors={errors.startupPhases || []}
                        />
                    </div>
                    {/*[FILE UPLOAD ]<hr />*/}
                    <BasicInput id="link" />
                    <BasicInput id="repository" />
                    <BasicInput id="dashlord_url" />

                    <SelectAccessibilityStatus
                        value={props.startup?.accessibility_status}
                        onChange={(e) =>
                            setValue(
                                "startup.accessibility_status",
                                e.currentTarget.value || undefined
                            )
                        }
                    />
                    <Checkbox
                        options={[
                            {
                                label: startupInfoUpdateSchema.shape.startup
                                    .shape.mon_service_securise.description,
                                hintText:
                                    "Cochez cette case si votre produit est inscrit sur MonServiceSécurisé",
                                nativeInputProps: {
                                    ...register("startup.mon_service_securise"),
                                },
                            },
                        ]}
                    />
                    <Checkbox
                        options={[
                            {
                                label: startupInfoUpdateSchema.shape.startup
                                    .shape.analyse_risques.description,
                                hintText:
                                    "Cochez cette case si l'équipe a produit une analyse de risque",
                                nativeInputProps: {
                                    ...register("startup.analyse_risques"),
                                    checked: hasAnalyseDeRisque,
                                },
                            },
                        ]}
                    />
                    {hasAnalyseDeRisque && (
                        <BasicInput
                            id="analyse_risques_url"
                            hintText="Si l'analyse de risques est publique, tu peux indiquer le lien vers ce document ici."
                        />
                    )}
                    <BasicInput
                        id="stats_url"
                        hintText="Si la page de stastiques est publique, tu peux indiquer le lien vers ce document ici."
                    />
                    <BasicInput
                        id="budget_url"
                        hintText="Si le budget est public, tu peux indiquer le lien vers ce document ici."
                    />

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
