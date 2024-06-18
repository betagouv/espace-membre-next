import {
    PHASES_ORDERED_LIST,
    StartupPhase,
    phaseSchemaType,
} from "@/models/startup";

export const getCurrentPhase = (
    phases: phaseSchemaType[]
): StartupPhase | null => {
    if (!phases.length) {
        return null;
    }
    const sorted = phases.sort(
        (phaseA, phaseB) =>
            PHASES_ORDERED_LIST.indexOf(phaseB.name) -
            PHASES_ORDERED_LIST.indexOf(phaseA.name)
    );
    console.log("LCS PHASE", sorted[0]);
    return sorted[0].name;
};
