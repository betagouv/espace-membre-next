import React from "react";
import { Phase } from "@/models/startup";
import SEPhaseSelect from "../SEPhaseSelect";
import DatepickerSelect from "../DatepickerSelect";
import Input from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";

interface PhaseItemProps extends Phase {
    deletePhase(): void;
    onChange(phase: Phase): void;
}

export const PhaseSelectionCell = ({
    name,
    index,
    changePhase,
}: PhaseItemProps) => {
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
}: PhaseItemProps) => {
    return (
        <Input
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

export const PhaseActionCell = ({ index, deletePhase }: PhaseItemProps) => {
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

const PhaseItem = ({ name, start, deletePhase, onChange }: PhaseItemProps) => {
    const [startDate, setStartDate]: [Date, (Date) => void] = React.useState(
        start ? new Date(start) : undefined
    );
    const [phase, setPhase] = React.useState(name);
    React.useEffect(() => {
        onChange({
            name: phase,
            start: startDate,
        });
    }, [phase, startDate]);
    return (
        <>
            <tr style={{ border: "none" }}>
                <td style={{ padding: 5 }}>
                    <SEPhaseSelect
                        onChange={(phase) => {
                            setPhase(phase.value);
                        }}
                        defaultValue={name}
                        isMulti={false}
                        placeholder={"Selectionne la phase"}
                    />
                </td>
                <td style={{ padding: 5 }}>
                    {
                        <DatepickerSelect
                            name="startDate"
                            min={"2020-01-31"}
                            title="En format YYYY-MM-DD, par exemple : 2020-01-31"
                            required
                            dateFormat="dd/MM/yyyy"
                            selected={startDate}
                            onChange={(dateInput: Date) =>
                                setStartDate(dateInput)
                            }
                        />
                    }
                </td>
                <td style={{ padding: 5 }}>
                    <a
                        style={{ textDecoration: "none" }}
                        onClick={() => deletePhase()}
                    >
                        🗑️
                    </a>
                </td>
            </tr>
        </>
    );
};

export default PhaseItem;
