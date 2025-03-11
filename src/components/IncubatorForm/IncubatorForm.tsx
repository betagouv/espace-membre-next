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
import UploadForm from "../UploadForm/UploadForm";
import {
    incubatorUpdateSchema,
    incubatorUpdateSchemaType,
} from "@/models/actions/incubator";
import { incubatorSchemaType } from "@/models/incubator";
import { Option } from "@/models/misc";

import "react-markdown-editor-lite/lib/index.css";
import SESelect from "../SESelect";

const NEW_INCUBATOR_DATA = {
    title: "",
    ghid: "",
    contact: "",
    owner_id: undefined,
    website: "",
    description: "",
    short_description: "",
};

const mdParser = new MarkdownIt(/* Markdown-it options */);

// data from secretariat API
export interface IncubatorFormProps {
    sponsorOptions: Option[];
    startupOptions: Option[];
    incubator?: incubatorSchemaType;
    save: (data: incubatorUpdateSchemaType) => any;
    logoURL?: string;
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
    id: keyof incubatorUpdateSchemaType["incubator"];
    placeholder?: string;
    [some: string]: any;
}) {
    const fieldShape = incubatorUpdateSchema.shape["incubator"].shape[id];
    const nativeProps =
        props.textArea === true
            ? {
                  nativeTextAreaProps: {
                      placeholder,
                      rows,
                      ...register(`incubator.${id}`),
                  },
              }
            : {
                  nativeInputProps: {
                      placeholder,
                      ...register(`incubator.${id}`),
                  },
              };
    return (
        (fieldShape && (
            <Input
                label={fieldShape.description}
                {...nativeProps}
                state={
                    errors && errors.incubator && errors.incubator
                        ? "error"
                        : "default"
                }
                stateRelatedMessage={
                    errors && errors.incubator && errors.incubator[id]?.message
                }
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
            incubator: {
                ...(props.incubator || NEW_INCUBATOR_DATA),
            },
            // incubatorSponsors: (props.incubatorSponsors || []).map(
            //     (s) => s.uuid
            // ),
        },
    });
    const defaultHighlightStartups = props.startupOptions.filter((s) =>
        props.incubator
            ? props.incubator.highlighted_startups &&
              props.incubator.highlighted_startups.includes(s.value)
            : undefined,
    );
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
                if (resp.success) {
                    setAlertMessage({
                        title: `Mise à jour effectuée`,
                        message: `La mise à jour a bien été effectuée. Elle sera visible en ligne d'ici 24 heures.`,
                        type: "success",
                    });
                } else {
                    setAlertMessage({
                        title: `Une erreur est survenue`,
                        message: resp.message || "",
                        type: "warning",
                    });
                }
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
                            errors?.incubator &&
                            errors?.incubator.short_description
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
                                    setValue(
                                        "incubator.short_description",
                                        data.text,
                                        {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        },
                                    );
                                }}
                            />
                        </ClientOnly>
                    </div>
                    <div
                        className={`fr-input-group ${
                            errors?.incubator && errors?.incubator.description
                                ? "fr-input-group--error"
                                : ""
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
                                    setValue(
                                        "incubator.description",
                                        data.text,
                                        {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        },
                                    );
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
                        value={watch("incubator.owner_id")}
                        allSponsors={props.sponsorOptions}
                        onChange={(newSponsor) => {
                            setValue("incubator.owner_id", newSponsor || "");
                        }}
                        placeholder={"Sélectionnez un sponsor"}
                        containerStyle={{
                            marginBottom: `0.5rem`,
                        }}
                        hint={
                            "Indiquez l'administration qui porte cet incubateur"
                        }
                        state={
                            errors.incubator &&
                            errors.incubator.owner_id &&
                            "error"
                        }
                        stateMessageRelated={
                            errors.incubator &&
                            errors.incubator.owner_id &&
                            errors.incubator.owner_id.message
                        }
                        isMulti={false}
                    ></SESponsorSelect>
                    <SESelect
                        defaultValue={defaultHighlightStartups}
                        onChange={(startups) => {
                            setValue(
                                "incubator.highlighted_startups",
                                startups.map((startup) => startup.value),
                                {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                },
                            );
                        }}
                        isMulti={true}
                        placeholder={`Sélectionne un ou plusieurs produits`}
                        startups={props.startupOptions}
                        label="Produits phares de l'incubateur :"
                    />
                    <hr />
                    <UploadForm
                        label="Logo de l'incubateur"
                        placeholderURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA8AAAAIcCAIAAAC2P1AsAAAPP0lEQVR4Xu3WwY3kyBVF0fahrON2kDRDVsgl2VNjAsU1AVX3/UJnx1Scg7tKgECsfr4fFwAA8Mt+PH8AAAD+NwMaAAACAxoAAAIDGgAAAgMaAAACAxoAAAIDGgAAAgMaAAACAxoAAAIDGgAAAgMaAAACAxoAAAIDGgAAAgMaAAACAxoAAAIDGgAAAgMaAAACAxoAAAIDGgAAAgMaAAACAxoAAAIDGgAAAgMaAAACAxoAAAIDGgAAAgMaAAACAxoAAAIDGgAAAgMaAAACAxoAAAIDGgAAAgMaAAACAxoAAAIDGgAAgvcN6I+Pjx8AAPCn3bv0OVWL9w3o+61/AwDAn3bv0udULf6vjxMDGgCAFRjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEPxjBvTHx8cPAAD40+5d+pyqxfsGNAAAfAMGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0wPdxnucBQPTX66/nPf2SAQ3wfdx/A//+z78kSan7eD7v6ZcMaIDvw4CWpEEGNMC+DGhJGmRAA+zLgJakQQY0wL4MaEkaZEAD7MuAlqRBBjTAvgxoSRpkQAPsy4CWpEEGNMC+DGhJGmRAA+zLgJakQQY0wL4MaEkaZEAD7MuAlqRBBjTAvgxoSRpkQAPsy4CWpEEGNMC+DGhJGrTugD7P8wCguC/n85h+6TCgJal3LDug75d9AlDUm25AS9KgemwNaIB11ZtuQEvSoHpsDWiAddWbbkBL0qB6bA1ogHXVm25AS9KgemwNaIB11ZtuQEvSoHpsDWiAddWbbkBL0qB6bA1ogHXVm25AS9KgemwNaIB11ZtuQEvSoHpsDWiAddWbbkBL0qB6bA1ogHXVm25AS9KgemwNaIB11ZtuQEvSoHpsDWiAddWbbkBL0qB6bA1ogHXVm25AS9KgemwNaIB11ZtuQEvSoHpsDWiAddWbbkBL0qB6bA1ogHXVm25AS9KgemwNaIB11ZtuQEvSoHpsDWiAddWbbkBL0qB6bA1ogHXVm25AS9KgemwNaIB11ZtuQEvSoHpsDWiAddWbbkBL0qB6bA1ogHXVm25AS9KgemzfN6DP8zwAKO7L+TymXzoMaEnqHcsOaAB+NwNakgYZ0AD7MqAlaZABDbAvA1qSBhnQAPsyoCVpkAENsC8DWpIGGdAA+zKgJWmQAQ2wLwNakgYZ0AD7MqAlaZABDbAvA1qSBhnQAPsyoCVpkAENsC8DWpIGGdAA+zKgJWmQAQ2wLwNakgYZ0AD7MqAlaZABDbAvA1qSBhnQAPsyoCVpkAENsC8DWpIGGdAA+zKgJWmQAQ2wLwNakgYZ0AD7MqAlaZABDbAvA1qSBhnQAPsyoCVpkAENsC8DWpIGGdAA+zKgJWmQAQ2wLwNakgYZ0AD7MqAlaZABDbAvA1qSBhnQAPsyoCVpkAENsC8DWpIGrTigX6/XAUB0nufznv7MYUBLUu9YcEDfb/oEIKoH/TKgJWlUvbcGNMCi6kG/DGhJGlXvrQENsKh60C8DWpJG1XtrQAMsqh70y4CWpFH13hrQAIuqB/0yoCVpVL23BjTAoupBvwxoSRpV760BDbCoetAvA1qSRtV7a0ADLKoe9MuAlqRR9d4a0ACLqgf9MqAlaVS9twY0wKLqQb8MaEkaVe+tAQ2wqHrQLwNakkbVe2tAAyyqHvTLgJakUfXeGtAAi6oH/TKgJWlUvbcGNMCi6kG/DGhJGlXvrQENsKh60C8DWpJG1XtrQAMsqh70y4CWpFH13hrQAIuqB/0yoCVpVL23BjTAoupBvwxoSRpV760BDbCoetAvA1qSRtV7a0ADLKoe9MuAlqRR9d4a0ACLqgf9MqAlaVS9t+8Y0Od5HgBE9/F83tOfOQxoSeodCw5oAN7DgJakQQY0wL4MaEkaZEAD7MuAlqRBBjTAvgxoSRpkQAPsy4CWpEEGNMC+DGhJGmRAA+zLgJakQQY0wL4MaEkaZEAD7MuAlqRBBjTAvgxoSRpkQAPsy4CWpEEGNMC+DGhJGmRAA+zLgJakQQY0wL4MaEkaZEAD7MuAlqRBBjTAvgxoSRpkQAPsy4CWpEEGNMC+DGhJGmRAA+zLgJakQQY0wL4MaEkaZEAD7MuAlqRBBjTAvgxoSRpkQAPsy4CWpEEGNMC+DGhJGmRAA+zLgJakQQY0wL4MaEkaZEAD7MuAlqRBBjTAvgxoSRpkQAPsy4CWpEEGNMC+DGhJGmRAA+zLgJakQSsO6PM8DwCi+3g+7+nPHAa0JPWOBQf0/aZPAKJ60C8DWpJG1XtrQAMsqh70y4CWpFH13hrQAIuqB/0yoCVpVL23BjTAoupBvwxoSRpV760BDbCoetAvA1qSRtV7a0ADLKoe9MuAlqRR9d4a0ACLqgf9MqAlaVS9twY0wKLqQb8MaEkaVe+tAQ2wqHrQLwNakkbVe2tAAyyqHvTLgJakUfXeGtAAi6oH/TKgJWlUvbcGNMCi6kG/DGhJGlXvrQENsKh60C8DWpJG1XtrQAMsqh70y4CWpFH13hrQAIuqB/0yoCVpVL23BjTAoupBvwxoSRpV760BDbCoetAvA1qSRtV7a0ADLKoe9MuAlqRR9d4a0ACLqgf9MqAlaVS9twY0wKLqQb8MaEkaVe+tAQ2wqHrQLwNakkbVe/uOAf16vQ4AovM8n/f0Zw4DWpJ6x4IDGoD3MKAlaZABDbAvA1qSBhnQAPsyoCVpkAENsC8DWpIGGdAA+zKgJWmQAQ2wLwNakgYZ0AD7MqAlaZABDbAvA1qSBhnQAPsyoCVpkAENsC8DWpIGGdAA+zKgJWmQAQ2wLwNakgYZ0AD7MqAlaZABDbAvA1qSBhnQAPs6z/MAIDrP1/OefsmABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDgHQP6PM8DAACWdI/V53790jsG9P2sTwAAWNI9Vp/79UsGNAAAWzOgAQAgMKABACAwoAEAIDCgAQAgMKABACAwoAEAIDCgAQAgMKABACAwoAEAIDCgAQAgMKABACAwoAEAIDCgAQAgMKABACAwoAEAIDCgAQAgMKABACAwoAEAIDCgAQAgMKABACBYcUCf53kAAMCS7rH63K9feseABgCAb8OABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCAwIAGAIDAgAYAgMCABgCA4B0D+vV6HQAAsKR7rD7365feMaDvZ30CAMCS7rH63K9fMqABANiaAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAACBAQ0AAMGKA/o8zwMAAJZ0j9Xnfv3SOwY0AAB8GwY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABAY0AAAEBjQAAAQGNAAABL93QJ/neQAAwJLusfrcr7/g9w7o+1mfAACwpHusPvfrLzCgAQDYlAENAACBAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAADBigP6PM8DAACW9Hq9nvv1F/zeAQ0AAN+MAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAACBAQ0AAIEBDQAAgQENAACBAQ0AAMF/AfN0Hd9SLe9iAAAAAElFTkSuQmCC"
                        hintText="Il s'agit du logo de votre incubateur."
                        onChange={(event) => {
                            const file = event.target.files;
                            if (file && file.length) {
                                setValue("logo", file[0], {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                });
                                setValue("shouldDeleteLogo", false);
                            }
                        }}
                        shape={"rectangle"}
                        url={props.logoURL}
                        onDelete={() => {
                            setValue("logo", null, {
                                shouldValidate: true,
                                shouldDirty: true,
                            });
                            if (props.logoURL) {
                                setValue("shouldDeleteLogo", true);
                            }
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
