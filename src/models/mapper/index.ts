import { Selectable } from "kysely";

import { BADGE_REQUEST, badgeRequestSchemaType } from "../badgeRequests";
import { incubatorSchemaType } from "../incubator";
import {
    Domaine,
    memberBaseInfoSchema,
    memberBaseInfoSchemaType,
    memberPublicInfoSchemaType,
    memberSchemaType,
} from "../member";
import { StartupPhase, phaseSchemaType, startupSchemaType } from "../startup";
import {
    BadgeRequests,
    Incubators,
    Missions,
    Phases,
    Users,
} from "@/@types/db";
import { getStartup } from "@/lib/kysely/queries";
import {
    getAllUsersInfo,
    getUserByStartup,
    getUserInfos,
} from "@/lib/kysely/queries/users";
import {
    CommunicationEmailCode,
    EmailStatusCode,
    GenderCode,
    LegalStatus,
    MemberType,
} from "@/models/member";

export function missionToModel(m: Selectable<Missions>) {
    return {
        ...m,
        start: typeof m.start === "string" ? new Date(m.start) : m.start,
        end: typeof m.end === "string" ? new Date(m.end) : m.end,
    };
}

export function memberBaseInfoToMemberPublicInfoModel(
    user: memberBaseInfoSchemaType
) {
    return {
        uuid: user.uuid,
        username: user.username,
        fullname: user.fullname,
        role: user.role,
        domaine: user.domaine,
        bio: user.bio,
        link: user.link,
        github: user.github,
        missions: user.missions,
        primary_email_status: user.primary_email_status,
    };
}

export function memberPublicInfoToModel(
    user: Awaited<ReturnType<typeof getAllUsersInfo>>[0]
): memberPublicInfoSchemaType {
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
        uuid: user.uuid,
        username: user.username,
        fullname: user.fullname,
        role: user.role,
        domaine: user.domaine as Domaine,
        bio: user.bio,
        link: user.link,
        github: user.github,
        missions: (user?.missions || []).map((mission) =>
            missionToModel(mission)
        ),
        // primary_email: true,
        primary_email_status: user.primary_email_status as EmailStatusCode,
    };
}

export function phaseToModel(phase: Selectable<Phases>): phaseSchemaType {
    return {
        uuid: phase.uuid,
        end: phase.end,
        start: phase.start,
        comment: phase.comment,
        startup_id: phase.startup_id,
        name: phase.name as StartupPhase,
    };
}

export function memberBaseInfoToModel(
    user:
        | Awaited<ReturnType<typeof getAllUsersInfo>>[0]
        | Awaited<ReturnType<typeof getUserByStartup>>[0]
): memberBaseInfoSchemaType {
    if (!user) {
        throw new Error("No users");
    }
    return {
        uuid: user.uuid,
        username: user.username,
        fullname: user.fullname,
        role: user.role,
        domaine: user.domaine as Domaine,
        bio: user.bio,
        link: user.link,
        github: user.github,
        primary_email: user.primary_email,
        updated_at: user.updated_at,
        communication_email:
            user.communication_email === CommunicationEmailCode.SECONDARY
                ? CommunicationEmailCode.SECONDARY
                : CommunicationEmailCode.PRIMARY,
        secondary_email: user.secondary_email || "",
        primary_email_status:
            memberBaseInfoSchema.shape.primary_email_status.parse(
                user.primary_email_status || EmailStatusCode.EMAIL_UNSET
            ),
        memberType: user.member_type
            ? (user.member_type as MemberType)
            : undefined,
        primary_email_status_updated_at: user.primary_email_status_updated_at!,
        email_is_redirection: user.email_is_redirection || false,
        missions: user.missions.map((m) => missionToModel(m)),
        competences: (user.competences ? user.competences : []) as string[],
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
        competences: (user.competences ? user.competences : []) as string[],
        email_is_redirection: user.email_is_redirection || false,
        communication_email:
            user.communication_email === CommunicationEmailCode.SECONDARY
                ? CommunicationEmailCode.SECONDARY
                : CommunicationEmailCode.PRIMARY,
        primary_email_status_updated_at:
            user.primary_email_status_updated_at || new Date(),
        // @ts-ignore todo
        missions: (user?.missions || []).map((mission) =>
            missionToModel(mission)
        ),
    };
}

export function startupToModel(
    startup: Awaited<ReturnType<typeof getStartup>>
): startupSchemaType {
    if (!startup) {
        throw new Error("No startups");
    }
    return {
        ...startup,
        mailing_list: startup.mailing_list || undefined,
        contact: startup.contact || "",
        incubator_id: startup.incubator_id as string,
        description: startup.description || "",
        pitch: startup.pitch || "",
        techno: (startup.techno && Array.isArray(startup.techno)
            ? startup.techno
            : []) as string[],
        thematiques: (startup.thematiques && Array.isArray(startup.thematiques)
            ? startup.thematiques
            : []) as string[],
        usertypes: (startup.usertypes && Array.isArray(startup.usertypes)
            ? startup.usertypes
            : []) as string[],
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

export function incubatorToModel(
    incubator: Selectable<Incubators>
): incubatorSchemaType {
    return {
        uuid: incubator.uuid,
        title: incubator.title,
        owner_id: incubator.owner_id || "",
        contact: incubator.contact || "",
        ghid: incubator.ghid || "",
        address: incubator.address,
        website: incubator.website || "",
        github: incubator.github || "",
        description: incubator.description || "",
        short_description: incubator.short_description || "",
    };
}
