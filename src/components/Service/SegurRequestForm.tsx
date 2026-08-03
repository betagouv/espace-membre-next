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

import { submitSegurRequest } from "@/app/api/demandes/segur/actions";
import {
  segurRequestSchema,
  segurRequestSchemaType,
} from "@/models/actions/segurRequest";
import { AlertMessageType } from "@/models/common";
import {
  SEGUR_JOURS,
  SEGUR_PERIODE_CHOICES,
  SEGUR_SALLE_REUNION_CHOICES,
} from "@/models/segur";

interface SegurRequestFormProps {
  defaultValues?: Partial<segurRequestSchemaType>;
}

export const SegurRequestForm = ({ defaultValues }: SegurRequestFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<segurRequestSchemaType>({
    resolver: zodResolver(segurRequestSchema),
    mode: "onChange",
    defaultValues,
  });
  const {
    fields: membres,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "autresMembres",
  });
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [alertMessage, setAlertMessage] =
    React.useState<AlertMessageType | null>();

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
          message:
            "Ta demande d'accès aux bureaux Ségur a bien été enregistrée. L'équipe va la traiter.",
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
        de Ségur, Paris. Ce formulaire te permet de faire une demande d'accès à
        ces bureaux. Il ne permet pas d'obtenir un badge permanent.
      </p>
      <Alert
        className="fr-mb-4v"
        severity="info"
        small
        description="Toutes les informations demandées ci-dessous sont obligatoires pour assurer le bon traitement de ta demande."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
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

        <div className={fr.cx("fr-mb-4w")}>
          <p className={fr.cx("fr-text--md", "fr-mb-1w")}>
            <strong>Autres membres de ton équipe</strong> (si vous venez à
            plusieurs)
          </p>
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
                  label="Adresse mail"
                  state={
                    errors.autresMembres?.[index]?.email ? "error" : undefined
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
              <div className={fr.cx("fr-col-12", "fr-col-md-2", "fr-mb-2w")}>
                <Button
                  priority="tertiary"
                  onClick={() => remove(index)}
                  nativeButtonProps={{ type: "button" }}
                >
                  Retirer
                </Button>
              </div>
            </div>
          ))}
          <Button
            priority="secondary"
            onClick={() => append({ prenomNom: "", email: "" })}
            nativeButtonProps={{ type: "button" }}
          >
            + Ajouter une personne
          </Button>
        </div>

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

        <RadioButtons
          className={fr.cx("fr-mb-4w")}
          legend="Souhaites-tu faire une demande de salle de réunion ? (dans la limite des disponibilités)"
          state={errors.salleReunion ? "error" : undefined}
          stateRelatedMessage={errors.salleReunion?.message}
          options={SEGUR_SALLE_REUNION_CHOICES.map((choice) => ({
            label: choice,
            nativeInputProps: {
              value: choice,
              ...register("salleReunion"),
            },
          }))}
        />

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

        <Alert
          className="fr-mb-4v"
          severity="warning"
          small
          description="Important : une pièce d'identité est requise pour accéder au bâtiment (ou l'accès te sera refusé). Ta demande sera transmise au service concerné de la DINUM, et tu seras ajouté·e en copie de l'email."
        />

        <Button
          className={fr.cx("fr-mt-3w")}
          disabled={isSaving}
          nativeButtonProps={{ type: "submit", disabled: isSubmitting }}
        >
          {isSubmitting ? "Envoi en cours..." : "Je valide ma demande"}
        </Button>
      </form>
    </>
  );
};
