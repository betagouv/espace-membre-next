import { match } from "ts-pattern";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { PHASE_READABLE_NAME, StartupPhase } from "@/models/startup";
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
  phase: string;
  className?: string;
}) => {
  const severity = match(phase as StartupPhase)
    .with(StartupPhase.PHASE_INVESTIGATION, () => "info" as AlertProps.Severity)
    .with(StartupPhase.PHASE_CONSTRUCTION, () => "info" as AlertProps.Severity)
    .with(StartupPhase.PHASE_ACCELERATION, () => "info" as AlertProps.Severity)
    .with(StartupPhase.PHASE_PERENNISATION, () => "info" as AlertProps.Severity)
    .with(StartupPhase.PHASE_TRANSFERE, () => "success" as AlertProps.Severity)
    .with(StartupPhase.PHASE_OPERE, () => "success" as AlertProps.Severity)
    .with(StartupPhase.PHASE_ABANDON, () => "warning" as AlertProps.Severity)
    .with(
      StartupPhase.PHASE_ABANDON_INVESTIGATION,
      () => "warning" as AlertProps.Severity,
    )
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
