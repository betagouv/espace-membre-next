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
import _ from "lodash";
import MarkdownIt from "markdown-it";
import { useForm } from "react-hook-form";
import MdEditor from "react-markdown-editor-lite";

import { EventsEditor } from "./EventsEditor";
import { PhasesEditor } from "./PhasesEditor";
import SponsorBlock from "./SponsorBlock";
import { ThematiquesEditor } from "./ThematiquesEditor";
import { UsertypesEditor } from "./UsertypesEditor";
import { ClientOnly } from "../ClientOnly";
import SelectAccessibilityStatus from "../SelectAccessibilityStatus";
import UploadForm from "../UploadForm/UploadForm";
import frontConfig from "@/frontConfig";
import {
    startupInfoUpdateSchema,
    startupInfoUpdateSchemaType,
} from "@/models/actions/startup";
import { Option } from "@/models/misc";
import { sponsorSchemaType } from "@/models/sponsor";
import {
    StartupEvent,
    StartupPhase,
    eventSchemaType,
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
    shotURL?: string;
    heroURL?: string;
    startup?: startupSchemaType;
    startupSponsors?: sponsorSchemaType[];
    startupPhases?: phaseSchemaType[];
    startupEvents?: eventSchemaType[];
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
            startupEvents: props.startupEvents || [
                {
                    name: undefined,
                    date: new Date(),
                },
            ],
            newSponsors: [],
            newPhases: [],
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
    const startupSponsors = watch("startupSponsors"); // enable autocomplete update
    const newSponsors = watch("newSponsors");
    const sponsors = [
        ...(startupSponsors || []),
        ...newSponsors.map((s) => s.ghid),
    ];
    const allSponsors = {
        ...props.sponsorOptions,
        ...newSponsors.map((newSponsor) => ({
            value: newSponsor.ghid,
            label: newSponsor.name,
        })),
    };
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
                    {/* <div
                        className={`fr-input-group ${
                            errors?.startup?.thematiques
                                ? "fr-input-group--error"
                                : ""
                        }`}
                    >
                        <label className="fr-label">
                            Techno{" "}
                            <span className="fr-hint-text">
                                Indiquez les technologies utilisées par la
                                startup
                            </span>
                        </label>

                        <TechnoEditor
                            defaultValue={getValues("startup.techno") || []}
                            onChange={(e, data) => {
                                setValue("startup.techno", data, {
                                    shouldDirty: true,
                                });
                            }}
                        />
                    </div> */}
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
                    {frontConfig.FEATURE_SHOW_UPLOAD_IMAGE_PRODUCT_WIDGET && (
                        <>
                            <hr />
                            <UploadForm
                                label="Photo de la banière hero"
                                onChange={(event) => {
                                    const file = event.target.files;
                                    if (file && file.length) {
                                        setValue("hero", file[0], {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        });
                                        setValue("shouldDeleteHero", false);
                                    }
                                }}
                                placeholderURL="data:image/png;base64,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QAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAYEADAECw4oA+z/MAAIAl3WP1uV/f+sSABgCAL8OABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgODPDujzPA8AAFjSPVaf+/U3/NkBfT/rJwAALOkeq8/9+hsMaAAANmVAAwBAYEADAEBgQAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAsOKAPs/zAACAJb1er+d+/Q1/dkADAMAXY0ADAEBgQAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAYEADAEBgQAMAQGBAAwBAYEADAEDwHxKMsYk1ZNkvAAAAAElFTkSuQmCC"
                                url={props.heroURL}
                                onDelete={() => {
                                    setValue("hero", null, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                    });
                                    if (props.heroURL) {
                                        setValue("shouldDeleteHero", true);
                                    }
                                }}
                            />
                            <hr />
                            <UploadForm
                                label="Image à droite du nom du produit"
                                placeholderURL="data:image/png;base64,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"
                                hintText="Il s'agit d'une image représentant votre produit, généralemment il s'agit de la page d'accueil du produit."
                                onChange={(event) => {
                                    const file = event.target.files;
                                    if (file && file.length) {
                                        setValue("shot", file[0], {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        });
                                        setValue("shouldDeleteShot", false);
                                    }
                                }}
                                url={props.shotURL}
                                onDelete={() => {
                                    setValue("shot", null, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                    });
                                    if (props.shotURL) {
                                        setValue("shouldDeleteShot", true);
                                    }
                                }}
                            />
                        </>
                    )}
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
                        <option value="" disabled hidden>
                            Séléctionnez un incubateur
                        </option>
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
                        sponsors={sponsors}
                        allSponsors={allSponsors}
                        setSponsors={(selectedSponsorIds: string[]) => {
                            /* workaround can probably be better, and we could probably do that
                            just before the call to save method instead of in this function
                            :
                                here selectSponsorIds can be uuid or ghid.
                                If it is a ghid, it means it is a new sponsor and
                                we don't want to upload newSponsor as startupSponsor
                            */
                            const newSponsors = getValues("newSponsors");
                            const newSponsorIds = newSponsors.map(
                                (s) => s.ghid
                            );
                            // if a new sponsor was created, but it is then removed by the user
                            // we new to remove it from newSponsor
                            const idsToDelete = _.difference(
                                newSponsorIds,
                                selectedSponsorIds
                            );
                            const updatedNewSponsors = newSponsors.filter(
                                (newSponsor) =>
                                    !idsToDelete.includes(newSponsor.ghid)
                            );
                            const updatedNewSponsorIds = updatedNewSponsors.map(
                                (s) => s.ghid
                            );
                            // change startupSponsor with ids that are not newSponsorsIds
                            setValue(
                                "startupSponsors",
                                selectedSponsorIds.filter(
                                    (id) => !updatedNewSponsorIds.includes(id)
                                )
                            );
                            // change newSonsors
                            setValue("newSponsors", updatedNewSponsors);
                        }}
                        setNewSponsors={(
                            data: startupInfoUpdateSchemaType["newSponsors"]
                        ) => {
                            setValue("newSponsors", [...newSponsors, ...data], {
                                shouldValidate: true,
                                shouldDirty: true,
                            });
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
                    <div
                        className={`fr-input-group ${
                            errors.startupEvents ? "fr-input-group--error" : ""
                        }`}
                    >
                        <label className="fr-label">
                            Événements
                            <span className="fr-hint-text">
                                Voici l'historique des événements marquants de
                                la startup
                            </span>
                        </label>
                        <EventsEditor
                            control={control}
                            register={register}
                            setValue={setValue}
                            getValues={getValues}
                            errors={errors.startupEvents || []}
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
