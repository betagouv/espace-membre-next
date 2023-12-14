import Select from "@codegouvfr/react-dsfr/Select";
import React from "react";

const options = [
    { value: "non conforme", label: "non conforme" },
    { value: "partiellement conforme", label: "partiellement conforme" },
    { value: "totalement conforme", label: "totalement conforme" },
];
export default function SelectAccebilityStatus({ value, onChange }) {
    return (
        <Select
            label="Sélectionne l'accessibilité de votre produit"
            nativeSelectProps={{
                onChange,
                defaultValue: value,
                required: true,
            }}
        >
            {options.map((option) => {
                return (
                    <option key={option.value} value={option.value}>
                        {option.value}
                    </option>
                );
            })}
        </Select>
    );
}
