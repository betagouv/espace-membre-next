"use client";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { fr } from "@codegouvfr/react-dsfr";
import { FileForm } from "./FileForm";
import { uploadStartupFile } from "../../app/api/startups/upload-file";
import { DocSchemaType } from "@/models/startupFiles";
import { getStartupFiles } from "@/app/api/startups/get-startup-files";

import { FileList } from "./FileList";

const wait = () =>
    new Promise((resolve) => {
        setTimeout(resolve, 500);
    });

function DocsDropZone({ onDrop }) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
    });

    const { style, ...props } = getInputProps();

    return (
        <div {...getRootProps()}>
            <Upload
                nativeInputProps={{ ...props }}
                label="Choisissez un ou plusieurs fichiers"
                hint="Taille maximale : 10 Mo. Formats supportés : pdf, doc, docx, ppt, pptx. Plusieurs fichiers possibles."
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
    startup: { uuid: string };
    files: Awaited<ReturnType<typeof getStartupFiles>>;
}) => {
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [fileIndex, setFileIndex] = useState(0);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setPendingFiles(acceptedFiles);
        setFileIndex(0);
    }, []);

    const onFormSubmit = async (data: DocSchemaType) => {
        await wait();

        const uploaded = await uploadStartupFile({
            uuid: startup.uuid,
            content: await generateDataUrl(pendingFiles[fileIndex]),
            filename: pendingFiles[fileIndex].name,
            size: pendingFiles[fileIndex].size,
            ...data,
        });

        if (uploaded) {
            // upload
            files.unshift(uploaded);
        } else {
            alert("Impossible d'uploader");
        }
        await wait();

        if (fileIndex === pendingFiles.length - 1) {
            // finished
            setPendingFiles([]);
            setFileIndex(0);
        } else {
            setFileIndex((fileIndex) => fileIndex + 1);
        }

        return true;
    };

    const pendingFile =
        pendingFiles.length > fileIndex && pendingFiles[fileIndex];
    return (
        <>
            <CallOut title="Fichiers du produit">
                Déposez et retrouvez ici les fichiers relatifs à la vie du
                produit. <br />
                Ces fichiers sont accessibles à{" "}
                <b>toute la communauté beta.gouv.fr.</b>
            </CallOut>

            <FileList files={files} />

            <DocsDropZone onDrop={onDrop} />

            {pendingFile && (
                <>
                    <br />
                    <h2>{pendingFile.name}</h2>
                    <FileForm onSubmit={onFormSubmit} file={pendingFile} />
                </>
            )}
        </>
    );
};
