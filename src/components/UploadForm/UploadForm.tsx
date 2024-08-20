import { useState, useRef, ChangeEvent } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { PlaceholderValue } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";

const defaultPlaceholder =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQACWAJYAAD/2wCEAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDIBCQkJDAsMGA0NGDIhHCEyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMv/CABEIAMgAyAMBIgACEQEDEQH/xAAtAAEAAwEBAQAAAAAAAAAAAAAAAwQFAgEHAQEBAAAAAAAAAAAAAAAAAAAAAf/aAAwDAQACEAMQAAAA+vCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8zS9UpCz1UGjbw5TYcdgAAAAAAAGbU98oAAC1p42zAAAAAAACOSMxhQAAHW3hbsAAAAAAAIpapmCgAAPdnF1onAAAAAAAhm8MNNDQAADaztSAAAAAAAAKmbuY5GKAEpozkAAAAAAAAM3QyiEUAt1JzWc9QAAAAAAIyTmjUPeCgAAO9jE6jbZ9wkAAAITqnT8JYigAAAAAAJbFIbMmHrRMBlhWFAAAAAAAAALJGoD//xAA1EAACAQEFBQUHAwUAAAAAAAABAgMRAAQhMDEFEjJAURMgM2FxEBQiQVJygZGhwUJicJKx/9oACAEBAAE/AP8AEEt5ihwZqt9I1s+0WJ+BAPXG3v8AP1X/AFsu0JRqqH8Usm0UPGjL6Y2BBAI0PJM6opZiAo1JtPfHkJCEqn7nvQ3iSA/Car9J0tFKs0YZfyOnI3+UtN2dcFGnnkXBys+5XBhyBNASdBjZ2LuWOpNciBit4jI+ochOaXeT7Tkod2RW6EHkJxW7yD+05Q0z55ViiJetDhhkilRXS0Uiyxh1rQ9c+/it3B6MMq5il1Tzqf3z70u/dnHQV/TKiXchRegz2UMpU6EUNrxd/d2Ub28DphkXa69uN4mig/ryO0E3oVcf0n/uRdI+zuyg6n4j+eRZQ6lW0IobTRGGUocaaHqO9d4u2mCnh1Ppye0fHT7f572zvHf7f55J3SNauwUedr1KJpt5eECg711lEM4ZuEihskiSLVGDDy5CSRIl3nYAWkdpJCzEnHCuRG7RyBlJGONLRyJKu8jAjNknii43APQYm0u0CaiJaeZszs7bzMSepyldkbeViD1FotoEUEq18xaOeKXgcE9DgciWeOEVdvQDU2faLHw0A82xs95mk4nNOgw5BLzNHwuadDjZNosPEQHzXC0U8cwqjeoOo7l5n7COoxc4KLMzOxZiSTqTyisyMGUkEaEWu0/bx1ODjBh7b8xa8kfJQBy1xYreQPkwI9n/xAAUEQEAAAAAAAAAAAAAAAAAAABw/9oACAECAQE/ACn/xAAUEQEAAAAAAAAAAAAAAAAAAABw/9oACAEDAQE/ACn/2Q==";

interface UploadFormProps {
    label: string;
    hintText?: string;
    url?: string;
    placeholderURL?: PlaceholderValue;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onDelete: () => void;
    shape?: "round" | "square";
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
            const fileExtension = file.name.split(".").pop()?.toLowerCase();

            if (!fileExtension || !["jpeg", "jpg"].includes(fileExtension)) {
                alert("Le fichier doit être au format .jpeg");
                return;
            }

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
        src = url;
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
            <div
                style={
                    shape === "round"
                        ? {
                              width: "200px",
                              height: "200px",
                              position: "relative",
                              borderRadius: "50%",
                              overflow: "hidden",
                          }
                        : {
                              width: "356px",
                              height: "200px",
                              position: "relative",
                              overflow: "hidden",
                              border: "1px solid #000",
                          }
                }
                className={fr.cx("fr-mb-1w", "fr-mt-1w")}
            >
                <Image
                    src={src}
                    placeholder={placeholderURL}
                    alt="Photo de profil de l'utilisateur"
                    fill={true}
                    onError={() => {}}
                    style={{ objectFit: "cover" }}
                />
            </div>
            <input
                type="file"
                accept="image/jpeg"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
            <ButtonsGroup buttons={buttons} inlineLayoutWhen="always" />
            {/* <input
        className="fr-upload"
        type="file"
        id="file-upload"
        name="file-upload"
    /> */}
        </div>
    );
};

export default UploadForm;
