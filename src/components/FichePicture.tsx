import { fr } from "@codegouvfr/react-dsfr";
import { PlaceholderValue } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";

export const defaultPlaceholder =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQACWAJYAAD/2wCEAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDIBCQkJDAsMGA0NGDIhHCEyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMv/CABEIAMgAyAMBIgACEQEDEQH/xAAtAAEAAwEBAQAAAAAAAAAAAAAAAwQFAgEHAQEBAAAAAAAAAAAAAAAAAAAAAf/aAAwDAQACEAMQAAAA+vCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8zS9UpCz1UGjbw5TYcdgAAAAAAAGbU98oAAC1p42zAAAAAAACOSMxhQAAHW3hbsAAAAAAAIpapmCgAAPdnF1onAAAAAAAhm8MNNDQAADaztSAAAAAAAAKmbuY5GKAEpozkAAAAAAAAM3QyiEUAt1JzWc9QAAAAAAIyTmjUPeCgAAO9jE6jbZ9wkAAAITqnT8JYigAAAAAAJbFIbMmHrRMBlhWFAAAAAAAAALJGoD//xAA1EAACAQEFBQUHAwUAAAAAAAABAgMRAAQhMDEFEjJAURMgM2FxEBQiQVJygZGhwUJicJKx/9oACAEBAAE/AP8AEEt5ihwZqt9I1s+0WJ+BAPXG3v8AP1X/AFsu0JRqqH8Usm0UPGjL6Y2BBAI0PJM6opZiAo1JtPfHkJCEqn7nvQ3iSA/Car9J0tFKs0YZfyOnI3+UtN2dcFGnnkXBys+5XBhyBNASdBjZ2LuWOpNciBit4jI+ochOaXeT7Tkod2RW6EHkJxW7yD+05Q0z55ViiJetDhhkilRXS0Uiyxh1rQ9c+/it3B6MMq5il1Tzqf3z70u/dnHQV/TKiXchRegz2UMpU6EUNrxd/d2Ub28DphkXa69uN4mig/ryO0E3oVcf0n/uRdI+zuyg6n4j+eRZQ6lW0IobTRGGUocaaHqO9d4u2mCnh1Ppye0fHT7f572zvHf7f55J3SNauwUedr1KJpt5eECg711lEM4ZuEihskiSLVGDDy5CSRIl3nYAWkdpJCzEnHCuRG7RyBlJGONLRyJKu8jAjNknii43APQYm0u0CaiJaeZszs7bzMSepyldkbeViD1FotoEUEq18xaOeKXgcE9DgciWeOEVdvQDU2faLHw0A82xs95mk4nNOgw5BLzNHwuadDjZNosPEQHzXC0U8cwqjeoOo7l5n7COoxc4KLMzOxZiSTqTyisyMGUkEaEWu0/bx1ODjBh7b8xa8kfJQBy1xYreQPkwI9n/xAAUEQEAAAAAAAAAAAAAAAAAAABw/9oACAECAQE/ACn/xAAUEQEAAAAAAAAAAAAAAAAAAABw/9oACAEDAQE/ACn/2Q==";

export const FichePicture = ({
    src,
    onLoad,
    alt = "Photo de profil de l'utilisateur",
    shape = "round",
    size = "large",
    placeholder,
    initials,
}: {
    src?: string;
    alt?: string;
    onLoad?: any;
    size?: "small" | "large";
    shape?: "round" | "rectangle";
    placeholder?: PlaceholderValue;
    initials?: string;
}) => {
    const style: React.CSSProperties =
        shape === "round"
            ? {
                  width: size === "small" ? "100px" : "200px",
                  height: size === "small" ? "100px" : "200px",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "50%",
                  margin: "0 auto",
                  background:
                      fr.colors.decisions.background.disabled.grey.default,
              }
            : {
                  width: size === "small" ? "178px" : "356px",
                  height: size === "small" ? "100px" : "200px",
                  position: "relative",
                  overflow: "hidden",
                  border: "1px solid #000",
                  margin: "0 auto",
                  background:
                      fr.colors.decisions.background.disabled.grey.default,
              };

    return (
        <div style={style} className={fr.cx("fr-mb-1w", "fr-mt-1w")}>
            {((src || placeholder) && (
                <Image
                    // @ts-ignore TODO: make TS happy
                    src={src || placeholder}
                    placeholder={placeholder}
                    alt={alt}
                    fill={true}
                    onLoad={onLoad}
                    style={{ objectFit: "cover" }}
                />
            )) ||
                (initials && (
                    <div style={{ lineHeight: "200%", fontSize: "3rem" }}>
                        {initials}
                    </div>
                ))}
        </div>
    );
};
