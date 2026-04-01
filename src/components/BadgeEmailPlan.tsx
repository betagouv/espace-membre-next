import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";

import { EMAIL_PLAN_TYPE } from "@/models/member";

export const BadgeEmailPlan = ({ plan }: { plan: EMAIL_PLAN_TYPE }) => {
  return (
    <Badge small className={fr.cx("fr-ml-1w")} severity="info" as="span">
      Suite numérique
    </Badge>
  );
};
