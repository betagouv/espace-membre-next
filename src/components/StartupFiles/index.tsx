"use client";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
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

    const blockStyle = {
        width: "100%",
        height: 200,
        margin: "1rem 0",
        padding: "1rem",
        border: "3px solid var(--text-default-grey)",
        backgroundColor: "var(--artwork-background-grey)",
        cursor: "pointer",
    };
    if (isDragActive) {
        blockStyle.backgroundColor = "var(--artwork-background-green-bourgeon)";
    }
    return (
        <div {...getRootProps()} style={blockStyle}>
            <input {...getInputProps()} />
            <p>
                <i className={fr.cx("fr-icon-upload-2-fill", "fr-mr-1w")}></i>
                Déposez des fichiers ici ou cliquez pour choisir des fichiers
            </p>
        </div>
    );
}

const uploadModal = createModal({
    id: "upload-startup-file-modal",
    isOpenedByDefault: false,
});

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
        uploadModal.open();
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
        uploadModal.close();
        await wait();

        if (fileIndex === pendingFiles.length - 1) {
            // finished
            setPendingFiles([]);
            setFileIndex(0);
        } else {
            setFileIndex((fileIndex) => fileIndex + 1);
            uploadModal.open();
        }

        return true;
    };

    const file = pendingFiles.length > fileIndex && pendingFiles[fileIndex];
    return (
        <>
            <CallOut title="Fichiers de la startup">
                Déposez et retrouvez ici les fichiers relatifs à la vie du
                produit. <br />
                Ces fichiers sont accessibles à{" "}
                <b>toute la communauté beta.gouv.fr.</b>
            </CallOut>
            <uploadModal.Component title={(file && file.name) || ""}>
                {file && (
                    <FileForm
                        onSubmit={onFormSubmit}
                        file={pendingFiles[fileIndex]}
                    />
                )}
            </uploadModal.Component>
            <FileList files={files} />
            <DocsDropZone onDrop={onDrop} />
        </>
    );
};
