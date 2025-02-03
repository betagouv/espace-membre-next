'use client';
import { useState, useRef, ChangeEvent } from "react";

import { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Skeleton from "@mui/material/Skeleton/Skeleton";
import { format } from "date-fns";
import { PlaceholderValue } from "next/dist/shared/lib/get-img-props";

import { FichePicture, defaultPlaceholder } from "../FichePicture";

interface UploadFormProps {
    label: string;
    hintText?: string;
    url?: string;
    placeholderURL?: PlaceholderValue;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onDelete: () => void;
    shape?: "round" | "rectangle";
}

function isRelativeUrl(url) {
    const absolutePattern = /^(?:[a-zA-Z][a-zA-Z\d+\-.]*:|\/\/)/;
    return !absolutePattern.test(url);
}

const computeVersion = () => {
    const version = format(new Date(), "yyyyMMdd'T'HHmmss");
    return version;
};

function addVersionParam(url: string): string {
    const isRelative = isRelativeUrl(url);
    const tempUrl = isRelative
        ? new URL(url, window.location.origin)
        : new URL(url);
    const params = tempUrl.searchParams;
    const version = computeVersion();
    params.set("v", version);
    return isRelative ? tempUrl.pathname + tempUrl.search : tempUrl.toString();
}

const UploadForm = ({
    url,
    onChange,
    onDelete,
    label,
    shape,
    hintText,
    placeholderURL = defaultPlaceholder,
}: UploadFormProps) => {
    const [image, setImage] = useState<File | null>(null); // Use union type File | null
    const [isImageLoading, setIsImageLoading] = useState<boolean>(true);
    const [shouldDeletePicture, setShouldDeletePicture] =
        useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        if (fileInputRef && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            const fileSizeInKB = file.size / 1024;

            if (fileSizeInKB > 500) {
                alert("Le fichier ne peut pas faire plus de 500 Ko");
                return;
            }

            setImage(file);
            setShouldDeletePicture(false);
            onChange(event);
        }
    };

    const buttons: [ButtonProps, ...ButtonProps[]] = [
        {
            children:
                (!url && !image) || shouldDeletePicture
                    ? "Importer une image"
                    : "Changer l'image",
            iconId: "fr-icon-download-line",
            size: "small",
            nativeButtonProps: {
                onClick: handleButtonClick,
                type: "button",
            },
        },
    ];

    let src: string = placeholderURL;
    if (image) {
        src = URL.createObjectURL(image);
    } else if (url && !shouldDeletePicture) {
        src = addVersionParam(url);
    }

    if ((url || image) && !shouldDeletePicture) {
        buttons.push({
            children: "Supprimer l'image",
            iconId: "fr-icon-delete-bin-line",
            size: "small",
            nativeButtonProps: {
                onClick: () => {
                    setImage(null);
                    if (url) {
                        setShouldDeletePicture(true);
                    }
                    onDelete();
                },
                type: "button",
            },
            priority: "secondary",
        });
    }

    return (
        <div className="fr-upload-group">
            <label className="fr-label" htmlFor="file-upload">
                {label}
                {hintText && <span className="fr-hint-text">{hintText}</span>}
                <span className="fr-hint-text fr-mb-1w">{`Taille maximale : 500 ko. Format supporté : jpg.`}</span>
            </label>
            {/* workaround to make skeleton work with Image component when image loading */}
            {isImageLoading && (
                <Skeleton
                    variant={shape === "round" ? "rounded" : "rectangular"}
                >
                    <FichePicture
                        shape={shape}
                        src={src}
                        placeholder={placeholderURL}
                        onLoad={() => {
                            setIsImageLoading(false);
                        }}
                    />
                </Skeleton>
            )}
            {!isImageLoading && <FichePicture shape={shape} src={src} />}
            <input
                type="file"
                accept="image/jpeg"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
            <ButtonsGroup buttons={buttons} inlineLayoutWhen="always" />
        </div>
    );
};

export default UploadForm;
