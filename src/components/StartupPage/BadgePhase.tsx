import { ReactElement } from "react";

import { Badge } from "@codegouvfr/react-dsfr/Badge";

import { StartupPhase } from "@/models/startup";

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
                Investigation
            </Badge>
        ),
        construction: (
            <Badge severity="info" className={className}>
                Construction
            </Badge>
        ),
        acceleration: (
            <Badge severity="info" className={className}>
                Accéleration
            </Badge>
        ),
        transfer: (
            <Badge severity="success" className={className}>
                Transféré
            </Badge>
        ),
        success: (
            <Badge severity="success" className={className}>
                Succès
            </Badge>
        ),
        alumni: (
            <Badge severity="warning" className={className}>
                Abandon
            </Badge>
        ),
    };
    return (phase && phases[phase]) || null;
};
