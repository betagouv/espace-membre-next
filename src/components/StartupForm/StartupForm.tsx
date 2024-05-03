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
import { z } from "zod";

import { PhasesEditor } from "./PhasesEditor";
import SponsorBlock from "./SponsorBlock";
import { ThematiquesEditor } from "./ThematiquesEditor";
import { UsertypesEditor } from "./UsertypesEditor";
import { ClientOnly } from "../ClientOnly";
import { PullRequestWarning } from "../PullRequestWarning";
import SelectAccessibilityStatus from "../SelectAccessibilityStatus";

import { GithubAPIPullRequest } from "@/lib/github";
import { Incubator } from "@/models/incubator";
import { Sponsor } from "@/models/sponsor";
import { startupSchemaWithMarkdown } from "@/models/startup";

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

type StartupSchemaType = z.infer<typeof startupSchemaWithMarkdown>;

// data from secretariat API
export interface StartupFormProps {
    formData: StartupSchemaType;
    incubators: Incubator[];
    sponsors: Sponsor[];
    save: (data: string) => any;
    updatePullRequest?: GithubAPIPullRequest;
}

// boilerplate for text inputs
function BasicFormInput({
    register,
    errors,
    id,
    placeholder,
    ...props
}: {
    id: keyof StartupSchemaType;
    placeholder?: string;
    [some: string]: any;
}) {
    const fieldShape = startupSchemaWithMarkdown.shape[id];
    return (
        (fieldShape && (
            <Input
                label={fieldShape.description}
                nativeInputProps={{
                    placeholder,
                    ...register(id),
                }}
                state={errors[id] ? "error" : "default"}
                stateRelatedMessage={errors[id]?.message}
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
    } = useForm<StartupSchemaType>({
        resolver: zodResolver(startupSchemaWithMarkdown),
        mode: "onChange",
        defaultValues: props.formData,
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
    const onSubmit = (data, e) => {
        console.log("onSubmit", { e, data, isDirty, isValid, errors });

        if (isSaving) {
            return;
        }
        if (!isValid) {
            return;
        }
        setIsSaving(true);
        setAlertMessage(null);

        props
            .save({ ...data, newSponsors })
            .then((resp) => {
                setIsSaving(false);
                setAlertMessage({
                    title: `⚠️ Pull request pour ${
                        resp.isUpdate ? "la mise à jour" : "la création"
                    } de la fiche produit ouverte.`,
                    message: (
                        <>
                            Tu peux merger cette pull request :{" "}
                            <a href={resp.data.pr_url} target="_blank">
                                {resp.data.pr_url}
                            </a>
                            <br />
                            Une fois mergée,{" "}
                            {resp.isUpdate
                                ? `les changements apparaitront`
                                : `la fiche apparaitra`}{" "}
                            sur le site beta.
                        </>
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
                        title: "Une erreur est survenue 2",
                        message: "Merci de vérifier les champs du formulaire",
                        type: "warning",
                    });
                }
                setIsSaving(false);
            });
    };

    watch("analyse_risques"); // allow checkbox interaction
    watch("sponsors"); // enable autocomplete update

    const hasAnalyseDeRisque =
        !!props.formData.analyse_risques ||
        !!props.formData.analyse_risques_url ||
        !!getValues("analyse_risques");

    //console.log({ isDirty, isValid, isSaving, isSubmitting, errors });
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

                {!!props.updatePullRequest && (
                    <PullRequestWarning
                        url={props.updatePullRequest.html_url}
                    />
                )}

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    aria-label="Modifier mes informations"
                >
                    <BasicInput
                        id="title"
                        placeholder="ex: Démarches simplifiées"
                        hintText={`Ce nom sert d'identifiant pour la startup et
                                ne doit pas dépasser 30 caractères.`}
                    />
                    <BasicInput
                        id="mission"
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
                            errors.thematiques ? "fr-input-group--error" : ""
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
                            defaultValue={getValues("thematiques") || []}
                            onChange={(e, data) => {
                                setValue("thematiques", data, {
                                    shouldDirty: true,
                                });
                            }}
                        />
                    </div>
                    <div
                        className={`fr-input-group ${
                            errors.usertypes ? "fr-input-group--error" : ""
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
                            defaultValue={getValues("usertypes") || []}
                            onChange={(e, data) => {
                                setValue("usertypes", data, {
                                    shouldDirty: true,
                                });
                            }}
                        />
                    </div>
                    <hr />
                    <div
                        className={`fr-input-group ${
                            errors.markdown ? "fr-input-group--error" : ""
                        }`}
                    >
                        <label className="fr-label">
                            Description du produit :
                            <span className="fr-hint-text">
                                {
                                    startupSchemaWithMarkdown.shape.markdown
                                        .description
                                }
                            </span>
                        </label>
                        <ClientOnly>
                            <MdEditor
                                defaultValue={
                                    props.formData.markdown || DEFAULT_CONTENT
                                }
                                style={{
                                    height: "500px",
                                    marginTop: "0.5rem",
                                }}
                                renderHTML={(text) => mdParser.render(text)}
                                onChange={(data, e) => {
                                    setValue("markdown", data.text, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                    });
                                }}
                            />
                        </ClientOnly>
                        {!!errors.markdown && (
                            <p
                                id="text-input-error-desc-error"
                                className="fr-error-text"
                            >
                                {errors.markdown.message}
                            </p>
                        )}
                    </div>
                    <hr />
                    <Select
                        label={
                            startupSchemaWithMarkdown.shape.incubator
                                .description
                        }
                        nativeSelectProps={register("incubator")}
                        hint="Indiquez la structure dans laquelle est portée votre produit"
                        state={errors.incubator ? "error" : "default"}
                        stateRelatedMessage={errors.incubator?.message}
                    >
                        <option value="">Séléctionnez un incubateur</option>
                        {Object.entries(props.incubators).map(
                            ([key, value]) => (
                                <option value={key} key={key}>
                                    {value.title}
                                </option>
                            )
                        )}
                    </Select>
                    <SponsorBlock
                        sponsors={[...(getValues("sponsors") || [])]}
                        allSponsors={{
                            ...props.sponsors,
                            ...newSponsors.reduce(
                                (a, c) => ({ ...a, [c.id]: c }),
                                {}
                            ),
                        }}
                        setSponsors={(data) => {
                            setValue("sponsors", data);
                        }}
                        setNewSponsors={(data) => {
                            setNewSponsors([...newSponsors, ...data]);
                            setValue(
                                "sponsors",
                                [
                                    ...(getValues("sponsors") || []),
                                    ...data.map((s) => s.id),
                                ],
                                { shouldDirty: true }
                            );
                        }}
                    />
                    <div
                        className={`fr-input-group ${
                            errors.phases ? "fr-input-group--error" : ""
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
                            errors={errors.phases || []}
                        />
                    </div>
                    {/*[FILE UPLOAD ]<hr />*/}
                    <BasicInput id="link" />
                    <BasicInput id="repository" />
                    <BasicInput id="dashlord_url" />

                    <SelectAccessibilityStatus
                        value={props.formData.accessibility_status}
                        onChange={(e) =>
                            setValue(
                                "accessibility_status",
                                e.currentTarget.value || undefined
                            )
                        }
                    />
                    <Checkbox
                        options={[
                            {
                                label: startupSchemaWithMarkdown.shape
                                    .mon_service_securise.description,
                                hintText:
                                    "Cochez cette case si votre produit est inscrit sur MonServiceSécurisé",
                                nativeInputProps: {
                                    ...register("mon_service_securise"),
                                },
                            },
                        ]}
                    />
                    <Checkbox
                        options={[
                            {
                                label: startupSchemaWithMarkdown.shape
                                    .analyse_risques.description,
                                hintText:
                                    "Cochez cette case si l'équipe a produit une analyse de risque",
                                nativeInputProps: {
                                    ...register("analyse_risques"),
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
                        disabled={!isValid || isSaving}
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
