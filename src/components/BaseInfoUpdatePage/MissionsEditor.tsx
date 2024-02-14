import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import {
    Control,
    useFieldArray,
    useWatch,
    UseFormRegister,
    UseFormSetValue,
} from "react-hook-form";
import { addMonths } from "date-fns/addMonths";

import { StartupsPicker } from "./StartupsPicker";
import { MemberSchemaType } from "./BaseInfoUpdate";
import { userStatusOptions } from "@/frontConfig";
import { Status } from "@/models/mission";

const Mission = ({
    index,
    register,
    control,
    setValue,
    mission,
    missionsRemove,
    onMissionAutoEndClick,
    startupOptions,
    errors,
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
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-3")}>
                    <Input
                        label="Date de début"
                        hintText="Début de ta mission"
                        nativeInputProps={{
                            style: { width: 200 },
                            placeholder: "JJ/MM/YYYY",
                            type: "date",
                            ...register(`missions.${index}.start`),
                            value: startDateString,
                        }}
                        {...defaultState("start")}
                    />
                </div>{" "}
                <div className={fr.cx("fr-col-4")}>
                    <Input
                        label="Date de fin"
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
                                    className={fr.cx("fr-link", "fr-text--xs")}
                                    onClick={() => onMissionAutoEndClick(index)}
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

            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-6")}>
                    <Input
                        label="Employeur"
                        nativeInputProps={{
                            placeholder: "ex: Scopyleft",
                            ...register(`missions.${index}.employer`),
                        }}
                        {...defaultState("employer")}
                    />
                </div>
                <div className={fr.cx("fr-col-6")}>
                    <Select
                        label="Statut"
                        nativeSelectProps={{
                            ...register(`missions.${index}.status`),
                        }}
                        {...defaultState("status")}
                    >
                        <option value="">Statut:</option>
                        {userStatusOptions.map((option) => (
                            <option
                                key={option.key}
                                selected={option.key === mission.status}
                                value={option.key}
                            >
                                {option.name}
                            </option>
                        ))}
                    </Select>{" "}
                </div>
            </div>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-12")}>
                    <StartupsPicker
                        name="startups"
                        control={control}
                        startups={startupOptions}
                        label="Produits concernés par la mission :"
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
                        {...defaultState("startups")}
                    />
                </div>
            </div>
        </div>
    );
    // La logique de rendu pour chaque mission va ici...
};

export const MissionsEditor = ({
    control,
    errors,
    register,
    setValue,
    startupOptions,
}: {
    control: Control<MemberSchemaType>;
    errors?: Record<string, any>;
    register: UseFormRegister<MemberSchemaType>;
    setValue: UseFormSetValue<MemberSchemaType>;
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
            new Date(missionsFields[missionIndex].start),
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
