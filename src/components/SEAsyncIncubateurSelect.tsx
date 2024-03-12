import React, { useState } from "react";
import axios from "axios";
import Select from "@codegouvfr/react-dsfr/Select";

export default function SEIncubateurSelect({
    onChange,
    value,
    placeholder,
    required,
    showPlaceHolder = false,
}: {
    onChange: any;
    value: any;
    placeholder?: any;
    required: boolean;
    showPlaceHolder?: boolean;
}) {
    const [options, setOptions] = React.useState<
        { value: string; label: string }[]
    >([]);
    const [incubator, setIncubator] = useState(value);

    React.useEffect(() => {
        // React advises to declare the async function directly inside useEffect
        const getOptions = async () => {
            const incubators = await axios
                .get<any[]>("/api/incubators")
                .then((response) => response.data)
                .catch((err) => {
                    console.error(err);
                    throw new Error(`Error to get incubators infos : ${err}`);
                });
            const optionValues = Object.keys(incubators).map((incubator) => {
                return {
                    value: incubator,
                    label: incubators[incubator].title,
                };
            });
            setOptions(optionValues);
        };

        // You need to restrict it at some point
        // This is just dummy code and should be replaced by actual
        if (!options.length) {
            getOptions();
        }
    }, []);
    if (!options.length) {
        return null;
    }

    return (
        <Select
            label="Incubateur"
            nativeSelectProps={{
                onChange: (event) => {
                    setIncubator(event.target.value);
                    onChange({ value: event.target.value });
                },
                value,
                defaultValue: value,
                required,
            }}
        >
            <option
                value=""
                disabled={!showPlaceHolder}
                hidden={!showPlaceHolder}
            >
                {placeholder || "Selectionnez un incubateur"}
            </option>
            {options.map((incubateur, index) => (
                <option value={incubateur.value} key={index}>
                    {incubateur.label}
                </option>
            ))}
        </Select>
    );
}
