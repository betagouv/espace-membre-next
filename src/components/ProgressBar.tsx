import React from "react";

import { fr } from "@codegouvfr/react-dsfr";

type ProgressBarProps = {
    progress: number;
} & React.HTMLAttributes<HTMLElement>; // or HTMLDivElement or whatever you use

const ProgressBar = ({ progress, className, style }: ProgressBarProps) => {
    return (
        <div className={className} style={style}>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-11")}>
                    <div
                        style={{
                            width: "100%",
                            height: "20px",
                            backgroundColor: "#eee",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: `${progress}%`,
                                height: "100%",
                                backgroundColor:
                                    "var(--text-action-high-blue-france)",
                                transition: "width 0.3s ease",
                            }}
                        />
                    </div>
                </div>
                <div className={fr.cx("fr-col-1")}>
                    <span style={{ fontWeight: "bold" }}>
                        {progress.toFixed(1)}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProgressBar;
