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
} from "react-hook-form";

import SESelect from "../SESelect";
import { userStatusOptions } from "@/frontConfig";
import { HasMissions } from "@/models/member";
import { Status, missionSchema } from "@/models/mission";

export const Mission = ({
    index,
    register,
    control,
    setValue,
    mission,
    missionsRemove,
    onMissionAutoEndClick,
    startupOptions,
    errors,
    isMulti,
    labels = {},
}: {
    index: number;
    register: any;
    control: any;
    setValue: any;
    mission: any;
    missionsRemove: any;
    onMissionAutoEndClick: any;
    startupOptions: any;
    errors: any;
    isMulti: boolean;
    labels?: {
        employer?: string;
        start?: string;
        end?: string;
    };
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
        name: `missions.${index}.start`,
    });
    // Convertir la valeur de date en format de chaîne requis par l'input de type date
    const startDateString = startDateValue
        ? new Date(startDateValue).toISOString().substring(0, 10)
        : "";

    const endDateValue = useWatch({
        control,
        name: `missions.${index}.end`,
    });
    const endDateString = endDateValue
        ? new Date(endDateValue).toISOString().substring(0, 10)
        : "";

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
                        style={{ display: "inline-block" }}
                        className={fr.cx("fr-mr-3w")}
                    >
                        <Input
                            label={
                                labels.start ||
                                missionSchema.shape.start.description
                            }
                            hintText="Date de début"
                            nativeInputProps={{
                                style: { width: 200 },
                                placeholder: "JJ/MM/YYYY",
                                type: "date",
                                ...register(`missions.${index}.start`),
                                value: startDateString,
                            }}
                            {...defaultState("start")}
                        />
                    </div>
                    <div style={{ display: "inline-block" }}>
                        <Input
                            label={
                                labels.end ||
                                missionSchema.shape.end.description
                            }
                            nativeInputProps={{
                                style: { width: 200 },
                                placeholder: "JJ/MM/YYYY",
                                type: "date",
                                ...register(`missions.${index}.end`),
                                value: endDateString,
                            }}
                            hintText={
                                <div>
                                    En cas de doute, mettre{" "}
                                    <button
                                        className={fr.cx(
                                            "fr-link",
                                            "fr-text--xs"
                                        )}
                                        onClick={() =>
                                            onMissionAutoEndClick(index)
                                        }
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
                            missionSchema.shape.employer.description
                        }
                        nativeInputProps={{
                            placeholder: "ex: Scopyleft",
                            ...register(`missions.${index}.employer`),
                        }}
                        {...defaultState("employer")}
                    />
                </div>
                <div className={fr.cx("fr-col-6")}>
                    <Select
                        label={missionSchema.shape.status.description}
                        nativeSelectProps={{
                            ...register(`missions.${index}.status`),
                            defaultValue: mission.status,
                        }}
                        {...defaultState("status")}
                    >
                        <option value="" disabled hidden>
                            Selectionnez une option
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
                        defaultValue={startupOptions.filter(
                            (s) =>
                                mission.startups &&
                                mission.startups.includes(s.value)
                        )}
                        onChange={(startups) => {
                            setValue(
                                `missions.${index}.startups`,
                                startups.map((startup) => startup.value),
                                {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                }
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
    startupOptions,
}: {
    control: Control<HasMissions>;
    errors?: Record<string, any>;
    register: UseFormRegister<HasMissions>;
    setValue: UseFormSetValue<HasMissions>;
    startupOptions: any;
}) => {
    const {
        fields: missionsFields,
        append: missionsAppend,
        remove: missionsRemove,
        update: missionsUpdate,
    } = useFieldArray({
        rules: { minLength: 1 },
        control,
        name: "missions",
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

    const onMissionAutoEndClick = (missionIndex) => {
        const endDate = addMonths(
            new Date(missionsFields[missionIndex]["start"]),
            3
        );

        setValue(`missions.${missionIndex}.end`, endDate, {
            shouldValidate: true,
            shouldDirty: true,
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
                    mission={mission}
                    control={control}
                    register={register}
                    setValue={setValue}
                    missionsRemove={() => missionsRemove(index)}
                    onMissionAutoEndClick={() => onMissionAutoEndClick(index)}
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
