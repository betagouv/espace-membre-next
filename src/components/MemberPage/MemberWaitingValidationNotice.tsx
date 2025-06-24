import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";

import { MemberPageProps } from "./MemberPage";
import { getLastMissionDate } from "@/utils/member";
import { getUserIncubators } from "@/lib/kysely/queries/users";
import Link from "next/link";

export const MemberWaitingValidationNotice = ({
  userInfos,
  canValidate,
  incubators,
}: {
  userInfos: MemberPageProps["userInfos"];
  canValidate: boolean;
  incubators: Awaited<ReturnType<typeof getUserIncubators>>;
}) => (
  <Alert
    className={fr.cx("fr-mt-2w", "fr-mb-2w")}
    title={`Fiche en attente de validation`}
    severity="warning"
    description={
      <p>
        <p>
          La fiche de {userInfos.fullname} doit être validée par l'équipe de son
          incubateur :{" "}
          {incubators.map((incubator, idx, all) => (
            <>
              <Link
                key={incubator.title}
                href={`/incubators/${incubator.uuid}`}
              >
                {incubator.title}
              </Link>
              {idx < all.length - 1 ? ", " : ""}
            </>
          ))}
          .
        </p>
        {canValidate && (
          <>
            <br />
            <Button
              linkProps={{
                href: `/community/${userInfos.username}/validate`,
              }}
            >
              Valider la fiche de {userInfos.fullname}
            </Button>
          </>
        )}
      </p>
    }
  />
);
