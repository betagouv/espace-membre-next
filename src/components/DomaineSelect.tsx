import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { DOMAINE_OPTIONS } from "../models/member";

export default function DomaineSelect({
    onChange,
    label,
    hint,
    state,
    stateRelatedMessage,
    defaultValue,
}: {
    onChange?: any;
    label?: any;
    hint?: any;
    state?: any;
    stateRelatedMessage?: any;
    defaultValue?: any;
}) {
    const domaines = DOMAINE_OPTIONS;
    return (
        <div className="fr-select-group">
            {!!label && (
                <label className="fr-label">
                    {label || "Sélectionne un ou plusieurs incubateurs"}
                    {!!hint && <span className="fr-hint-text">{hint}</span>}
                </label>
            )}
            <Autocomplete
                multiple
                options={domaines.map((se) => ({
                    id: se.key,
                    label: se.name,
                }))}
                onChange={onChange}
                defaultValue={
                    defaultValue
                        ? defaultValue.map((se) => ({
                              id: se.key,
                              label: se.name,
                          }))
                        : undefined
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        inputProps={{
                            ...params.inputProps,
                            style: {
                                padding: `0.75rem 0.5rem`,
                            },
                        }}
                        variant="standard"
                        style={{
                            paddingLeft: 10,
                            borderRadius: `0.25rem 0.25rem 0 0`,
                            backgroundColor: `var(--background-contrast-grey)`,
                            boxShadow: `inset 0 -2px 0 0 var(--border-plain-grey)`,
                        }}
                        // label="limitTags"
                        placeholder="Sélectionne un ou plusieurs domaines"
                    />
                )}
                // sx={{ width: "500px" }}
            />
            {!!state && !!stateRelatedMessage && (
                <p className="fr-error-text">{stateRelatedMessage}</p>
            )}
        </div>
    );
}
