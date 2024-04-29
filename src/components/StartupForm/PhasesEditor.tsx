import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import Table from "@codegouvfr/react-dsfr/Table";
import {
    Control,
    useFieldArray,
    useWatch,
    UseFormRegister,
    UseFormSetValue,
} from "react-hook-form";
import { z } from "zod";

import {
    phaseSchema,
    PHASE_READABLE_NAME,
    PHASES_ORDERED_LIST,
} from "@/models/startup";

const phasesArraySchema = z.array(phaseSchema);

export type HasPhases<T = any> = T & {
    phases: z.infer<typeof phasesArraySchema>;
};

export function PhasesEditor({
    control,
    errors,
    register,
    setValue,
    getValues,
}: {
    control: Control<HasPhases>;
    errors?: Record<string, any>;
    register: UseFormRegister<HasPhases>;
    setValue: UseFormSetValue<HasPhases>;
    getValues: any;
}) {
    const {
        fields: phasesFields,
        append: phasesAppend,
        remove: phasesRemove,
        update: phasesUpdate,
    } = useFieldArray({
        rules: { minLength: 1 },
        control,
        name: "phases",
    });

    const addMissionClick = (e) => {
        phasesAppend({
            start: new Date(),
            name: "",
        });
    };

    const phases = useWatch({
        control,
        name: `phases`,
    });

    return (
        <div className={fr.cx("fr-mb-3w")}>
            {errors && errors.message && (
                <div className={fr.cx("fr-error-text", "fr-mb-3w")}>
                    {errors.message}
                </div>
            )}
            <Table
                style={{ marginBottom: "0.5rem" }}
                data={phasesFields.map((phase, index) => {
                    const startDateString = getValues(`phases.${index}.start`)
                        ? new Date(getValues(`phases.${index}.start`))
                              .toISOString()
                              .substring(0, 10)
                        : "";

                    return [
                        <Select
                            key={phase.id + "-name"}
                            label={undefined}
                            nativeSelectProps={register(`phases.${index}.name`)}
                        >
                            <option value="">{"Selectionnez une phase"}</option>
                            {Object.entries(PHASES_ORDERED_LIST).map(
                                ([id, label], index) => (
                                    <option key={index} value={label}>
                                        {PHASE_READABLE_NAME[label]}
                                    </option>
                                )
                            )}
                        </Select>,
                        <Input
                            label={null}
                            key={phase.id + "-start"}
                            nativeInputProps={{
                                type: "date",
                                ...register(`phases.${index}.start`),
                                value: startDateString,
                            }}
                        />,
                        (index > 0 && (
                            <button
                                className={fr.cx("fr-icon-delete-bin-line")}
                                style={{
                                    cursor: "pointer",
                                    float: "right",
                                }}
                                onClick={() => phasesRemove(index)}
                                title={`Supprimer la phase ${index + 1}`}
                            />
                        )) ||
                            null,
                    ];
                })}
                headers={["Phase", "Date de début", "Action"]}
            />
            <Button
                iconId="fr-icon-add-circle-line"
                priority="secondary"
                size="small"
                type="button"
                onClick={addMissionClick}
            >
                Ajouter une phase
            </Button>
        </div>
    );
}
