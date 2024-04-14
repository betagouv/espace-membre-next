"use client";
import React, { useCallback } from "react";

import {
    AccessibilityStatus,
    PHASES_ORDERED_LIST,
    StartupInfo,
    StartupPhase,
} from "@/models/startup";

import "react-markdown-editor-lite/lib/index.css";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input, { InputProps } from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Table from "@codegouvfr/react-dsfr/Table";

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

interface StartupForm {
    sponsors?: string[];
    incubator?: string;
    mission?: string;
    stats_url?: string;
    link?: string;
    dashlord_url?: string;
    analyse_risques_url?: string;
    analyse_risques?: boolean;
    repository?: string;
    content: string;
    accessibility_status?: any;
    save: any;
    contact?: string;
    phases?: {
        start: string;
        end?: string;
        name: StartupPhase;
    }[];
    startup?: { attributes: { name: string } };
}

interface FormErrorResponse {
    errors?: Record<string, string[]>;
    message: string;
}

const blobToBase64 = async (blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise((resolve) => {
        reader.onloadend = () => {
            resolve(reader.result);
        };
    });
};

import { startupSchemaWithMarkdown } from "@/models/startup";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import MarkdownIt from "markdown-it";
import { useForm } from "react-hook-form";
import MdEditor from "react-markdown-editor-lite";
import {
    PhaseActionCell,
    PhaseDatePickerCell,
    PhaseSelectionCell,
} from "./PhaseItem";
import SponsorBlock from "./SponsorBlock";
import { ClientOnly } from "../ClientOnly";
import FileUpload from "../FileUpload";
import SEAsyncIncubateurSelect from "../SEAsyncIncubateurSelect";
import SelectAccessibilityStatus from "../SelectAccessibilityStatus";
import { GithubAPIPullRequest } from "@/lib/github";
import { PullRequestWarning } from "../PullRequestWarning";
import { fr } from "@codegouvfr/react-dsfr";
import { Incubator } from "@/models/incubator";
import Select from "@codegouvfr/react-dsfr/Select";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";

type StartupSchemaType = z.infer<typeof startupSchemaWithMarkdown>;

