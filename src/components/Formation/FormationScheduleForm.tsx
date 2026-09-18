"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { scheduleFormationSessions } from "@/app/api/formations/actions";
import {
  formationScheduleSchema,
  formationScheduleSchemaType,
} from "@/models/actions/formationProposal";
import { AlertMessageType } from "@/models/common";
import { FormationDateTimeFields } from "@/components/Formation/FormationDateTimeFields";
import {
  FORMATION_DUREES,
  FORMATION_FREQUENCE,
} from "@/models/formationsGrist";

/**
 * Programmation d'une nouvelle date.
 *
 * Les valeurs par défaut reprennent la session en cours, puisque le cas courant
 * est de rejouer la même formation à une autre date.
 *
 * Le formulaire ne propose plus de série — retour de relecture : le rythme, son
 * intervalle et son jour fixe alourdissaient l'écran pour un cas rare. Le
 * schéma et l'action savent toujours programmer une série ; ils reçoivent ici
 * les valeurs d'une date unique, que react-hook-form envoie depuis les valeurs
 * par défaut sans qu'un champ les porte.
 */
export const FormationScheduleForm = ({
  formationId,
  defaultDuree,
  defaultCapacite,
  defaultLienVisioAdmin,
  onSuccess,
}: {
  formationId: string;
  defaultDuree?: string;
  defaultCapacite?: number;
  defaultLienVisioAdmin?: string;
  /** Appelé une fois la date créée : c'est au parent de fermer et d'annoncer. */
  onSuccess?: () => void;
}) => {
  const [alertMessage, setAlertMessage] =
    React.useState<AlertMessageType | null>(null);
  const router = useRouter();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<formationScheduleSchemaType>({
    resolver: zodResolver(formationScheduleSchema),
    mode: "onChange",
    defaultValues: {
      formationId,
      duree: defaultDuree,
      capacite: defaultCapacite,
      lienVisioAdmin: defaultLienVisioAdmin ?? "",
      frequence: FORMATION_FREQUENCE.AUCUNE,
      intervalle: 1,
      jour: "",
      occurrences: 1,
    },
  });

  const onSubmit = async (data: formationScheduleSchemaType) => {
    const res = await scheduleFormationSessions(data);
    if (res.success) {
      // Le succès se dit hors du formulaire : rester ouvert avec un
      // « Annuler » à côté laissait croire qu'on pouvait annuler la date
      // qu'on venait de créer.
      router.refresh();
      onSuccess?.();
    } else {
      setAlertMessage({
        title: "Une erreur est survenue",
        message: res.message || "",
        type: "warning",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {!!alertMessage && (
        <Alert
          className={fr.cx("fr-mb-2w")}
          severity={alertMessage.type}
          title={alertMessage.title}
          description={alertMessage.message}
          small
        />
      )}

      <input type="hidden" {...register("formationId")} />

      <div
        className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-3w")}
        style={{ alignItems: "flex-start" }}
      >
        <Controller
          control={control}
          name="dateDebut"
          render={({ field }) => (
            <FormationDateTimeFields
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.dateDebut?.message}
            />
          )}
        />
        <div className={fr.cx("fr-col-12", "fr-col-md-5")}>
          <Select
            label="Durée"
            nativeSelectProps={register("duree")}
            options={FORMATION_DUREES.map((d) => ({
              value: d.label,
              label: d.label,
            }))}
            state={errors.duree ? "error" : "default"}
            stateRelatedMessage={errors.duree?.message}
          />
        </div>
      </div>

      <Input
        label="Limite de participants (facultatif)"
        hintText="Sans limite, les inscriptions restent ouvertes."
        nativeInputProps={{
          type: "number",
          min: 1,
          ...register("capacite", {
            setValueAs: (value) => (value === "" ? undefined : Number(value)),
          }),
        }}
        state={errors.capacite ? "error" : "default"}
        stateRelatedMessage={errors.capacite?.message}
      />

      <Input
        label="Lien de visioconférence (facultatif)"
        nativeInputProps={register("lienVisioAdmin")}
        state={errors.lienVisioAdmin ? "error" : "default"}
        stateRelatedMessage={errors.lienVisioAdmin?.message}
      />

      <Button nativeButtonProps={{ type: "submit", disabled: isSubmitting }}>
        {isSubmitting ? "Programmation en cours..." : "Programmer"}
      </Button>
    </form>
  );
};
