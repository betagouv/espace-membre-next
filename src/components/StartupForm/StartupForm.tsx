"use client";
import React, { useCallback, useState } from "react";

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
import MdEditorCustomHeaderPlugin from "./MdEditorCustomHeaderPlugin";
import { PhasesEditor } from "./PhasesEditor";
import SponsorBlock from "./SponsorBlock";
import { TechnoEditor } from "./TechnoEditor";
import { ThematiquesEditor } from "./ThematiquesEditor";
import { UsertypesEditor } from "./UsertypesEditor";
import { ClientOnly } from "../ClientOnly";
import UploadForm from "../UploadForm/UploadForm";
import { ActionResponse } from "@/@types/serverAction";
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

import "react-markdown-editor-lite/lib/index.css";

MdEditor.use(MdEditorCustomHeaderPlugin);

// import style manually
const mdParser = new MarkdownIt(/* Markdown-it options */);

const DEFAULT_CONTENT = `Pour t'aider dans la rédaction de ta fiche produit, nous te recommandons de suivre ce plan: 

## Contexte

Quel est le contexte de ta Startup d'État ?

## Problème

Les problèmes que vous avez identifiés ou vos hypothèses de problèmes ? Qui en souffre ? Quelles sont les conséquences de ces problèmes ?

## Solution

Décris ta solution en quelques lignes ? Qui seront les bénéficiaires ?

## Objectifs à 6 mois

Objectif **d'usage** à 6 mois : quel usage chiffré visez-vous ?

Objectif **d'impact** à 6 mois : quel impact chiffré vous permettra de dire que votre première phase de construction a été un succès ?

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
  save: (data: startupInfoUpdateSchemaType) => Promise<ActionResponse>;
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
  const error = errors["startup"] && errors["startup"][id];
  return (
    (fieldShape && (
      <Input
        label={fieldShape.description}
        nativeInputProps={{
          placeholder,
          ...register(`startup.${id}`),
        }}
        state={!!error ? "error" : "default"}
        stateRelatedMessage={error?.message}
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
    [register, errors],
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
        window.scrollTo({ top: 20, behavior: "smooth" });
        if (resp.success) {
          setAlertMessage({
            title: `Mise à jour effectuée`,
            message: `La modification sera visible en ligne d'ici 24 heures.`,
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
      .catch((e: any) => {
        setIsSaving(false);
        window.scrollTo({ top: 20, behavior: "smooth" });
        setAlertMessage({
          title: "Une erreur est survenue",
          message: e.message,
          type: "warning",
        });
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
  if (Object.keys(errors).length) console.error("Validation errors :", errors);
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          aria-label="Modifier les informations du produit"
        >
          <h2>Informations</h2>

          <BasicInput
            id="name"
            placeholder="ex: Démarches simplifiées"
            hintText={`Identifiant de la startup. Ne doit pas dépasser 30 caractères.`}
          />
          <BasicInput
            id="pitch"
            label="Objectif principal"
            hintText={`Par exemple : "Faciliter la création d'une
                                    fiche produit". Pas besoin de faire
                                    long.`}
          />
          <BasicInput
            id="contact"
            placeholder="ex: contact@[startup].beta.gouv.fr"
            hintText={`Préférer un email générique plutôt que le mail d'une personne de l'équipe.`}
          />
          <BasicInput id="link" />
          <Checkbox
            options={[
              {
                label:
                  startupInfoUpdateSchema.shape.startup.shape.is_private_url
                    .description,
                hintText:
                  "Cochez cette case si votre application n'est pas accessible sur internet",
                nativeInputProps: {
                  ...register("startup.is_private_url"),
                },
              },
            ]}
          />
          <Checkbox
            options={[
              {
                label:
                  startupInfoUpdateSchema.shape.startup.shape.has_mobile_app
                    .description,
                hintText:
                  "Cochez cette case si votre produit propose une application mobile",
                nativeInputProps: {
                  ...register("startup.has_mobile_app"),
                },
              },
            ]}
          />
          <div
            className={`fr-input-group ${
              errors?.startup?.thematiques ? "fr-input-group--error" : ""
            }`}
          >
            <label className="fr-label" htmlFor="thematique-editor">
              Thématiques{" "}
              <span className="fr-hint-text">
                Par exemple : Jeunesse, Logement.
              </span>
            </label>

            <ThematiquesEditor
              defaultValue={getValues("startup.thematiques") || []}
              onChange={(e, data) => {
                setValue("startup.thematiques", data, {
                  shouldDirty: true,
                });
              }}
            />
          </div>
          <div
            className={`fr-input-group ${
              errors?.startup?.thematiques ? "fr-input-group--error" : ""
            }`}
          >
            <label className="fr-label" htmlFor="techo-editor">
              Techno{" "}
              <span className="fr-hint-text">
                Indiquez les technologies utilisées par la startup
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
          </div>
          <div
            className={`fr-input-group ${
              errors?.startup?.usertypes ? "fr-input-group--error" : ""
            }`}
          >
            <label className="fr-label" htmlFor="usertypes-editor">
              Utilisateurs cible{" "}
              <span className="fr-hint-text">
                Par exemple : Particuliers, Entreprises.
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
                label="Image"
                placeholderURL="data:image/png;base64,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"
                hintText="Elle s'affiche sur la fiche produit. Généralemment il s'agit d'une capture d'écran de la page d'accueil."
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
              errors?.startup?.description ? "fr-input-group--error" : ""
            }`}
          >
            <label className="fr-label">
              Description
              <span className="fr-hint-text">
                {
                  startupInfoUpdateSchema.shape.startup.shape.description
                    .description
                }
              </span>
            </label>
            <ClientOnly>
              <MdEditor
                defaultValue={props.startup?.description || DEFAULT_CONTENT}
                style={{
                  height: "600px",
                  marginTop: "0.5rem",
                }}
                plugins={[
                  "header2",
                  "font-bold",
                  "font-italic",
                  "font-underline",
                  "font-strikethrough",
                  "list-unordered",
                  "list-ordered",
                  "block-quote",
                  "block-wrap",
                  "block-code-inline",
                  "block-code-block",
                  "table",
                  "image",
                  "link",
                  "clear",
                  "logger",
                  "mode-toggle",
                  "full-screen",
                  "tab-insert",
                ]}
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
              <p id="text-input-error-desc-error" className="fr-error-text">
                {errors?.startup?.description.message}
              </p>
            )}
          </div>
          <hr />
          <Select
            label={
              startupInfoUpdateSchema.shape.startup.shape.incubator_id
                .description
            }
            nativeSelectProps={register("startup.incubator_id")}
            hint="Structure dans laquelle est portée votre produit"
            state={errors?.startup?.incubator_id ? "error" : "default"}
            stateRelatedMessage={errors?.startup?.incubator_id?.message}
          >
            <option value="" disabled hidden>
              Séléctionnez un incubateur
            </option>
            {props.incubatorOptions.map((incubator) => (
              <option value={incubator.value} key={incubator.value}>
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
              const newSponsorIds = newSponsors.map((s) => s.ghid);
              // if a new sponsor was created, but it is then removed by the user
              // we new to remove it from newSponsor
              const idsToDelete = _.difference(
                newSponsorIds,
                selectedSponsorIds,
              );
              const updatedNewSponsors = newSponsors.filter(
                (newSponsor) => !idsToDelete.includes(newSponsor.ghid),
              );
              const updatedNewSponsorIds = updatedNewSponsors.map(
                (s) => s.ghid,
              );
              // change startupSponsor with ids that are not newSponsorsIds
              setValue(
                "startupSponsors",
                selectedSponsorIds.filter(
                  (id) => !updatedNewSponsorIds.includes(id),
                ),
              );
              // change newSonsors
              setValue("newSponsors", updatedNewSponsors);
            }}
            setNewSponsors={(
              data: startupInfoUpdateSchemaType["newSponsors"],
            ) => {
              setValue("newSponsors", [...newSponsors, ...data], {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
          <h2>Vie du produit</h2>
          <div
            className={`fr-input-group ${
              errors.startupPhases ? "fr-input-group--error" : ""
            }`}
          >
            <label className="fr-label">
              Phases
              <span className="fr-hint-text">
                Historique des phases du produit (investigation,
                construction...)
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
                Historique des événements marquants de la startup. Par exemple :
                "Lancement du produit", "Comité"...
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

          <h2>Liens</h2>
          <BasicInput id="stats_url" />
          <BasicInput id="impact_url" />
          <BasicInput id="budget_url" />
          <BasicInput id="roadmap_url" />
          <BasicInput id="repository" />
          <BasicInput id="dashlord_url" />
          <BasicInput id="tech_audit_url" />
          <BasicInput id="ecodesign_url" />

          <Button
            className={fr.cx("fr-mt-3w")}
            disabled={isSaving}
            children={
              isSubmitting ? `Enregistrement en cours...` : `Enregistrer`
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
