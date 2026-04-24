import { fr } from "@codegouvfr/react-dsfr/fr";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

import { BadgePhase } from "./BadgePhase";
import { StartupPageProps } from "./StartupPage";
import { StartupPhase } from "@/models/startup";
import Link from "next/link";
import { createSerializer } from "nuqs";
import { startupsQueryParser } from "../StartupListPage/utils";

const serialize = createSerializer({
  filters: startupsQueryParser,
});

export function StartupHeader({
  startupInfos,
  changes,
  incubator,
  sponsors,
  currentPhase,
}: Pick<
  StartupPageProps,
  "startupInfos" | "changes" | "incubator" | "sponsors"
> & { currentPhase: StartupPhase | null }) {
  return (
    <>
      <div className={fr.cx("fr-col-12")}>
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
        {currentPhase && (
          <BadgePhase phase={currentPhase} className={fr.cx("fr-mr-2w")} />
        )}
        {startupInfos.link && (
          <a
            target="_blank"
            href={startupInfos.link}
            className={fr.cx("fr-mr-2w")}
          >
            {startupInfos.link}
          </a>
        )}
      </div>
      <div className={fr.cx("fr-col-12")}>
        {incubator && (
          <Tag
            iconId="fr-icon-building-line"
            className={fr.cx("fr-mr-1w", "fr-mb-1w")}
            linkProps={{ href: `/incubators/${incubator.uuid}` }}
          >
            {incubator.title}
          </Tag>
        )}
        {(sponsors?.length &&
          sponsors.map((sponsor) => (
            <Tag
              key={sponsor.uuid}
              iconId="fr-icon-money-euro-box-line"
              className={fr.cx("fr-mr-1w", "fr-mb-1w")}
              linkProps={{
                href: `/organizations/${sponsor.uuid}`,
              }}
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
              key={usertype}
              linkProps={{
                href: `/startups/${serialize({
                  filters: [
                    {
                      type: "usertype",
                      value: usertype,
                    },
                  ],
                })}`,
              }}
              title={`Voir toutes les startups avec ces utilisateurs`}
              iconId="fr-icon-user-line"
              className={fr.cx("fr-mr-1w", "fr-mb-1w")}
            >
              {usertype}
            </Tag>
          ))) ||
          null}
        {(startupInfos.thematiques?.length &&
          startupInfos.thematiques.map((thematique) => (
            <Tag
              key={thematique}
              linkProps={{
                href: `/startups/${serialize({
                  filters: [
                    {
                      type: "thematique",
                      value: thematique,
                    },
                  ],
                })}`,
              }}
              iconId="fr-icon-file-line"
              title={`Voir toutes les startups avec cette thématique`}
              className={fr.cx("fr-mr-1w", "fr-mb-1w")}
            >
              {thematique}
            </Tag>
          ))) ||
          null}
      </div>
    </>
  );
}
