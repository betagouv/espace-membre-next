import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { match } from "ts-pattern";

import { EMAIL_PLAN_TYPE } from "@/models/ovh";

export const BadgeEmailPlan = ({ plan }: { plan: EMAIL_PLAN_TYPE }) => {
  return match(plan)
    .with(EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO, () => (
      <Badge small className={fr.cx("fr-ml-1w")} severity="info" as="span">
        OVH Pro
      </Badge>
    ))
    .with(EMAIL_PLAN_TYPE.EMAIL_PLAN_EXCHANGE, () => (
      <Badge small className={fr.cx("fr-ml-1w")} severity="info" as="span">
        OVH Exchange
      </Badge>
    ))
    .with(EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC, () => (
      <Badge small className={fr.cx("fr-ml-1w")} severity="info" as="span">
        OVH MX
      </Badge>
    ))
    .with(EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI, () => (
      <>
        <Badge small className={fr.cx("fr-ml-1w")} severity="info" as="span">
          Suite numérique
        </Badge>
        <a
          title="Envoyer un email à support-messagerie@mail.numerique.gouv.fr"
          href="mailto:support-messagerie@mail.numerique.gouv.fr"
          style={{ backgroundImage: "none" }}
        >
          <Badge
            small
            className={fr.cx("fr-ml-1w", "ri-question-fill")}
            severity="new"
            as="span"
          >
            Contacter le support par email
          </Badge>
        </a>
      </>
    ))
    .exhaustive();
};
