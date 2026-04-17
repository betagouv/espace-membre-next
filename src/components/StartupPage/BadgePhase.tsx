import { ReactElement } from "react";

import { Badge } from "@codegouvfr/react-dsfr/Badge";

import { PHASE_READABLE_NAME, StartupPhase } from "@/models/startup";

export const BadgePhase = ({
  phase,
  className,
}: {
  phase: string | null; //StartupPhase | null;
  className?: string;
}) => {
  const phases: Record<StartupPhase, ReactElement> = {
    investigation: (
      <Badge severity="new" className={className}>
        {PHASE_READABLE_NAME["investigation"]}
      </Badge>
    ),
    construction: (
      <Badge severity="info" className={className}>
        {PHASE_READABLE_NAME["construction"]}
      </Badge>
    ),
    acceleration: (
      <Badge severity="info" className={className}>
        {PHASE_READABLE_NAME["acceleration"]}
      </Badge>
    ),
    perennisation: (
      <Badge severity="success" className={className}>
        {PHASE_READABLE_NAME["perennisation"]}
      </Badge>
    ),
    transfere: (
      <Badge severity="success" className={className}>
        {PHASE_READABLE_NAME["transfere"]}
      </Badge>
    ),
    opere: (
      <Badge severity="success" className={className}>
        {PHASE_READABLE_NAME["opere"]}
      </Badge>
    ),
    abandon: (
      <Badge severity="warning" className={className}>
        {PHASE_READABLE_NAME["abandon"]}
      </Badge>
    ),
    "abandon-investigation": (
      <Badge severity="warning" className={className}>
        {PHASE_READABLE_NAME["abandon-investigation"]}
      </Badge>
    ),
  };
  return (phase && phases[phase]) || null;
};
