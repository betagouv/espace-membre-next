"use client";
import { useState } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";

import { FileList } from "@/components/StartupFiles/FileList";
import { typesDocuments } from "@/models/startupFiles";

const allDocTypes = [...typesDocuments]; // prevent TS readonly issue

export const SearchFiles = ({ files }) => {
    const [docTypes, setDocTypes] = useState(allDocTypes);
    const filteredFiles = files.filter((f) => docTypes.includes(f.type));
    return (
        <>
            {allDocTypes.map((docType) => (
                <Tag
                    key={docType}
                    style={{ marginRight: "1em" }}
                    nativeButtonProps={{
                        onClick: (e) => {
                            if (docTypes.includes(docType)) {
                                setDocTypes(
                                    docTypes.filter((c) => c !== docType),
                                );
                            } else {
                                setDocTypes((docTypes) => [
                                    ...docTypes,
                                    docType,
                                ]);
                            }
                        },
                    }}
                    pressed={docTypes.includes(docType)}
                >
                    {docType}
                </Tag>
            ))}
            {filteredFiles.length ? (
                <FileList files={filteredFiles} showStartup={true} />
            ) : (
                <div className={fr.cx("fr-mt-2w", "fr-text--heavy")}>
                    Aucun fichier trouvé
                </div>
            )}
        </>
    );
};
