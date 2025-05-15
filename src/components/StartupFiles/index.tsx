"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import * as Sentry from "@sentry/browser";
import { useDropzone } from "react-dropzone";

import { FileForm } from "./FileForm";
import { FileList } from "./FileList";
import { uploadStartupFile } from "../../app/api/startups/files/upload";
import { getStartupFiles } from "@/app/api/startups/files/list";
import { DocSchemaType } from "@/models/startupFiles";

function DocsDropZone({ onDrop, reset }) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
    });

    useEffect(() => {
        // force reset the field
        if (inputRef && inputRef.current) {
            inputRef.current.value = "";
        }
    }, [reset]);

    const { style, ...props } = getInputProps();
    return (
        <div {...getRootProps()}>
            <Upload
                nativeInputProps={{
                    ...props,
                    ref: inputRef,
                    // pdf, xls, doc, ptt
                    accept: "application/pdf, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                }}
                label="Choisissez un ou plusieurs documents"
                hint="Taille maximale : 10 Mo. Formats supportés : pdf, doc, docx, ppt, pptx. Plusieurs documents possibles."
                multiple
            />
        </div>
    );
}

function generateDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
    });
}

export const StartupFiles = ({
    startup,
    files,
}: {
    startup: { uuid: string; name: string };
    files: Awaited<ReturnType<typeof getStartupFiles>>;
}) => {
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [fileIndex, setFileIndex] = useState(0);
    const [uploadsCompleted, setUploadsCompleted] = useState<boolean | null>(
        false
    );

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setUploadsCompleted(false);
        setPendingFiles(acceptedFiles);
        setFileIndex(0);
    }, []);

    const onFormSubmit = async (data: DocSchemaType) => {
        const uploaded = await uploadStartupFile({
            uuid: startup.uuid,
            content: await generateDataUrl(pendingFiles[fileIndex]),
            filename: pendingFiles[fileIndex].name,
            size: pendingFiles[fileIndex].size,
            ...data,
        }).catch((err) => {
            Sentry.captureException(err);
            alert("Impossible d'uploader le document 😰");
        });

        if (uploaded) {
            // upload
            files.unshift({
                ...uploaded,
                startup_uuid: startup.uuid,
                startup: startup.name,
            });
        }

        if (fileIndex === pendingFiles.length - 1) {
            // finished
            setPendingFiles([]);
            setFileIndex(0);
            setUploadsCompleted(true);
        } else {
            setFileIndex((fileIndex) => fileIndex + 1);
        }

        return true;
    };

    const pendingFile =
        pendingFiles.length > fileIndex && pendingFiles[fileIndex];
    return (
        <>
            <CallOut title="Documents du produit" titleAs="h2">
                Déposez et retrouvez ici les documents relatifs à la vie du
                produit. <br />
                Ces documents sont accessibles à{" "}
                <b>toute la communauté beta.gouv.fr.</b>
            </CallOut>

            <FileList files={files} />

            <h2>Ajouter un document</h2>

            <div
                className={fr.cx("fr-p-2w")}
                style={{ border: "1px solid var(--border-plain-grey)" }}
            >
                <DocsDropZone onDrop={onDrop} reset={uploadsCompleted} />

                {pendingFile && (
                    <>
                        <br />
                        <h2>{pendingFile.name}</h2>
                        <FileForm onSubmit={onFormSubmit} file={pendingFile} />
                    </>
                )}
            </div>
        </>
    );
};
