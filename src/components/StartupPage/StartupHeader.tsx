import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { fr } from "@codegouvfr/react-dsfr/fr";

import LastChange from "../LastChange";

import { StartupPageProps } from "./StartupPage";

export function StartupHeader({
    startupInfos,
    changes,
    incubator,
    sponsors,
}: Pick<
    StartupPageProps,
    "startupInfos" | "changes" | "incubator" | "sponsors"
>) {
    return (
        <>
            <div className={fr.cx("fr-col-12")}>
                <h1 className={fr.cx("fr-mb-0")}>
                    {startupInfos.name}
                    <Button
                        priority="secondary"
                        linkProps={{ href: `/startups/${startupInfos.uuid}` }}
                        style={{ float: "right" }}
                    >
                        Modifier la fiche
                    </Button>
                </h1>
                <div
                    className={fr.cx("fr-text--lg", "fr-text--bold")}
                    style={{
                        margin: 0,
                        color: "var(--text-action-high-blue-france)",
                    }}
                >
                    {startupInfos.pitch}
                </div>
            </div>
            <div className={fr.cx("fr-col-12")}>
                {startupInfos.link && (
                    <a target="_blank" href={startupInfos.link}>
                        {startupInfos.link}
                    </a>
                )}
                <LastChange
                    as="span"
                    style={{ marginLeft: 10 }}
                    changes={changes}
                />
            </div>
            <div className={fr.cx("fr-col-12")}>
                {incubator && (
                    <Tag
                        iconId="fr-icon-building-line"
                        className={fr.cx("fr-mr-1w")}
                    >
                        {incubator.title}
                    </Tag>
                )}
                {(sponsors?.length &&
                    sponsors.map((sponsor) => (
                        <Tag
                            key={sponsor.uuid}
                            iconId="fr-icon-money-euro-box-line"
                            className={fr.cx("fr-mr-1w")}
                        >
                            {sponsor.name}
                            {sponsor.acronym && ` (${sponsor.acronym})`}
                        </Tag>
                    ))) ||
                    null}
            </div>
            <div className={fr.cx("fr-col-12")}>
                {(startupInfos.usertypes?.length &&
                    startupInfos.usertypes.map((usertype) => (
                        <Tag
                            small
                            key={usertype}
                            iconId="fr-icon-user-line"
                            className={fr.cx("fr-mr-1w")}
                        >
                            {usertype}
                        </Tag>
                    ))) ||
                    null}
                {(startupInfos.thematiques?.length &&
                    startupInfos.thematiques.map((thematique) => (
                        <Tag
                            small
                            key={thematique}
                            iconId="fr-icon-file-line"
                            className={fr.cx("fr-mr-1w")}
                        >
                            {thematique}
                        </Tag>
                    ))) ||
                    null}
            </div>
            <div className={fr.cx("fr-col-12")}>
                <Button priority="secondary">Modifier la fiche</Button>
                <a
                    target="_blank"
                    className={fr.cx("fr-ml-2w")}
                    href={`https://beta.gouv.fr/startups/${startupInfos.ghid}`}
                >
                    Voir la fiche sur beta.gouv.fr
                </a>
            </div>
        </>
    );
}
