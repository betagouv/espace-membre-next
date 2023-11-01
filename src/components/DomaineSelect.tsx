import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export default function DomaineSelect({
    onChange,
    label,
    hint,
    state,
    stateRelatedMessage,
    defaultValue,
    domaines,
}: {
    onChange?: any;
    label?: any;
    hint?: any;
    state?: any;
    stateRelatedMessage?: any;
    defaultValue?: any;
    domaines?: any;
}) {
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
                    id: se.value,
                    label: se.label,
                }))}
                onChange={onChange}
                defaultValue={
                    defaultValue
                        ? defaultValue.map((se) => ({
                              id: se.value,
                              label: se.label,
                          }))
                        : undefined
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
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
