import { Selectable } from "kysely";

import { BADGE_REQUEST, badgeRequestSchemaType } from "../badgeRequests";
import {
    CommunicationEmailCode,
    EmailStatusCode,
    GenderCode,
    LegalStatus,
    MemberType,
} from "../dbUser";
import {
    Domaine,
    memberBaseInfoSchema,
    memberBaseInfoSchemaType,
    memberPublicInfoSchemaType,
    memberSchemaType,
} from "../member";
import { startupSchemaType } from "../startup";
import { BadgeRequests } from "@/@types/db";
import { getStartup } from "@/lib/kysely/queries";
import { getAllUsersInfo, getUserInfos } from "@/lib/kysely/queries/users";

export function memberPublicInfoToModel(user: any): memberPublicInfoSchemaType {
    if (!user) {
        throw new Error("No users");
    }
    return {
        // ...user,
        // communication_email:
        //     user.communication_email === CommunicationEmailCode.SECONDARY
        //         ? CommunicationEmailCode.SECONDARY
        //         : CommunicationEmailCode.PRIMARY,
        // secondary_email: user.secondary_email || "",
        // primary_email_status:
        //     memberBaseInfoSchema.shape.primary_email_status.parse(
        //         user.primary_email_status
        //     ),
        // username: user?.username || "",
        // domaine: user.domaine as Domaine,
        // missions: user.missions,
        //
        username: user.username,
        fullname: user.fullname,
        role: user.role,
        domaine: user.domaine as Domaine,
        bio: user.bio,
        link: user.link,
        github: user.github,
        missions: user.missions,
        // primary_email: true,
        primary_email_status: user.primary_email_status,
    };
}

export function memberBaseInfoToModel(
    user: Awaited<ReturnType<typeof getAllUsersInfo>>[0]
): memberBaseInfoSchemaType {
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
            memberBaseInfoSchema.shape.primary_email_status.parse(
                user.primary_email_status
            ),
        memberType: user.member_type
            ? (user.member_type as MemberType)
            : undefined,
        primary_email_status_updated_at: user.primary_email_status_updated_at!,
        email_is_redirection: user.email_is_redirection || false,
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
        email_is_redirection: user.email_is_redirection || false,
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

export function badgeRequestToModel(
    badgeRequest: Selectable<BadgeRequests>
): badgeRequestSchemaType {
    return {
        ...badgeRequest,
        dossier_number: badgeRequest.dossier_number as unknown as number,
        ds_token: badgeRequest.ds_token!,
        status: badgeRequest.status as BADGE_REQUEST,
        id: badgeRequest.id as unknown as number,
        end_date: badgeRequest.end_date as unknown as Date,
        start_date: badgeRequest.start_date as unknown as Date,
        updated_at: badgeRequest.updated_at as unknown as Date,
        created_at: badgeRequest.created_at as unknown as Date,
    };
}
