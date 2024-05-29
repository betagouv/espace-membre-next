import React from "react";

import Select from "@codegouvfr/react-dsfr/Select";

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
                required: true,
                defaultValue: value,
            }}
        >
            <option value="">---</option>
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
