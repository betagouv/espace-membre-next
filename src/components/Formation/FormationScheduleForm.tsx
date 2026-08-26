"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { scheduleFormationSessions } from "@/app/api/formations/actions";
import {
  formationScheduleSchema,
  formationScheduleSchemaType,
} from "@/models/actions/formationProposal";
import { AlertMessageType } from "@/models/common";
import {
  FORMATION_DUREES,
  FORMATION_FREQUENCE,
  FORMATION_FREQUENCE_CHOICES,
  FORMATION_JOURS,
  MAX_FORMATION_INTERVALLE,
} from "@/models/formationsGrist";

/**
 * Programmation de nouvelles dates : une seule, ou une série.
 *
 * Les valeurs par défaut reprennent la session en cours, puisque le cas courant
 * est de rejouer la même formation à une autre date.
 */
export const FormationScheduleForm = ({
  formationId,
  defaultDuree,
  defaultCapacite,
  defaultLienVisioAdmin,
}: {
  formationId: string;
  defaultDuree?: string;
  defaultCapacite?: number;
  defaultLienVisioAdmin?: string;
}) => {
  const [alertMessage, setAlertMessage] =
    React.useState<AlertMessageType | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
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

  // L'intervalle, le jour et le nombre de dates n'ont de sens que si la
  // formation se répète.
  const frequence = watch("frequence");
  const repeats = frequence !== FORMATION_FREQUENCE.AUCUNE;

  const onSubmit = async (data: formationScheduleSchemaType) => {
    const res = await scheduleFormationSessions(data);
    if (res.success) {
      const created = res.data?.created ?? 1;
      setAlertMessage({
        title: created > 1 ? `${created} dates programmées` : "Date programmée",
        message:
          created > 1
            ? "Chaque date a ses propres inscriptions."
            : "Elle est ouverte aux inscriptions.",
        type: "success",
      });
      router.refresh();
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

      <Input
        label="Date et heure"
        nativeInputProps={{ type: "datetime-local", ...register("dateDebut") }}
        state={errors.dateDebut ? "error" : "default"}
        stateRelatedMessage={errors.dateDebut?.message}
      />

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

      {/*
        Le nombre et l'unité forment une seule phrase : « toutes les 2
        semaines ». Deux composants côte à côte porteraient chacun leur label et
        se décaleraient l'un par rapport à l'autre, d'où le balisage à la main.
      */}
      <div className={fr.cx("fr-input-group")}>
        <label className={fr.cx("fr-label")} htmlFor="formation-frequence">
          {repeats ? "Toutes les" : "Rythme"}
        </label>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            marginTop: "0.5rem",
          }}
        >
          {repeats && (
            <input
              className={fr.cx("fr-input")}
              type="number"
              min={1}
              max={MAX_FORMATION_INTERVALLE}
              aria-label="Nombre de semaines ou de mois entre deux dates"
              style={{ width: "5rem", flex: "0 0 auto" }}
              {...register("intervalle", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number(value),
              })}
            />
          )}
          <select
            className={fr.cx("fr-select")}
            id="formation-frequence"
            style={{ maxWidth: "16rem" }}
            {...register("frequence")}
          >
            {FORMATION_FREQUENCE_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>
        {!!(errors.intervalle || errors.frequence) && (
          <p className={fr.cx("fr-error-text")}>
            {errors.intervalle?.message ?? errors.frequence?.message}
          </p>
        )}
      </div>

      {repeats && (
        <>
          <Select
            label="Toujours le"
            hint="Sans choix, la série garde le jour de la date ci-dessus."
            nativeSelectProps={register("jour")}
            options={[
              { value: "", label: "Le jour de la date choisie" },
              ...FORMATION_JOURS.map((j) => ({
                value: j.value,
                label: j.label,
              })),
            ]}
            state={errors.jour ? "error" : "default"}
            stateRelatedMessage={errors.jour?.message}
          />

          <Input
            label="Nombre de dates"
            hintText="La première comprise."
            nativeInputProps={{
              type: "number",
              min: 2,
              ...register("occurrences", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number(value),
              }),
            }}
            state={errors.occurrences ? "error" : "default"}
            stateRelatedMessage={errors.occurrences?.message}
          />
        </>
      )}

      <Input
        label="Limite de participants"
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
