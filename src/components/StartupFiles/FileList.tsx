"use client";
import React from "react";
import { ColorOptions, fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import Link from "next/link";
import { format } from "date-fns";
import { typesDocuments } from "@/models/startupFiles";
import Table from "@codegouvfr/react-dsfr/Table";

import "./FileList.css";

const colors: Record<string, string> = {
    Autre: fr.colors.decisions.background.actionLow.yellowTournesol.default,
    "Document de comité":
        fr.colors.decisions.background.actionLow.greenEmeraude.default,
    "Rapport annuel":
        fr.colors.decisions.background.actionLow.pinkMacaron.default,
};

export const FileList = ({ files }) => {
    return (
        files.length > 0 && (
            <Table
                className="startup-files-list-table"
                headers={["Date", "Type", "Fichier", "Tags", "Commentaires"]}
                data={files.map((file) => [
                    format(file.created_at, "dd/MM/yyyy"),
                    <Tag small style={{ backgroundColor: colors[file.type] }}>
                        {file.data?.date_comite
                            ? `Comité du ${format(
                                  file.data?.date_comite,
                                  "dd/MM/yy"
                              )}`
                            : file.type}
                    </Tag>,
                    <Link
                        target="_blank"
                        href={`/api/startups/download-file/${file.uuid}`}
                    >
                        {file.title}
                    </Link>,
                    (file.data?.contenu &&
                        file.data?.contenu.map((m) => (
                            <Tag key={m} className={fr.cx("fr-ml-1w")} small>
                                {m}
                            </Tag>
                        ))) ||
                        "",
                    file.comments || "",
                ])}
            />
        )
    );
};