// data from secretariat API
export interface StartupFormProps {
    formData: StartupSchemaType;
    incubators: Incubator[];
    save: (data: string) => any;
    updatePullRequest?: GithubAPIPullRequest;
}

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

    // const save = async (event) => {
    //     event.preventDefault();
    //     if (isSaving) {
    //         return;
    //     }
    //     setIsSaving(true);
    //     let data = {
    //         phases,
    //         text,
    //         link,
    //         dashlord_url,
    //         mission,
    //         title,
    //         incubator,
    //         newSponsors: newSponsors,
    //         sponsors: sponsors,
    //         stats_url,
    //         repository,
    //         image: "",
    //         contact,
    //         analyse_risques,
    //         analyse_risques_url,
    //         accessibility_status,
    //     };
    //     if (selectedFile) {
    //         const imageAsBase64 = await blobToBase64(selectedFile);
    //         data = {
    //             ...data,
    //             image: imageAsBase64 as string,
    //         };
    //     }
    //     props
    //         .save(data)
    //         .then((resp) => {
    //             setIsSaving(false);
    //             setAlertMessage({
    //                 title: `⚠️ Pull request pour ${
    //                     resp.isUpdate ? "la mise à jour" : "la création"
    //                 } de la fiche produit ouverte.`,
    //                 message: (
    //                     <>
    //                         Tu peux merger cette pull request :{" "}
    //                         <a href={resp.data.pr_url} target="_blank">
    //                             {resp.data.pr_url}
    //                         </a>
    //                         <br />
    //                         Une fois mergée,{" "}
    //                         {resp.isUpdate
    //                             ? `les changements apparaitront`
    //                             : `la fiche apparaitra`}{" "}
    //                         sur le site beta.
    //                     </>
    //                 ),
    //                 type: "success",
    //             });
    //             return resp;
    //         })
    //         .catch((e) => {
    //             console.error(e);
    //             setIsSaving(false);
    //             const ErrorResponse: FormErrorResponse =
    //                 e.response && (e.response.data as FormErrorResponse);
    //             if (ErrorResponse) {
    //                 setAlertMessage({
    //                     title: "Une erreur est survenue",
    //                     message: <>{ErrorResponse.message}</>,
    //                     type: "warning",
    //                 });
    //             } else {
    //                 setAlertMessage({
    //                     title: "Une erreur est survenue",
    //                     message: <>{e.toString()}</>,
    //                     type: "warning",
    //                 });
    //             }
    //             setIsSaving(false);
    //             if (ErrorResponse.errors) {
    //                 setFormErrors(ErrorResponse.errors);
    //             }
    //         });
    // };

    const onSubmit = (data, e) => {
        console.log("onSubmit", { e, data, isDirty, errors });

        if (isSaving) {
            return;
        }
        if (!isValid) {
            console.log("invalid");
            return;
        }
        setIsSaving(true);
        setAlertMessage(null);
        setTimeout(() => {
            setIsSaving(false);
        }, 3000);
    };

    watch("analyse_risques");

    const hasAnalyseDeRisque =
        !!props.formData.analyse_risques ||
        !!props.formData.analyse_risques_url ||
        !!getValues("analyse_risques");

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
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: alertMessage.message,
                                }}
                            />
                        }
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
                    [SPONSOR EDITOR ]<hr />
                    [PHASES EDITOR ]<hr />
                    [FILE UPLOAD ]<hr />
                    <BasicInput id="link" />
                    <BasicInput id="repository" />
                    <BasicInput id="dashlord_url" />
                    <BasicInput
                        id="contact"
                        placeholder="ex: contact@[startup].beta.gouv.fr"
                    />
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
                                label: "Nous avons réalisé une analyse de risque",
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
                            hintText="Si vous avez rendu une analyse de risques publique, tu peux indiquer le lien vers ce document ici."
                        />
                    )}
                    <BasicInput
                        id="stats_url"
                        hintText="Si vous avez rendu une page de statistiques publique, tu peux indiquer le lien vers ce document ici."
                    />
                    <Button
                        className={fr.cx("fr-mt-3w")}
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

                {/*
                    <>
                     

                        <div
                            className={`fr-input-group ${
                                formErrors["description du produit"]
                                    ? "fr-input-group--error"
                                    : ""
                            }`}
                        >
                            <label className="fr-label">
                                Description du produit :
                                <span className="fr-hint-text">
                                    Décrivez votre produit
                                </span>
                            </label>
                            <ClientOnly>
                                <MdEditor
                                    defaultValue={
                                        props.content || DEFAULT_CONTENT
                                    }
                                    style={{
                                        height: "500px",
                                        marginTop: "0.5rem",
                                    }}
                                    renderHTML={(text) => mdParser.render(text)}
                                    onChange={handleEditorChange}
                                />
                            </ClientOnly>
                            {!!formErrors["description du produit"] && (
                                <p
                                    id="text-input-error-desc-error"
                                    className="fr-error-text"
                                >
                                    {formErrors["description du produit"]}
                                </p>
                            )}
                        </div>
                        <SEAsyncIncubateurSelect
                            value={incubator}
                            showPlaceHolder={true}
                            onChange={(e) => {
                                setIncubator(e.value || undefined);
                            }}
                            required={true}
                        />
                        <SponsorBlock
                            newSponsors={newSponsors}
                            setNewSponsors={setNewSponsors}
                            sponsors={sponsors}
                            setSponsors={(sponsors) => setSponsors(sponsors)}
                        />
                        <div
                            className={`fr-input-group ${
                                formErrors["phases"] || formErrors["date"]
                                    ? "fr-input-group--error"
                                    : ""
                            }`}
                        >
                            <label className="fr-label">
                                Phase
                                <span className="fr-hint-text">
                                    Voici l'historique des phases dans
                                    lesquelles a été ce produit.
                                </span>
                            </label>
                            <Table
                                style={{ marginBottom: "0.5rem" }}
                                data={phases.map((phase, index) => {
                                    return [
                                        <PhaseSelectionCell
                                            name={phase.name}
                                            index={index}
                                            changePhase={changePhase}
                                            key={index}
                                        />,
                                        <PhaseDatePickerCell
                                            start={phase.start}
                                            name={phase.name}
                                            index={index}
                                            changePhaseDate={changePhaseDate}
                                            key={index}
                                        />,
                                        <PhaseActionCell
                                            index={index}
                                            deletePhase={deletePhase}
                                            key={index}
                                        />,
                                    ];
                                })}
                                headers={["Phase", "Date de début", "Action"]}
                            />
                            <span className="fr-text fr-text--sm">
                                Il manque une phase ?
                            </span>
                            <Button
                                children={`Ajouter une phase`}
                                nativeButtonProps={{
                                    onClick: () => addPhase(),
                                }}
                                style={{
                                    marginLeft: `0.5rem`,
                                    transform: `translateY(0.25rem)`,
                                }}
                                iconId="fr-icon-add-circle-fill"
                                size="small"
                                priority="tertiary no outline"
                            />
                            {!!formErrors["phases"] && (
                                <p
                                    id="text-input-error-desc-error"
                                    className="fr-error-text"
                                >
                                    {formErrors["phases"]}
                                </p>
                            )}
                            {!!formErrors["date"] && (
                                <p
                                    id="text-input-error-desc-error"
                                    className="fr-error-text"
                                >
                                    Une des dates n'est pas valide
                                </p>
                            )}
                        </div>
                        <FileUpload
                            selectedFile={selectedFile}
                            setSelectedFile={setSelectedFile}
                        />
                        <Input
                            label="URL du site"
                            nativeInputProps={{
                                onChange: (e) => {
                                    setLink(e.currentTarget.value || undefined);
                                },
                                value: link,
                            }}
                        />
                        <Input
                            label="Lien du repository github"
                            nativeInputProps={{
                                name: "Lien du repository github",
                                onChange: (e) => {
                                    setRepository(
                                        e.currentTarget.value || undefined
                                    );
                                },
                                value: repository,
                            }}
                        />
                        <Input
                            label="Lien du dashlord"
                            nativeInputProps={{
                                name: "dashlord",
                                onChange: (e) => {
                                    setDashlord(
                                        e.currentTarget.value || undefined
                                    );
                                },
                                value: dashlord_url,
                            }}
                        />
                        <Input
                            label="Contact"
                            nativeInputProps={{
                                placeholder:
                                    "ex: contact@[startup].beta.gouv.fr",
                                onChange: (e) => {
                                    setContact(
                                        e.currentTarget.value || undefined
                                    );
                                },
                                value: contact,
                                required: true,
                            }}
                        />
                        <SelectAccessibilityStatus
                            value={accessibility_status}
                            onChange={(e) =>
                                setAccessibilityStatus(
                                    e.currentTarget.value || undefined
                                )
                            }
                        />
                        <RadioButtons
                            legend="Indique si ta startup à déjà réalisé un atelier d'analyse de risque agile."
                            options={[
                                {
                                    label: "Oui",
                                    nativeInputProps: {
                                        defaultChecked:
                                            analyse_risques === true,
                                        checked: analyse_risques === true,
                                        onChange: () => setAnalyseRisques(true),
                                    },
                                },
                                {
                                    label: "Non",
                                    nativeInputProps: {
                                        defaultChecked:
                                            analyse_risques === false ||
                                            !analyse_risques,
                                        checked:
                                            analyse_risques === false ||
                                            !analyse_risques,
                                        onChange: () =>
                                            setAnalyseRisques(false),
                                    },
                                },
                            ]}
                        />
                        <Input
                            label="Url de l'analyse de risque"
                            hintText="Si vous avez rendu une analyse de risques publique, tu peux indiquer le lien vers ce document ici."
                            nativeInputProps={{
                                onChange: (e) => {
                                    setAnalyseRisquesUrl(
                                        e.currentTarget.value || undefined
                                    );
                                },
                                defaultValue: analyse_risques_url,
                            }}
                        />
                        <Input
                            label="Lien de la page stats"
                            nativeInputProps={{
                                name: "stats_url",
                                onChange: (e) => {
                                    setStatsUrl(
                                        e.currentTarget.value || undefined
                                    );
                                },
                                value: stats_url,
                            }}
                        />
                        <Button
                            nativeButtonProps={{
                                type: "submit",
                                disabled: isSaving || disabled,
                            }}
                            children={
                                isSaving
                                    ? `Enregistrement en cours...`
                                    : `Enregistrer`
                            }
                        />
                    </>
                        */}
            </div>
        </>
    );
}
