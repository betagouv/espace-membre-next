"use client";
import React from "react";
import Link from "next/link";

import { fr } from "@codegouvfr/react-dsfr";
import Table from "@codegouvfr/react-dsfr/Table";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { format } from "date-fns";
import { frenchSmallDate } from "@utils/date";

import "./FileList.css";
import { revalidatePath } from "next/cache";

import { deleteFile } from "@/app/api/startups/files/delete";
import { getStartupFiles } from "@/app/api/startups/files/list";
import Button from "@codegouvfr/react-dsfr/Button";

type FilesType = Awaited<ReturnType<typeof getStartupFiles>>;

const colors: Record<string, string> = {
    Autre: fr.colors.decisions.background.actionLow.yellowTournesol.default,
    "Document de comité":
        fr.colors.decisions.background.actionLow.greenEmeraude.default,
    "Rapport annuel":
        fr.colors.decisions.background.actionLow.pinkMacaron.default,
};

export const FileList = ({
    files,
    showStartup = false,
}: {
    files: FilesType;
    showStartup?: boolean;
}) => {
    return (
        files.length > 0 && (
            <Table
                className="startup-files-list-table"
                headers={[
                    "Date",
                    showStartup && "Produit",
                    "Type",
                    "Titre",
                    "Commentaires",
                ].filter(Boolean)}
                data={files.map((file) =>
                    [
                        frenchSmallDate(file.created_at),
                        showStartup && (
                            <Link href={`/startups/${file.startup_uuid}`}>
                                {file.startup}
                            </Link>
                        ),
                        <Tag
                            key="type"
                            small
                            style={{
                                backgroundColor: colors[file.type || "Autre"],
                            }}
                        >
                            {
                                // @ts-ignore todo
                                file.data?.date_comite
                                    ? `Comité du ${frenchSmallDate(
                                          // @ts-ignore todo
                                          file.data?.date_comite
                                      )}`
                                    : file.type
                            }
                        </Tag>,
                        <>
                            <Link
                                key="title"
                                target="_blank"
                                download={file.filename}
                                href={`/api/startups/files/download/${file.uuid}`}
                            >
                                {file.title}
                            </Link>
                            {
                                // @ts-ignore todo
                                (file.data?.contenu && (
                                    // @ts-ignore todo
                                    <ul className={fr.cx("fr-p-0")}>
                                        {file.data?.contenu.map((m) => (
                                            <Tag
                                                key={m}
                                                className={fr.cx(
                                                    "fr-mr-1w",
                                                    "fr-ml-0"
                                                )}
                                                small
                                            >
                                                {m}
                                            </Tag>
                                        ))}
                                    </ul>
                                )) ||
                                    ""
                            }
                        </>,
                        // @ts-ignore todo
                        file.comments || "-",
                    ].filter(Boolean)
                )}
            />
        )
    );
};
