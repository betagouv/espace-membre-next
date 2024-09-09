import React from "react";

import AsyncSelect from "react-select/async";

import { ClientOnly } from "./ClientOnly";
import { searchCommunes } from "@/lib/searchCommune";


export default function CommuneSelect({ defaultValue, onChange, placeholder }) {
    const loadOptions = (inputValue: string) => searchCommunes(inputValue);

    return (
        <ClientOnly>
            <AsyncSelect
                cacheOptions
                loadOptions={loadOptions}
                defaultOptions
                placeholder={placeholder}
                defaultInputValue={defaultValue}
                defaultValue={defaultValue}
                hideSelectedOptions={false}
                onChange={onChange}
                blurInputOnSelect={false}
            />
        </ClientOnly>
    );
}
