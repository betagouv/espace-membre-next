"use client";
import React from "react";
import { ColorOptions, fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import Link from "next/link";
import { format } from "date-fns";
import { typesDocuments } from "@/models/startupFiles";

const colors: Record<string, string> = {
    Autre: fr.colors.decisions.background.actionLow.yellowTournesol.default,
    "Document de comité":
        fr.colors.decisions.background.actionLow.greenEmeraude.default,
    "Rapport annuel":
        fr.colors.decisions.background.actionLow.pinkMacaron.default,
};

export const FileList = ({ files }) => {
    return (
        <div>
            {files.map((file, i) => (
                <div key={file.title + i} className={fr.cx("fr-mb-1w")}>
                    <Link
                        target="_blank"
                        href={`/api/startups/download-file/${file.uuid}`}
                    >
                        {file.title}
                    </Link>
                    <Tag
                        className={fr.cx("fr-ml-1w")}
                        small
                        style={{ backgroundColor: colors[file.type] }}
                    >
                        {file.type}
                        {file.data?.date_comite &&
                            ` du ${format(file.data?.date_comite, "dd/MM/yy")}`}
                    </Tag>
                    {file.data?.contenu &&
                        file.data?.contenu.map((m) => (
                            <Tag key={m} className={fr.cx("fr-ml-1w")} small>
                                {m}
                            </Tag>
                        ))}
                    {file.created_at && (
                        <i
                            className={fr.cx(
                                "fr-ml-1w",
                                "fr-icon--sm",
                                "fr-icon-time-line"
                            )}
                            style={{ cursor: "pointer" }}
                            title={format(file.created_at, "dd/MM/yyyy")}
                        />
                    )}
                    {file.comments && (
                        <i
                            className={fr.cx(
                                "fr-ml-1w",
                                "fr-icon--sm",
                                "fr-icon-discuss-line"
                            )}
                            style={{ cursor: "pointer" }}
                            title={file.comments}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};
