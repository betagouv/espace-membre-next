import { DOMAINE_OPTIONS } from "../models/member";
import AutoComplete from "@/components/AutoComplete";

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
    return (
        <div className="fr-select-group">
            {!!label && (
                <label className="fr-label">
                    {label || "Sélectionne un ou plusieurs incubateurs"}
                    {!!hint && <span className="fr-hint-text">{hint}</span>}
                </label>
            )}
            <AutoComplete
                multiple
                options={DOMAINE_OPTIONS.map((se) => ({
                    id: se.name,
                    label: se.name,
                }))}
                onSelect={(values, e) => onChange(e, values)}
                defaultValue={defaultValue}
                placeholder="Sélectionne un ou plusieurs domaines"
            />
            {!!state && !!stateRelatedMessage && (
                <p className="fr-error-text">{stateRelatedMessage}</p>
            )}
        </div>
    );
}
