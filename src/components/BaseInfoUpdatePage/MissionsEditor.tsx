import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { addMonths } from "date-fns/addMonths";
import {
  Control,
  useFieldArray,
  useWatch,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
  FieldErrors,
} from "react-hook-form";

import SESelect from "../SESelect";
import { userStatusOptions } from "@/frontConfig";
import { HasMissions } from "@/models/member";
import { Option } from "@/models/misc";
import {
  Status,
  missionSchema,
  missionSchemaShape,
  missionSchemaType,
} from "@/models/mission";

export const Mission = ({
  index,
  register,
  control,
  setValue,
  trigger,
  mission,
  missionsRemove,
  startupOptions,
  errors,
  isMulti,
  labels = {},
  missionArrayKey = "missions",
}: {
  index: number;
  register: UseFormRegister<HasMissions>;
  control: Control<HasMissions>;
  setValue: UseFormSetValue<HasMissions>;
  trigger: UseFormTrigger<HasMissions>;
  mission?: missionSchemaType;
  missionsRemove: any;
  startupOptions: Option[];
  errors: any; //FieldErrors<HasMissions>;
  isMulti: boolean;
  labels?: {
    employer?: string;
    status?: string;
    start?: string;
    end?: string;
  };
  missionArrayKey?: string;
}) => {
  const missionErrors = errors;
  const defaultState = (field) => ({
    state:
      missionErrors && missionErrors[field]
        ? ("error" as const)
        : ("default" as const),
    stateRelatedMessage: missionErrors && missionErrors[field]?.message,
  });
  const startDateValue = useWatch({
    control,
    name: `${missionArrayKey}.${index}.start`,
  });
  // Convertir la valeur de date en format de chaîne requis par l'input de type date
  const startDateString = startDateValue
    ? new Date(startDateValue).toISOString().substring(0, 10)
    : "";

  const endDateValue = useWatch({
    control,
    name: `${missionArrayKey}.${index}.end`,
  });

  const endDateString = endDateValue
    ? new Date(endDateValue).toISOString().substring(0, 10)
    : "";

  const onMissionAutoEndClick = () => {
    const startDate = new Date();
    const endDate = addMonths(startDate, 3);

    setValue(`${missionArrayKey}.${index}.end`, endDate, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div key={index} className={fr.cx("fr-mb-6w")}>
      {!!isMulti && (
        <div className={fr.cx("fr-text--heavy")}>
          Mission {index + 1}
          {index > 0 && (
            <button
              className={fr.cx("fr-icon-delete-bin-line")}
              style={{
                cursor: "pointer",
                float: "right",
              }}
              onClick={() => missionsRemove(index)}
              title={`Supprimer la mission ${index + 1}`}
            />
          )}
          <hr className={fr.cx("fr-mt-1w")} />
        </div>
      )}
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12")}>
          <div
            style={{
              display: "inline-block",
              verticalAlign: "top",
            }}
            className={fr.cx("fr-mr-3w")}
          >
            <Input
              label={
                labels.start ||
                missionSchemaShape.start.description + " (obligatoire)"
              }
              hintText="Date de début"
              nativeInputProps={{
                style: { width: 200 },
                placeholder: "JJ/MM/YYYY",
                type: "date",
                ...register(`${missionArrayKey}.${index}.start`),
                value: startDateString,
              }}
              {...defaultState("start")}
            />
          </div>
          <div
            style={{
              display: "inline-block",
              verticalAlign: "top",
            }}
          >
            <Input
              label={
                labels.end ||
                missionSchemaShape.end.description + " (obligatoire)"
              }
              nativeInputProps={{
                style: { width: 200 },
                placeholder: "JJ/MM/YYYY",
                type: "date",
                ...register(`${missionArrayKey}.${index}.end`),
                value: endDateString,
              }}
              hintText={
                <div>
                  En cas de doute, mettre{" "}
                  <button
                    className={fr.cx("fr-link", "fr-text--xs")}
                    onClick={onMissionAutoEndClick}
                    role="button"
                    type="button"
                    title="Mettre la date de fin à +3 mois"
                  >
                    J+3 mois
                  </button>
                </div>
              }
              {...defaultState("end")}
            />
          </div>
        </div>
      </div>

      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-6")}>
          <Input
            label={
              labels.employer ||
              missionSchemaShape.employer.description + " (obligatoire)"
            }
            nativeInputProps={{
              placeholder: "ex: Scopyleft",
              ...register(`${missionArrayKey}.${index}.employer`),
            }}
            {...defaultState("employer")}
          />
        </div>
        <div className={fr.cx("fr-col-6")}>
          <Select
            label={
              labels.status ||
              missionSchemaShape.status.description + " (obligatoire)"
            }
            nativeSelectProps={{
              ...register(`${missionArrayKey}.${index}.status`),
              defaultValue: mission?.status ?? "",
            }}
            {...defaultState("status")}
          >
            <option disabled value="" hidden>
              Sélectionner une option
            </option>
            {userStatusOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.name}
              </option>
            ))}
          </Select>{" "}
        </div>
      </div>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12")}>
          <SESelect
            defaultValue={startupOptions.filter((s) =>
              mission
                ? mission.startups && mission.startups.includes(s.value)
                : undefined,
            )}
            onChange={(startups: Option[]) => {
              setValue(
                `${missionArrayKey}.${index}.startups`,
                startups.map((startup) => startup.value),
                {
                  shouldValidate: true,
                  shouldDirty: true,
                },
              );
            }}
            isMulti={true}
            placeholder={`Sélectionne un ou plusieurs produits`}
            startups={startupOptions}
            label="Produits concernés par la mission :"
            {...defaultState("startups")}
          />
        </div>
      </div>
    </div>
  );
};

export const MissionsEditor = ({
  control,
  errors,
  register,
  setValue,
  trigger,
  startupOptions,
  missionArrayKey = "missions",
}: {
  control: Control<HasMissions>;
  errors?: Record<string, any>;
  register: UseFormRegister<HasMissions>;
  setValue: UseFormSetValue<HasMissions>;
  trigger: UseFormTrigger<HasMissions>;
  startupOptions: Option[];
  missionArrayKey?: string;
}) => {
  const {
    fields: missionsFields,
    append: missionsAppend,
    remove: missionsRemove,
    update: missionsUpdate,
  } = useFieldArray({
    rules: { minLength: 1 },
    control,
    name: missionArrayKey,
  });

  const addMissionClick = (e) => {
    missionsAppend({
      start: new Date(),
      end: addMonths(new Date(), 3),
      status: Status.independent,
      employer: "",
      startups: [],
    });
  };

  return (
    <div className={fr.cx("fr-mb-3w")}>
      {errors && errors.message && (
        <div className={fr.cx("fr-error-text", "fr-mb-3w")}>
          {errors.message}
        </div>
      )}
      {missionsFields.map((mission, index, all) => (
        <Mission
          isMulti={true}
          key={mission.id}
          index={index}
          trigger={trigger}
          mission={mission as unknown as missionSchemaType}
          control={control}
          register={register}
          setValue={setValue}
          missionArrayKey={missionArrayKey}
          missionsRemove={() => missionsRemove(index)}
          startupOptions={startupOptions}
          errors={errors ? errors[index] : undefined}
        />
      ))}
      <Button
        iconId="fr-icon-add-circle-line"
        priority="secondary"
        size="small"
        type="button"
        onClick={addMissionClick}
      >
        Ajouter une mission
      </Button>
    </div>
  );
};
