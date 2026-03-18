import { fr } from "@codegouvfr/react-dsfr/fr";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

import { BadgePhase } from "./BadgePhase";
import { StartupPageProps, StartupUrlRow } from "./StartupPage";
import { StartupPhase } from "@/models/startup";

export function StartupHeader({
  startupInfos,
  startupUrls,
  changes,
  incubator,
  sponsors,
  currentPhase,
}: Pick<
  StartupPageProps,
  "startupInfos" | "startupUrls" | "changes" | "incubator" | "sponsors"
> & { currentPhase: StartupPhase | null }) {
  const websiteUrl = startupUrls.find((u) => u.type === "website")?.url;
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
        <BadgePhase phase={currentPhase} className={fr.cx("fr-mr-2w")} />
        {websiteUrl && (
          <a
            target="_blank"
            href={websiteUrl}
            className={fr.cx("fr-mr-2w")}
          >
            {websiteUrl}
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
              small
              key={usertype}
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
              small
              key={thematique}
              iconId="fr-icon-file-line"
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
