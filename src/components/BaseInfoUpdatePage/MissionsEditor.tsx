import { userStatusOptions } from "@/config";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { useFieldArray } from "react-hook-form";

import { employers } from "./employers";

export const MissionsEditor = ({ control, register }) => {
    const {
        fields: missionsFields,
        append: missionsAppend,
        remove: missionsRemove,
    } = useFieldArray({
        rules: { minLength: 1 },
        control,
        name: "missions",
    });

    const addMissionClick = (e) => {
        missionsAppend({
            start: new Date().toISOString().substring(0, 10),
            end: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30 * 6)
                .toISOString()
                .substring(0, 10), // 6 months,
            status: null,
            employer: null,
        });
    };

    const columns = [
        {
            key: "start",
            label: "Début",
            renderer: (v, index) => (
                <Input
                    label="Date de début"
                    hideLabel
                    nativeInputProps={{
                        style: { width: 150 },
                        placeholder: "JJ/MM/YYYY",
                        type: "date",
                        ...register(`missions.${index}.start`),
                    }}
                />
            ),
        },
        {
            key: "end",
            label: "Fin",
            renderer: (v, index) => (
                <Input
                    label="Date de fin"
                    hideLabel
                    nativeInputProps={{
                        style: { width: 150 },
                        placeholder: "JJ/MM/YYYY",
                        type: "date",
                        ...register(`missions.${index}.end`),
                    }}
                />
            ),
        },
        {
            key: "status",
            label: "Statut",
            renderer: (v, index) => (
                <Select
                    label=""
                    nativeSelectProps={{
                        ...register(`missions.${index}.status`),
                    }}
                >
                    <option value="">Statut:</option>
                    {userStatusOptions.map((option) => (
                        <option
                            key={option.key}
                            selected={option.key === v}
                            value={option.key}
                        >
                            {option.name}
                        </option>
                    ))}
                </Select>
            ),
        },
        {
            key: "employer",
            label: "Employeur",
            renderer: (v, index) => (
                <Select
                    label=""
                    nativeSelectProps={{
                        ...register(`missions.${index}.employer`),
                    }}
                >
                    <option value="">Employeur:</option>
                    {employers.map((employer) => (
                        <option
                            key={employer}
                            selected={employer === v}
                            value={employer}
                        >
                            {employer}
                        </option>
                    ))}
                </Select>
            ),
        },
        {
            key: "actions",
            label: "",
            renderer: (_, index, all) => (
                <div>
                    {all.length > 1 && (
                        <button
                            className={fr.cx("fr-icon-delete-bin-line")}
                            style={{ cursor: "pointer" }}
                            onClick={() => missionsRemove(index)}
                        />
                    )}
                </div>
            ),
        },
    ];

    const tableData = missionsFields.map((mission, i, all) =>
        columns.map(({ key, renderer }) =>
            renderer ? renderer(mission[key], i, all) : mission[key]
        )
    );

    return (
        <div className={fr.cx("fr-mb-3w")}>
            <Table
                headers={columns.map((h) => h.label)}
                caption="Liste des missions"
                noCaption
                data={tableData}
                style={{ marginBottom: 5 }}
            />

            <Button
                iconId="fr-icon-add-circle-line"
                priority="secondary"
                size="small"
                type="button"
                onClick={addMissionClick}
            >
                Ajouter une mission
            </Button>
        </div>
    );
};
