"use client";
import React, { useState } from "react";

import AutoComplete, { OptionType } from "@/components/AutoComplete";
import { matomoSiteSchemaType } from "@/models/matomo";

export type MatomoSiteOptionType = OptionType<false> & {
    value: string;
};

export default function MatomoSiteSelect({
    sites,
    onChange,
    onBlur,
    isMulti,
    placeholder,
    defaultValue,
    hint,
    label,
    state,
    stateMessageRelated,
}: {
    sites: matomoSiteSchemaType[];
    onChange?: any;
    onBlur?: any;
    isMulti?: boolean;
    placeholder?: string;
    defaultValue?:
        | { value: string; label: string }
        | { value: string; label: string }[];
    hint?: string;
    label?: string;
    state?: "default" | "success" | "error" | undefined;
    stateMessageRelated?: string;
}) {
    const onTagsChange = (values) => {
        onChange(values);
    };
    const [initialValue] = useState(
        defaultValue ? (defaultValue as MatomoSiteOptionType[]) : undefined,
    );

    return (
        <div className="fr-select-group">
            <label className="fr-label" htmlFor="matomo-site-select">
                {label}
                {!!hint && <span className="fr-hint-text">{hint}</span>}
            </label>
            <AutoComplete
                id="matomo-site-select"
                placeholder={placeholder}
                multiple={isMulti}
                options={sites.map((s) => ({
                    label: s.name,
                    value: s.id.toString(),
                }))}
                onSelect={onTagsChange}
                onBlur={onBlur}
                defaultValue={initialValue}
                // sx={{ width: "500px" }}
            />
            {!!state && !!stateMessageRelated && (
                <p className="fr-error-text">{stateMessageRelated}</p>
            )}
        </div>
    );
}
