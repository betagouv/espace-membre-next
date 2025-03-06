"use client";
import { useEffect, useState } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { format } from "date-fns/format";
import { PlaceholderValue } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";

function isRelativeUrl(url) {
    const absolutePattern = /^(?:[a-zA-Z][a-zA-Z\d+\-.]*:|\/\/)/;
    return !absolutePattern.test(url);
}

const computeVersion = () => {
    const version = format(new Date(), "yyyyMMdd'T'HHmmss");
    return version;
};

function isBase64(src: string): boolean {
    return /^data:image\/[a-z]+;base64,/.test(src);
}

function addVersionParam(url: string): string {
    if (typeof window === "undefined") {
        return url;
    }
    // when window is define window.location.origin exists
    const isRelative = isRelativeUrl(url);
    const tempUrl = isRelative
        ? new URL(url, window.location.origin)
        : new URL(url);
    const params = tempUrl.searchParams;
    const version = computeVersion();
    params.set("v", version);
    return isRelative ? tempUrl.pathname + tempUrl.search : tempUrl.toString();
}

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
    const [versionedUrl, setVersionedUrl] = useState<string | null>(null);
    useEffect(() => {
        // apply addVersion only in front : prevent hydratation mismatch
        if (src && !isBase64(src)) {
            setVersionedUrl(addVersionParam(src));
        } else {
            setVersionedUrl(null);
        }
    }, [src]);
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
                    src={versionedUrl || src || placeholder}
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
