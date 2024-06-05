import {
    CommunicationEmailCode,
    EmailStatusCode,
    GenderCode,
    LegalStatus,
} from "../dbUser";
import {
    Domaine,
    memberPublicInfoSchema,
    memberPublicInfoSchemaType,
    memberSchemaType,
} from "../member";
import { startupSchemaType } from "../startup";
import { getStartup } from "@/lib/kysely/queries";
import { getAllUsersInfo, getUserInfos } from "@/lib/kysely/queries/users";

export function publicUserInfosToModel(
    user: Awaited<ReturnType<typeof getAllUsersInfo>>[0]
): memberPublicInfoSchemaType {
    if (!user) {
        throw new Error("No users");
    }
    return {
        ...user,
        communication_email:
            user.communication_email === CommunicationEmailCode.SECONDARY
                ? CommunicationEmailCode.SECONDARY
                : CommunicationEmailCode.PRIMARY,
        secondary_email: user.secondary_email || "",
        primary_email_status:
            memberPublicInfoSchema.shape.primary_email_status.parse(
                user.primary_email_status
            ),
        username: user?.username || "",
        domaine: user.domaine as Domaine,
        missions: user.missions,
    };
}

export function userInfosToModel(
    user: Awaited<ReturnType<typeof getUserInfos>>
): memberSchemaType {
    if (!user) {
        throw new Error("No users");
    }
    return {
        ...user,
        username: user?.username || "",
        domaine: user.domaine as Domaine,
        primary_email_status: user.primary_email_status as EmailStatusCode,
        secondary_email: user.secondary_email || "",
        gender: user.gender as GenderCode,
        legal_status: user.legal_status as LegalStatus,
        competences: user.competences ? [user.competences.toString()] : [],
        communication_email:
            user.communication_email === CommunicationEmailCode.SECONDARY
                ? CommunicationEmailCode.SECONDARY
                : CommunicationEmailCode.PRIMARY,
        primary_email_status_updated_at:
            user.primary_email_status_updated_at || new Date(),
        missions: (user?.missions || []).map((mission) => ({
            ...mission,
        })),
    };
}

export function startupToModel(
    startup: Awaited<ReturnType<typeof getStartup>>
): startupSchemaType {
    if (!startup) {
        throw new Error("No users");
    }
    return {
        ...startup,
        mailing_list: startup.mailing_list || undefined,
        contact: startup.contact || "",
        incubator_id: startup.incubator_id || "",
        description: startup.description || "",
        pitch: startup.pitch || "",
        techno: startup.techno ? [startup.techno?.toString()] : [],
        thematiques: startup.thematiques
            ? [startup.thematiques?.toString()]
            : [],
        usertypes: startup.usertypes ? [startup.usertypes?.toString()] : [],
        repository: startup.repository || undefined,
    };
}
