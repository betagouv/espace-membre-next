"use client";
import { fr } from "@codegouvfr/react-dsfr";
import { PlaceholderValue } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";

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
        <div style={style}>
            {((src || placeholder) && (
                <Image
                    // @ts-ignore TODO: make TS happy
                    src={src || placeholder}
                    priority={false}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
