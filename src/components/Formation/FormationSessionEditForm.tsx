"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatInTimeZone } from "date-fns-tz";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { updateFormationSession } from "@/app/api/formations/actions";
import {
  formationSessionUpdateSchema,
  formationSessionUpdateSchemaType,
} from "@/models/actions/formationProposal";
import { AlertMessageType } from "@/models/common";
import { FORMATION_DUREES } from "@/models/formationsGrist";
import { FormationDateTimeFields } from "@/components/Formation/FormationDateTimeFields";

/**
 * Modification d'une date : horaire, durée, capacité, lien de visioconférence.
 *
 * Ces quatre champs appartiennent à la date, pas à la formation : les changer
 * ne touche pas aux autres dates de la série.
 */
export const FormationSessionEditForm = ({
  sessionId,
  start,
  dureeHeures,
  capacite,
  lienVisioAdmin,
  onDone,
}: {
  sessionId: string;
  start?: Date;
  dureeHeures?: number;
  capacite?: number;
  lienVisioAdmin?: string;
  onDone: () => void;
}) => {
  const [alertMessage, setAlertMessage] =
    React.useState<AlertMessageType | null>(null);
  const router = useRouter();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<formationSessionUpdateSchemaType>({
    resolver: zodResolver(formationSessionUpdateSchema),
    mode: "onChange",
    defaultValues: {
      sessionId,
      // Le champ attend une heure locale sans fuseau ; la date stockée est un
      // instant, qu'on ramène donc à l'heure de Paris.
      dateDebut: start
        ? formatInTimeZone(start, "Europe/Paris", "yyyy-MM-dd'T'HH:mm")
        : "",
      duree: FORMATION_DUREES.find((d) => d.hours === dureeHeures)?.label,
      capacite,
      lienVisioAdmin: lienVisioAdmin ?? "",
    },
  });

  const onSubmit = async (data: formationSessionUpdateSchemaType) => {
    const res = await updateFormationSession(data);
    if (res.success) {
      onDone();
      router.refresh();
      return;
    }
    setAlertMessage({
      title: "Une erreur est survenue",
      message: res.message || "",
      type: "warning",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={fr.cx("fr-mt-2w")}>
      {!!alertMessage && (
        <Alert
          className={fr.cx("fr-mb-2w")}
          severity={alertMessage.type}
          title={alertMessage.title}
          description={alertMessage.message}
          small
        />
      )}

      <input type="hidden" {...register("sessionId")} />

      <div
        className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-3w")}
        style={{ alignItems: "flex-end" }}
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
        hintText="Baisser la limite bascule les dernières inscriptions sur la liste d'attente. Vide, les inscriptions restent ouvertes."
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

      <ButtonsGroup
        inlineLayoutWhen="sm and up"
        buttonsSize="small"
        buttons={[
          {
            children: isSubmitting
              ? "Enregistrement..."
              : "Enregistrer cette date",
            type: "submit",
            disabled: isSubmitting,
          },
          {
            children: "Annuler",
            priority: "secondary",
            type: "button",
            onClick: onDone,
          },
        ]}
      />
    </form>
  );
};
