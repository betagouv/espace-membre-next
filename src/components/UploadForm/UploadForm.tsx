import { useState, useRef } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Image from "next/image";

const placeholderURL =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQACWAJYAAD/2wCEAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDIBCQkJDAsMGA0NGDIhHCEyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMv/CABEIAMgAyAMBIgACEQEDEQH/xAAtAAEAAwEBAQAAAAAAAAAAAAAAAwQFAgEHAQEBAAAAAAAAAAAAAAAAAAAAAf/aAAwDAQACEAMQAAAA+vCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8zS9UpCz1UGjbw5TYcdgAAAAAAAGbU98oAAC1p42zAAAAAAACOSMxhQAAHW3hbsAAAAAAAIpapmCgAAPdnF1onAAAAAAAhm8MNNDQAADaztSAAAAAAAAKmbuY5GKAEpozkAAAAAAAAM3QyiEUAt1JzWc9QAAAAAAIyTmjUPeCgAAO9jE6jbZ9wkAAAITqnT8JYigAAAAAAJbFIbMmHrRMBlhWFAAAAAAAAALJGoD//xAA1EAACAQEFBQUHAwUAAAAAAAABAgMRAAQhMDEFEjJAURMgM2FxEBQiQVJygZGhwUJicJKx/9oACAEBAAE/AP8AEEt5ihwZqt9I1s+0WJ+BAPXG3v8AP1X/AFsu0JRqqH8Usm0UPGjL6Y2BBAI0PJM6opZiAo1JtPfHkJCEqn7nvQ3iSA/Car9J0tFKs0YZfyOnI3+UtN2dcFGnnkXBys+5XBhyBNASdBjZ2LuWOpNciBit4jI+ochOaXeT7Tkod2RW6EHkJxW7yD+05Q0z55ViiJetDhhkilRXS0Uiyxh1rQ9c+/it3B6MMq5il1Tzqf3z70u/dnHQV/TKiXchRegz2UMpU6EUNrxd/d2Ub28DphkXa69uN4mig/ryO0E3oVcf0n/uRdI+zuyg6n4j+eRZQ6lW0IobTRGGUocaaHqO9d4u2mCnh1Ppye0fHT7f572zvHf7f55J3SNauwUedr1KJpt5eECg711lEM4ZuEihskiSLVGDDy5CSRIl3nYAWkdpJCzEnHCuRG7RyBlJGONLRyJKu8jAjNknii43APQYm0u0CaiJaeZszs7bzMSepyldkbeViD1FotoEUEq18xaOeKXgcE9DgciWeOEVdvQDU2faLHw0A82xs95mk4nNOgw5BLzNHwuadDjZNosPEQHzXC0U8cwqjeoOo7l5n7COoxc4KLMzOxZiSTqTyisyMGUkEaEWu0/bx1ODjBh7b8xa8kfJQBy1xYreQPkwI9n/xAAUEQEAAAAAAAAAAAAAAAAAAABw/9oACAECAQE/ACn/xAAUEQEAAAAAAAAAAAAAAAAAAABw/9oACAEDAQE/ACn/2Q==";

const UploadForm = ({ url, onChange, onDelete }) => {
    const [image, setImage] = useState<File | null>(null); // Use union type File | null

    const [shouldDeletePicture, setShouldDeletePicture] =
        useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        if (fileInputRef && fileInputRef.current) {
            fileInputRef.current.click();
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

    let src = placeholderURL;
    if (image) {
        src = URL.createObjectURL(image);
    } else if (url) {
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
                Photo de profile
            </label>
            <div
                style={{
                    width: "200px",
                    height: "200px",
                    position: "relative",
                    borderRadius: "50%",
                    overflow: "hidden",
                }}
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

            <span className="fr-hint-text fr-mb-1w">
                Taille maximale : 500 Mo. Format supporté : jpg. Plusieurs
                fichiers possibles. Lorem ipsum dolor sit amet, consectetur
                adipiscing.
            </span>
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(event) => {
                    const file = event.target.files;
                    if (file && file.length) {
                        setImage(file[0]);
                        setShouldDeletePicture(false);
                    }
                    onChange(event);
                }}
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
