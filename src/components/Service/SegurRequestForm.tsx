"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import * as Sentry from "@sentry/nextjs";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { Upload } from "@codegouvfr/react-dsfr/Upload";

import { parseParticipantsCsv } from "@/lib/parseParticipantsCsv";

import { submitSegurRequest } from "@/app/api/demandes/segur/actions";
import {
  segurRequestSchema,
  segurRequestSchemaType,
} from "@/models/actions/segurRequest";
import { AlertMessageType } from "@/models/common";
import {
  SEGUR_DEMANDE_CHOICES,
  SEGUR_DEMANDE_TYPE,
  SEGUR_JOURS,
  SEGUR_PERIODE_CHOICES,
} from "@/models/segur";

interface SegurRequestFormProps {
  defaultValues?: Partial<segurRequestSchemaType>;
}

export const SegurRequestForm = ({ defaultValues }: SegurRequestFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<segurRequestSchemaType>({
    resolver: zodResolver(segurRequestSchema),
    mode: "onChange",
    defaultValues: {
      nbParticipants: 1,
      datesReunion: [{ date: "" }],
      ...defaultValues,
    },
  });
  const {
    fields: membres,
    append,
    remove,
    replace: replaceMembres,
  } = useFieldArray({
    control,
    name: "autresMembres",
  });
  const {
    fields: datesReunion,
    append: appendDate,
    remove: removeDate,
  } = useFieldArray({
    control,
    name: "datesReunion",
  });
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [alertMessage, setAlertMessage] =
    React.useState<AlertMessageType | null>();

  const typeDemande = watch("typeDemande");
  const isSalleReunion = typeDemande === SEGUR_DEMANDE_TYPE.SALLE_REUNION;
  const isAcces = typeDemande === SEGUR_DEMANDE_TYPE.ACCES;

  // Le nombre de participants pilote la liste : saisir 12 fait apparaître les
  // 11 lignes à remplir, en redescendre retire les lignes de la fin. Le
  // demandeur compte pour 1 et n'a pas de ligne.
  const nbParticipants = watch("nbParticipants");
  React.useEffect(() => {
    const total = Number(nbParticipants);
    if (!Number.isFinite(total) || total < 1) return;
    const target = total - 1;
    if (membres.length < target) {
      append(
        Array.from({ length: target - membres.length }, () => ({
          prenomNom: "",
          email: "",
        })),
        { shouldFocus: false },
      );
    } else if (membres.length > target) {
      remove(
        Array.from({ length: membres.length - target }, (_, i) => target + i),
      );
    }
  }, [nbParticipants, membres.length, append, remove]);

  // Les deux boutons passent par le nombre : il reste la seule source de
  // vérité, l'effet ci-dessus se charge d'ajouter ou retirer la ligne.
  const addMembre = () =>
    setValue("nbParticipants", membres.length + 2, { shouldValidate: true });
  const removeMembre = (index: number) => {
    remove(index);
    setValue("nbParticipants", membres.length, { shouldValidate: true });
  };

  const [csvMessage, setCsvMessage] = React.useState<{
    state: "success" | "error";
    text: string;
  } | null>(null);

  const onCsvChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Le champ est remis à zéro pour qu'importer deux fois le même fichier
    // redéclenche bien un change.
    event.target.value = "";
    if (!file) return;

    try {
      const { participants, ignored } = parseParticipantsCsv(await file.text());
      if (participants.length === 0) {
        setCsvMessage({
          state: "error",
          text: "Aucun participant trouvé. Attendu : une colonne nom et une colonne email.",
        });
        return;
      }
      // replace() avant setValue() : l'effet de synchronisation voit alors des
      // longueurs cohérentes et ne rajoute ni ne retire de ligne.
      replaceMembres(participants);
      setValue("nbParticipants", participants.length + 1, {
        shouldValidate: true,
      });
      setCsvMessage({
        state: "success",
        text: `${participants.length} participant${participants.length > 1 ? "s" : ""} importé${participants.length > 1 ? "s" : ""}${ignored ? `, ${ignored} ligne${ignored > 1 ? "s" : ""} ignorée${ignored > 1 ? "s" : ""}` : ""}.`,
      });
    } catch {
      setCsvMessage({
        state: "error",
        text: "Fichier illisible. Vérifie qu'il s'agit bien d'un CSV.",
      });
    }
  };

  const onSubmit = async (data: segurRequestSchemaType) => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    setAlertMessage(null);
    try {
      const res = await submitSegurRequest(data);
      if (res?.success) {
        setAlertMessage({
          title: "Demande envoyée",
          message: isSalleReunion
            ? "Ta demande de salle de réunion à Ségur a bien été enregistrée. L'équipe va la traiter."
            : "Ta demande d'accès aux bureaux Ségur a bien été enregistrée. L'équipe va la traiter.",
          type: "success",
        });
        window.scrollTo({ top: 20, behavior: "smooth" });
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        setAlertMessage({
          title: "Une erreur est survenue",
          message:
            res?.message ||
            "La demande n'a pas pu être envoyée. Recharge la page et réessaie.",
          type: "warning",
        });
        window.scrollTo({ top: 20, behavior: "smooth" });
      }
    } catch (e) {
      Sentry.captureException(e);
      setAlertMessage({
        title: "Une erreur est survenue",
        message:
          "La demande n'a pas pu être envoyée. Recharge la page et réessaie.",
        type: "warning",
      });
      window.scrollTo({ top: 20, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {!!alertMessage && (
        <Alert
          className="fr-mb-8v"
          severity={alertMessage.type}
          closable={false}
          title={alertMessage.title}
          description={alertMessage.message}
        />
      )}
      <p className="fr-text--sm">
        👋 Les membres de la communauté beta.gouv.fr ont la possibilité de
        travailler ponctuellement dans l'open space situé à la DINUM - 20 avenue
        de Ségur, Paris, et d'y réserver une salle de réunion. Ces formulaires
        ne permettent pas d'obtenir un badge permanent.
      </p>
      <Alert
        className="fr-mb-4v"
        severity="info"
        small
        description="Toutes les informations demandées ci-dessous sont obligatoires pour assurer le bon traitement de ta demande."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <RadioButtons
          className={fr.cx("fr-mb-4w")}
          legend="Quelle est ta demande ?"
          state={errors.typeDemande ? "error" : undefined}
          stateRelatedMessage={errors.typeDemande?.message}
          options={SEGUR_DEMANDE_CHOICES.map((choice) => ({
            label: choice,
            nativeInputProps: {
              value: choice,
              ...register("typeDemande"),
            },
          }))}
        />

        {!!typeDemande && (
          <>
            <Input
              className={fr.cx("fr-mb-4w")}
              label="Prénom et Nom"
              state={errors.prenomNom ? "error" : undefined}
              stateRelatedMessage={errors.prenomNom?.message}
              nativeInputProps={{ ...register("prenomNom") }}
            />

            <Input
              className={fr.cx("fr-mb-4w")}
              label="Adresse mail professionnelle"
              hintText="@beta.gouv.fr ou @xxx.gouv.fr"
              state={errors.email ? "error" : undefined}
              stateRelatedMessage={errors.email?.message}
              nativeInputProps={{ type: "email", ...register("email") }}
            />

            <Input
              className={fr.cx("fr-mb-4w")}
              label="Nom de ta Startup"
              state={errors.startupName ? "error" : undefined}
              stateRelatedMessage={errors.startupName?.message}
              nativeInputProps={{ ...register("startupName") }}
            />
          </>
        )}

        {isAcces && (
          <>
            <Input
              className={fr.cx("fr-mb-4w")}
              label="Date souhaitée de venue"
              state={errors.dateDebut ? "error" : undefined}
              stateRelatedMessage={errors.dateDebut?.message}
              nativeInputProps={{ type: "date", ...register("dateDebut") }}
            />

            <Input
              className={fr.cx("fr-mb-4w")}
              label="Date de fin de la venue"
              state={errors.dateFin ? "error" : undefined}
              stateRelatedMessage={errors.dateFin?.message}
              nativeInputProps={{ type: "date", ...register("dateFin") }}
            />

            <Input
              className={fr.cx("fr-mb-4w")}
              label="Des choses à préciser ?"
              textArea
              state={errors.precisions ? "error" : undefined}
              stateRelatedMessage={errors.precisions?.message}
              nativeTextAreaProps={{ ...register("precisions") }}
            />

            <p className={fr.cx("fr-text--sm", "fr-mb-1w")}>
              Besoin d'une salle de réunion ? Choisis « Demande de salle de
              réunion à Ségur » en haut de ce formulaire.
            </p>

            <Checkbox
              className={fr.cx("fr-mb-4w")}
              legend="Si tu souhaites faire une demande récurrente, merci de préciser les jours concernés"
              options={SEGUR_JOURS.map((jour) => ({
                label: jour,
                nativeInputProps: {
                  value: jour,
                  ...register("joursRecurrents"),
                },
              }))}
            />

            <RadioButtons
              className={fr.cx("fr-mb-4w")}
              legend="Période souhaitée"
              state={errors.periodeRecurrente ? "error" : undefined}
              stateRelatedMessage={errors.periodeRecurrente?.message}
              options={SEGUR_PERIODE_CHOICES.map((choice) => ({
                label: choice,
                nativeInputProps: {
                  value: choice,
                  ...register("periodeRecurrente"),
                },
              }))}
            />

            <Checkbox
              className={fr.cx("fr-mb-6w")}
              options={[
                {
                  label:
                    "Je m'engage à venir les jours demandés sur la période souhaitée",
                  nativeInputProps: { ...register("engagement") },
                },
              ]}
            />
          </>
        )}

        {isSalleReunion && (
          <>
            <div className={fr.cx("fr-mb-4w")}>
              <p className={fr.cx("fr-text--md", "fr-mb-1w")}>
                <strong>Date(s) de la réunion</strong>
              </p>
              {datesReunion.map((dateField, index) => (
                <div
                  key={dateField.id}
                  className={fr.cx(
                    "fr-grid-row",
                    "fr-grid-row--gutters",
                    "fr-mb-2w",
                  )}
                  style={{ alignItems: "flex-end" }}
                >
                  <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
                    <Input
                      className={fr.cx("fr-mb-0")}
                      label={`Date ${index + 1}`}
                      state={
                        errors.datesReunion?.[index]?.date ? "error" : undefined
                      }
                      stateRelatedMessage={
                        errors.datesReunion?.[index]?.date?.message
                      }
                      nativeInputProps={{
                        type: "date",
                        ...register(`datesReunion.${index}.date`),
                      }}
                    />
                  </div>
                  {datesReunion.length > 1 && (
                    <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
                      <Button
                        priority="tertiary"
                        onClick={() => removeDate(index)}
                        nativeButtonProps={{ type: "button" }}
                      >
                        Retirer
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              <Button
                priority="secondary"
                onClick={() => appendDate({ date: "" })}
                nativeButtonProps={{ type: "button" }}
              >
                + Ajouter une date
              </Button>
            </div>

            <p className={fr.cx("fr-text--md", "fr-mb-1w")}>
              <strong>Créneau horaire</strong>
            </p>
            <p className={fr.cx("fr-hint-text", "fr-mb-1w")}>
              Appliqué à chaque date demandée.
            </p>
            <div
              className={fr.cx(
                "fr-grid-row",
                "fr-grid-row--gutters",
                "fr-mb-4w",
              )}
            >
              <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
                <Input
                  label="Heure de début"
                  state={errors.heureDebut ? "error" : undefined}
                  stateRelatedMessage={errors.heureDebut?.message}
                  nativeInputProps={{ type: "time", ...register("heureDebut") }}
                />
              </div>
              <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
                <Input
                  label="Heure de fin"
                  state={errors.heureFin ? "error" : undefined}
                  stateRelatedMessage={errors.heureFin?.message}
                  nativeInputProps={{ type: "time", ...register("heureFin") }}
                />
              </div>
            </div>

            <Input
              className={fr.cx("fr-mb-4w")}
              label="Matériel nécessaire"
              hintText="ex : écran, visioconférence, paperboard, prises..."
              textArea
              state={errors.materiel ? "error" : undefined}
              stateRelatedMessage={errors.materiel?.message}
              nativeTextAreaProps={{ ...register("materiel") }}
            />

            <Input
              className={fr.cx("fr-mb-4w")}
              label="Des choses à préciser ?"
              textArea
              state={errors.precisions ? "error" : undefined}
              stateRelatedMessage={errors.precisions?.message}
              nativeTextAreaProps={{ ...register("precisions") }}
            />
          </>
        )}

        {!!typeDemande && (
          <>
            <div className={fr.cx("fr-mb-4w")}>
              <p className={fr.cx("fr-text--md", "fr-mb-1w")}>
                <strong>
                  {isSalleReunion
                    ? "Autres personnes présentes à la réunion"
                    : "Autres membres de ton équipe"}
                </strong>{" "}
                (si vous venez à plusieurs)
              </p>
              <div
                className={fr.cx(
                  "fr-grid-row",
                  "fr-grid-row--gutters",
                  "fr-mb-2w",
                )}
              >
                <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
                  <Input
                    className={fr.cx("fr-mb-0")}
                    label="Nombre de personnes au total"
                    hintText="Toi inclus·e. Les lignes à remplir apparaissent en dessous."
                    state={errors.nbParticipants ? "error" : undefined}
                    stateRelatedMessage={errors.nbParticipants?.message}
                    nativeInputProps={{
                      type: "number",
                      min: 1,
                      step: 1,
                      // Un input number vidé renvoie "" : sans ça z.coerce en
                      // ferait un 0 et le min(1) crierait pendant la frappe.
                      ...register("nbParticipants", {
                        setValueAs: (value) =>
                          value === "" || value === null
                            ? undefined
                            : Number(value),
                      }),
                    }}
                  />
                </div>
                <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
                  <Upload
                    label="Importer un fichier CSV (facultatif)"
                    hint="Deux colonnes : nom et email. Les lignes seront remplies automatiquement."
                    state={csvMessage ? csvMessage.state : "default"}
                    stateRelatedMessage={csvMessage?.text}
                    nativeInputProps={{
                      accept: ".csv,text/csv",
                      onChange: onCsvChange,
                    }}
                  />
                </div>
              </div>
              {membres.map((membre, index) => (
                <div
                  key={membre.id}
                  className={fr.cx(
                    "fr-grid-row",
                    "fr-grid-row--gutters",
                    "fr-mb-2w",
                  )}
                  style={{ alignItems: "flex-end" }}
                >
                  <div className={fr.cx("fr-col-12", "fr-col-md-5")}>
                    <Input
                      className={fr.cx("fr-mb-0")}
                      label="Prénom et Nom"
                      state={
                        errors.autresMembres?.[index]?.prenomNom
                          ? "error"
                          : undefined
                      }
                      stateRelatedMessage={
                        errors.autresMembres?.[index]?.prenomNom?.message
                      }
                      nativeInputProps={{
                        ...register(`autresMembres.${index}.prenomNom`),
                      }}
                    />
                  </div>
                  <div className={fr.cx("fr-col-12", "fr-col-md-5")}>
                    <Input
                      className={fr.cx("fr-mb-0")}
                      label="Adresse mail"
                      state={
                        errors.autresMembres?.[index]?.email
                          ? "error"
                          : undefined
                      }
                      stateRelatedMessage={
                        errors.autresMembres?.[index]?.email?.message
                      }
                      nativeInputProps={{
                        type: "email",
                        ...register(`autresMembres.${index}.email`),
                      }}
                    />
                  </div>
                  <div className={fr.cx("fr-col-12", "fr-col-md-2")}>
                    <Button
                      priority="tertiary"
                      onClick={() => removeMembre(index)}
                      nativeButtonProps={{ type: "button" }}
                    >
                      Retirer
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                priority="secondary"
                onClick={addMembre}
                nativeButtonProps={{ type: "button" }}
              >
                + Ajouter une personne
              </Button>
            </div>

            <Alert
              className="fr-mb-4v"
              severity="warning"
              small
              description={
                isSalleReunion
                  ? "Important : la réservation se fait dans la limite des disponibilités. Une pièce d'identité est requise pour accéder au bâtiment (ou l'accès te sera refusé). Ta demande sera transmise au service concerné de la DINUM, et tu seras ajouté·e en copie de l'email."
                  : "Important : une pièce d'identité est requise pour accéder au bâtiment (ou l'accès te sera refusé). Ta demande sera transmise au service concerné de la DINUM, et tu seras ajouté·e en copie de l'email."
              }
            />

            <Button
              className={fr.cx("fr-mt-3w")}
              disabled={isSaving}
              nativeButtonProps={{ type: "submit", disabled: isSubmitting }}
            >
              {isSubmitting ? "Envoi en cours..." : "Je valide ma demande"}
            </Button>
          </>
        )}
      </form>
    </>
  );
};
