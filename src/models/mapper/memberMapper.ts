import { Selectable } from "kysely";

import { Missions } from "@/@types/db";
import {
    getAllUsersInfo,
    getUserByStartup,
    getUserInfos,
} from "@/lib/kysely/queries/users";
import {
    Domaine,
    memberBaseInfoSchema,
    memberBaseInfoSchemaType,
    memberSchemaType,
} from "@/models/member";
import {
    CommunicationEmailCode,
    EmailStatusCode,
    GenderCode,
    LegalStatus,
    MemberType,
} from "@/models/member";

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
) {
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
        missions: user?.missions || [],
        teams: user?.teams || [],
        //.map((mission) =>
        //     missionToModel(mission)
        // ),
        // primary_email: true,
        primary_email_status: user.primary_email_status as EmailStatusCode,
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
        teams: user.teams,
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
        workplace_insee_code: user.workplace_insee_code,
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

export function missionToModel(m: Selectable<Missions>) {
    return {
        ...m,
        start: typeof m.start === "string" ? new Date(m.start) : m.start,
        end: typeof m.end === "string" ? new Date(m.end) : m.end,
    };
}
