import React from "react";

import { fr } from "@codegouvfr/react-dsfr";

const ProgressBar = ({ progress }) => {
    return (
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
                <span style={{ fontWeight: "bold" }}>{progress}%</span>
            </div>
        </div>
    );
};

export default ProgressBar;
