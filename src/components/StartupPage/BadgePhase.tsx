import { Badge } from "@codegouvfr/react-dsfr/Badge";

import { PHASE_READABLE_NAME } from "@/models/startup";
import { match } from "ts-pattern";
import { AlertProps } from "@codegouvfr/react-dsfr/Alert";

const readablePhases = Object.entries(PHASE_READABLE_NAME).map(
  ([id, label]) => ({
    id,
    label,
  }),
);

export const BadgePhase = ({
  phase,
  className,
}: {
  phase: keyof typeof PHASE_READABLE_NAME;
  className?: string;
}) => {
  const severity = match(phase)
    .with("investigation", () => "new" as AlertProps.Severity)
    .with("construction", () => "info" as AlertProps.Severity)
    .with("acceleration", () => "info" as AlertProps.Severity)
    .with("transfer", () => "success" as AlertProps.Severity)
    .with("success", () => "success" as AlertProps.Severity)
    .with("alumni", () => "warning" as AlertProps.Severity)
    .exhaustive();
  const readablePhase = readablePhases.find((p) => p.id === phase);
  return (
    readablePhase && (
      <Badge severity={severity} className={className}>
        {readablePhase.label}
      </Badge>
    )
  );
};
