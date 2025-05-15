"use client";

//import { contenusTypes } from "@/components/StartupFiles/FormDoc";
import { FileList } from "@/components/StartupFiles/FileList";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { useState } from "react";

const allDocTypes = ["Autre", "Document de comité", "Rapport annuel"];

export const SearchFiles = ({ files }) => {
    const [docTypes, setDocTypes] = useState(allDocTypes);
    const options = allDocTypes.map((c) => ({
        label: c,
        nativeInputProps: {
            defaultChecked: docTypes.includes(c),
            value: c,
            onClick: (e) => {
                const checked = e.currentTarget.value;
                if (docTypes.includes(checked)) {
                    setDocTypes(docTypes.filter((c) => c !== checked));
                } else {
                    setDocTypes((docTypes) => [...docTypes, checked]);
                }
            },
        },
    }));
    const filteredFiles = files.filter((f) => docTypes.includes(f.type));
    return (
        <>
            <Checkbox
                legend="Types de documents: "
                small={true}
                orientation="horizontal"
                options={options}
            />
            {filteredFiles.length ? (
                <FileList files={filteredFiles} showStartup={true} />
            ) : (
                <div>Aucun fichier trouvé</div>
            )}
        </>
    );
};
