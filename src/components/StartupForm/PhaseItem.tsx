import React from "react";
import { Phase, StartupPhase } from "@/models/startup";
import SEPhaseSelect from "../SEPhaseSelect";
import DatepickerSelect from "../DatepickerSelect";
import Input from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";

interface PhaseSelectionCellProps {
    changePhase(index: number, phase: StartupPhase): void;
    index: number;
    name: string;
}

interface PhaseDatePickerCellProps {
    name: string;
    changePhaseDate(index: number, value: string);
    index: number;
    start: string;
}

export const PhaseSelectionCell = ({
    name,
    index,
    changePhase,
}: PhaseSelectionCellProps) => {
    return (
        <SEPhaseSelect
            onChange={(phase) => {
                changePhase(index, phase.value);
            }}
            defaultValue={name}
            isMulti={false}
            placeholder={"Selectionne la phase"}
        />
    );
};

export const PhaseDatePickerCell = ({
    start,
    changePhaseDate,
    index,
}: PhaseDatePickerCellProps) => {
    return (
        <Input
            label={undefined}
            nativeInputProps={{
                type: "date",
                name: "startDate",
                min: "2020-01-31",
                // hint: "En format YYYY-MM-DD, par exemple : 2020-01-31",
                required: true,
                value: start,
                defaultValue: start,
                // dateFormat: "dd/MM/yyyy",
                onChange: (e) => changePhaseDate(index, e.target.value),
            }}
        />
    );
    // return (
    //     <DatepickerSelect
    //         name="startDate"
    //         min={"2020-01-31"}
    //         title="En format YYYY-MM-DD, par exemple : 2020-01-31"
    //         required
    //         dateFormat="dd/MM/yyyy"
    //         selected={startDate}
    //         onChange={(dateInput: Date) => setStartDate(dateInput)}
    //     />
    // );
};

interface PhaseActionProps {
    deletePhase(index: number): void;
    index: number;
}

export const PhaseActionCell = ({ index, deletePhase }: PhaseActionProps) => {
    return (
        <Button
            nativeButtonProps={{
                onClick: () => deletePhase(index),
            }}
            priority="tertiary"
        >
            🗑️
        </Button>
    );
};
