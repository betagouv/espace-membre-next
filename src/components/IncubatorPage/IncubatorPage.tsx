"use client";

import Button from "@codegouvfr/react-dsfr/Button";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import { incubatorSchemaType } from "@/models/incubator";

export interface IncubatorPageProps {
    incubatorInfos: incubatorSchemaType;
}

export default function IncubatorPage({ incubatorInfos }: IncubatorPageProps) {
    return (
        <>
            <BreadCrumbFiller
                currentPage={incubatorInfos.title}
            ></BreadCrumbFiller>

            <div className="fr-mb-8v">
                <h1>{incubatorInfos.title}</h1>
                <p>
                    <span>
                        Fiche GitHub :{" "}
                        <a
                            className="fr-link"
                            target="_blank"
                            href={`https://github.com/betagouv/beta.gouv.fr/blob/master/content/_incubators/${incubatorInfos.ghid}.md`}
                        >
                            {incubatorInfos.title}
                        </a>
                    </span>
                    <br />
                    <span>
                        Repository :{" "}
                        {incubatorInfos.github ? (
                            <a
                                className="fr-link"
                                target="_blank"
                                href={incubatorInfos.github}
                            >
                                {incubatorInfos.github}
                            </a>
                        ) : (
                            "Non renseigné"
                        )}
                    </span>
                    <br />
                    <span>
                        Contact :{" "}
                        {incubatorInfos.contact && (
                            <a href={`mailto:${incubatorInfos.contact}`}>
                                {incubatorInfos.contact}
                            </a>
                        )}
                    </span>
                    <br />
                </p>
                <p className="fr-text--sm" style={{ fontStyle: "italic" }}>
                    Une information n'est pas à jour ?
                </p>
                <Button
                    linkProps={{
                        href: `/incubators/${incubatorInfos.uuid}/info-form`,
                    }}
                >
                    ✏️ Mettre à jour les infos
                </Button>
            </div>
        </>
    );
}
