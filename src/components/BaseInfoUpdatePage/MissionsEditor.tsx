import { userStatusOptions } from "@/config";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { useFieldArray } from "react-hook-form";
import { StartupsPicker } from "./StartupsPicker";

import { employers } from "./employers";

const TRIMESTER_DURATION = 1000 * 60 * 60 * 24 * 30 * 3;

export const MissionsEditor = ({
    control,
    errors,
    register,
    setValue,
    startupOptions,
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
            end: new Date(new Date().getTime() + TRIMESTER_DURATION)
                .toISOString()
                .substring(0, 10), // 6 months,
            status: null,
            employer: null,
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
                            <button
                                className={fr.cx("fr-icon-delete-bin-line")}
                                style={{ cursor: "pointer", float: "right" }}
                                onClick={() => missionsRemove(index)}
                                title="Supprimer la mission 1"
                            />
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
                                                    const endDate = new Date(
                                                        new Date().getTime() +
                                                            TRIMESTER_DURATION
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
                                <Select
                                    label="Employeur"
                                    state={
                                        missionErrors && missionErrors.employer
                                            ? "error"
                                            : "default"
                                    }
                                    stateRelatedMessage={
                                        missionErrors &&
                                        missionErrors.employer?.message
                                    }
                                    nativeSelectProps={{
                                        ...register(
                                            `missions.${index}.employer`
                                        ),
                                    }}
                                >
                                    <option value="">Employeur:</option>
                                    {employers.map((employer) => (
                                        <option
                                            key={employer}
                                            selected={
                                                employer === mission.employer
                                            }
                                            value={employer}
                                        >
                                            {employer}
                                        </option>
                                    ))}
                                </Select>
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
                                    defaultValue={startupOptions.filter((s) =>
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
