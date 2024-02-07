import { userStatusOptions } from "@/config";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import {
    Control,
    useFieldArray,
    UseFormRegister,
    UseFormSetValue,
} from "react-hook-form";
import { addMonths } from "date-fns/addMonths";

import { StartupsPicker } from "./StartupsPicker";
import { MemberSchemaType } from "./BaseInfoUpdate";

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
            start: new Date().toISOString().substring(0, 10),
            end: addMonths(new Date(), 3).toISOString().substring(0, 10), // 6 months,
            status: "",
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
            {missionsFields.map((mission, index, all) => {
                const missionErrors = errors && errors[index];
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
                        <div
                            className={fr.cx(
                                "fr-grid-row",
                                "fr-grid-row--gutters"
                            )}
                        >
                            <div className={fr.cx("fr-col-3")}>
                                <Input
                                    label="Date de début"
                                    hintText="Début de ta mission"
                                    nativeInputProps={{
                                        style: { width: 200 },
                                        placeholder: "JJ/MM/YYYY",
                                        type: "date",
                                        ...register(`missions.${index}.start`),
                                    }}
                                    state={
                                        missionErrors && missionErrors.start
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={
                                        missionErrors &&
                                        missionErrors.start?.message
                                    }
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
                                    }}
                                    hintText={
                                        <div>
                                            En cas de doute, mettre{" "}
                                            <button
                                                className={fr.cx(
                                                    "fr-link",
                                                    "fr-text--xs"
                                                )}
                                                onClick={() => {
                                                    const endDate = addMonths(
                                                        new Date(mission.start),
                                                        3
                                                    );

                                                    setValue(
                                                        `missions.${index}.end`,
                                                        endDate
                                                            .toISOString()
                                                            .substring(0, 10),
                                                        {
                                                            shouldValidate:
                                                                true,
                                                            shouldDirty: true,
                                                        }
                                                    );
                                                }}
                                                role="button"
                                                type="button"
                                                title="Mettre la date de fin à +3 mois"
                                            >
                                                J+3 mois
                                            </button>
                                        </div>
                                    }
                                    state={
                                        missionErrors && missionErrors.end
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={
                                        missionErrors &&
                                        missionErrors.end?.message
                                    }
                                />
                            </div>
                        </div>
                        <div
                            className={fr.cx(
                                "fr-grid-row",
                                "fr-grid-row--gutters"
                            )}
                        >
                            <div className={fr.cx("fr-col-6")}>
                                <Input
                                    label="Employeur"
                                    nativeInputProps={{
                                        placeholder: "ex: Scopyleft",
                                        ...register(
                                            `missions.${index}.employer`
                                        ),
                                    }}
                                    state={
                                        missionErrors && missionErrors.employer
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={
                                        missionErrors &&
                                        missionErrors.employer?.message
                                    }
                                />
                            </div>
                            <div className={fr.cx("fr-col-6")}>
                                <Select
                                    label="Statut"
                                    state={
                                        missionErrors && missionErrors.status
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={
                                        missionErrors &&
                                        missionErrors.status?.message
                                    }
                                    nativeSelectProps={{
                                        ...register(`missions.${index}.status`),
                                    }}
                                >
                                    <option value="">Statut:</option>
                                    {userStatusOptions.map((option) => (
                                        <option
                                            key={option.key}
                                            selected={
                                                option.key === mission.status
                                            }
                                            value={option.key}
                                        >
                                            {option.name}
                                        </option>
                                    ))}
                                </Select>{" "}
                            </div>
                        </div>
                        <div
                            className={fr.cx(
                                "fr-grid-row",
                                "fr-grid-row--gutters"
                            )}
                        >
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
                                        console.log("startups", startups);
                                        setValue(
                                            `missions.${index}.startups`,
                                            startups.map(
                                                (startup) => startup.value
                                            ),
                                            {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                            }
                                        );
                                    }}
                                    state={
                                        missionErrors && missionErrors.startups
                                            ? "error"
                                            : "default"
                                    }
                                    stateMessageRelated={
                                        missionErrors &&
                                        missionErrors.startups?.message
                                    }
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
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
