import { useEffect, useState } from "react";

import Select from "@codegouvfr/react-dsfr/Select";

import { FormDoc } from "./FormDoc";
import {
    typesDocuments,
    docSchema,
    DocSchemaType,
} from "@/models/startupFiles";

// allows to switch between diffrent forms
export const FileForm = ({
    onSubmit,
    file,
}: {
    onSubmit: (any) => {};
    file: File;
}) => {
    const [selectedSchema, setSelectedSchema] = useState<
        DocSchemaType["type"] | "default"
    >("default");
    const onFormSubmit = async (data) => {
        await onSubmit(data);
        setSelectedSchema("default");
    };
    useEffect(() => {
        setSelectedSchema("default");
    }, [file]);
    return (
        <>
            <Select
                label={docSchema.shape.type.description}
                nativeSelectProps={{
                    onChange: (e) => {
                        const newSchema = e.target
                            .value as DocSchemaType["type"];
                        setSelectedSchema(newSchema);
                    },
                    value: selectedSchema || undefined,
                }}
            >
                <option value="default">Sélectionner une option:</option>
                {typesDocuments.map((t) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                ))}
            </Select>
            {/* {(selectedSchema === "Document de comité" && (
                <FormDocComite file={file} onSubmit={onFormSubmit} />
            )) ||
                (selectedSchema !== "default" && ( */}
            {selectedSchema !== "default" && (
                <FormDoc
                    file={file}
                    type={selectedSchema}
                    onSubmit={onFormSubmit}
                />
            )}
            {/* ))} */}
        </>
    );
};
