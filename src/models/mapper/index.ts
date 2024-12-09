import { Selectable } from "kysely";

import { BADGE_REQUEST, badgeRequestSchemaType } from "../badgeRequests";
import { incubatorSchemaType } from "../incubator";
import { PrivateMemberChangeSchemaType } from "../memberChange";
import {
    SponsorDomaineMinisteriel,
    sponsorSchemaType,
    SponsorType,
} from "../sponsor";
import {
    StartupPhase,
    eventSchemaType,
    phaseSchemaType,
    startupSchemaType,
} from "../startup";
import { teamSchemaType } from "../team";
import {
    BadgeRequests,
    Events,
    Incubators,
    Missions,
    Organizations,
    Phases,
    StartupEvents,
    Teams,
} from "@/@types/db";
import { getStartup } from "@/lib/kysely/queries";

export * from "./memberMapper";

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
        highlighted_startups: incubator.highlighted_startups || [],
    };
}

export function organizationToModel(
    organization: Selectable<Organizations>
): sponsorSchemaType {
    return {
        uuid: organization.uuid,
        ghid: organization.ghid as string,
        name: organization.name,
        acronym: organization.acronym as string,
        domaine_ministeriel:
            organization.domaine_ministeriel as SponsorDomaineMinisteriel,
        type: organization.type as SponsorType,
    };
}

export function teamToModel(team: Selectable<Teams>): teamSchemaType {
    return {
        uuid: team.uuid,
        name: team.name,
        ghid: team.ghid || "",
        mission: team.mission,
        incubator_id: team.incubator_id,
    };
}

export function memberChangeToModel(
    memberChange: Selectable<Events>
): PrivateMemberChangeSchemaType {
    return {
        created_at: memberChange.created_at,
        created_by_username: memberChange.created_by_username,
    };
}

export function startupChangeToModel(
    memberChange: Selectable<Events>
): PrivateMemberChangeSchemaType {
    return {
        created_at: memberChange.created_at,
        created_by_username: memberChange.created_by_username,
    };
}

export function startupEventToModel(
    startupEvent: Selectable<StartupEvents>
): eventSchemaType {
    return {
        ...startupEvent,
        startup_id: startupEvent.startup_id as string,
        name: startupEvent.name as eventSchemaType["name"],
    };
}
