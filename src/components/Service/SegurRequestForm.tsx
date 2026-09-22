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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { submitSegurRequest } from "@/app/api/demandes/segur/actions";
import { routes } from "@/lib/routes";
import {
  segurRequestSchema,
  segurRequestSchemaType,
} from "@/models/actions/segurRequest";
import { AlertMessageType } from "@/models/common";
import {
  derniereDateFin,
  premiereDateVenue,
  SEGUR_CONTACT_DELAI_COURT,
  SEGUR_DELAI_MINIMUM_HEURES,
  SEGUR_DUREE_MAXIMUM_MOIS,
  SEGUR_JOURS,
  SEGUR_PERIODE_CHOICES,
} from "@/models/segur";

interface SegurRequestFormProps {
  defaultValues?: Partial<segurRequestSchemaType>;
}

const ChampCourt = ({ children }: { children: React.ReactNode }) => (
  <div className={fr.cx("fr-grid-row")}>
    <div className={fr.cx("fr-col-12", "fr-col-md-6")}>{children}</div>
  </div>
);

export const SegurRequestForm = ({ defaultValues }: SegurRequestFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<segurRequestSchemaType>({
    resolver: zodResolver(segurRequestSchema),
    mode: "onChange",
    defaultValues: {
      ...defaultValues,
    },
  });
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [alertMessage, setAlertMessage] =
    React.useState<AlertMessageType | null>();

  // Calculée une fois au montage : recalculer à chaque frappe ferait bouger la
  // borne du champ sous les doigts du demandeur.
  const dateMinimum = React.useMemo(() => premiereDateVenue(), []);
  const dateDebut = watch("dateDebut");
  // La date de fin se borne à la date de début choisie : trois mois après elle,
  // et jamais avant elle.
  const dateFinMaximum = dateDebut ? derniereDateFin(dateDebut) : null;

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
        Les membres de la communauté beta.gouv.fr peuvent travailler
        ponctuellement dans l'open space de la DINUM (20 avenue de Ségur,
        Paris). Ce formulaire permet de faire une demande d'accès à ces bureaux.
        Il ne permet pas d'obtenir un badge permanent.
      </p>
      <Alert
        className="fr-mb-4v"
        severity="info"
        small
        description="Toutes les informations sont obligatoires."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <ChampCourt>
          <Input
            className={fr.cx("fr-mb-4w")}
            label="Prénom et Nom"
            state={errors.prenomNom ? "error" : undefined}
            stateRelatedMessage={errors.prenomNom?.message}
            nativeInputProps={{ ...register("prenomNom") }}
          />
        </ChampCourt>

        <ChampCourt>
          <Input
            className={fr.cx("fr-mb-4w")}
            label="Adresse mail professionnelle"
            hintText="@beta.gouv.fr ou @xxx.gouv.fr"
            state={errors.email ? "error" : undefined}
            stateRelatedMessage={errors.email?.message}
            nativeInputProps={{ type: "email", ...register("email") }}
          />
        </ChampCourt>

        <ChampCourt>
          <Input
            className={fr.cx("fr-mb-4w")}
            label="Nom de ta Startup"
            state={errors.startupName ? "error" : undefined}
            stateRelatedMessage={errors.startupName?.message}
            nativeInputProps={{ ...register("startupName") }}
          />
        </ChampCourt>

        <ChampCourt>
          <Input
            className={fr.cx("fr-mb-2w")}
            label="Date souhaitée de venue"
            hintText={`Au moins ${SEGUR_DELAI_MINIMUM_HEURES} h après le dépôt de la demande.`}
            state={errors.dateDebut ? "error" : undefined}
            stateRelatedMessage={errors.dateDebut?.message}
            nativeInputProps={{
              type: "date",
              min: dateMinimum,
              ...register("dateDebut"),
            }}
          />
        </ChampCourt>

        <p className={fr.cx("fr-text--sm", "fr-mb-4w")}>
          Besoin de venir dans moins de {SEGUR_DELAI_MINIMUM_HEURES} h ? Ce
          formulaire ne permet pas de la traiter à temps : écris directement à{" "}
          <Link
            className={fr.cx("fr-link")}
            href={routes.communityMember({
              username: SEGUR_CONTACT_DELAI_COURT.username,
            })}
          >
            {SEGUR_CONTACT_DELAI_COURT.prenom}
          </Link>
          .
        </p>

        <ChampCourt>
          <Input
            className={fr.cx("fr-mb-4w")}
            label="Date de fin de la venue"
            hintText={`Au plus ${SEGUR_DUREE_MAXIMUM_MOIS} mois après la date de venue.`}
            state={errors.dateFin ? "error" : undefined}
            stateRelatedMessage={errors.dateFin?.message}
            nativeInputProps={{
              type: "date",
              min: dateDebut || dateMinimum,
              ...(dateFinMaximum ? { max: dateFinMaximum } : {}),
              ...register("dateFin"),
            }}
          />
        </ChampCourt>

        <Input
          className={fr.cx("fr-mb-4w")}
          label="Des choses à préciser ?"
          textArea
          state={errors.precisions ? "error" : undefined}
          stateRelatedMessage={errors.precisions?.message}
          nativeTextAreaProps={{ ...register("precisions") }}
        />

        <h2 className={fr.cx("fr-h4", "fr-mt-4w")}>Demande récurrente</h2>
        <p className={fr.cx("fr-text--sm", "fr-mb-2w")}>
          À remplir seulement si tu viens plusieurs fois sur la période.
        </p>

        <Checkbox
          className={fr.cx("fr-mb-4w")}
          legend="Jours concernés"
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
