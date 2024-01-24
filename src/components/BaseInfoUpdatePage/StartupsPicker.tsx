import { Controller } from "react-hook-form";

import SESelect from "../SESelect";

export const StartupsPicker = ({ name, control, startups, ...props }) => {
    return (
        <Controller
            control={control}
            rules={{
                required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
                <SESelect
                    onChange={onChange}
                    onBlur={onBlur}
                    isMulti={true}
                    placeholder={`Sélectionne un ou plusieurs produits`}
                    startups={startups}
                    {...props}
                />
            )}
            name={name}
        />
    );
};
