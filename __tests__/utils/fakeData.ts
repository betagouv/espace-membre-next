import { addDays, subDays } from "date-fns";
import { tableElements } from "juice";
import { Selectable } from "kysely/dist/cjs/util/column-type";

import { Incubators, Startups, Teams, UsersDomaineEnum } from "@/@types/db";
import { db } from "@/lib/kysely";
import { Domaine, EmailStatusCode } from "@/models/member";
import config from "@/server/config";

interface FakeDataIncubator {
    title?: string;
    ghid: string;
}

interface FakeDataStartup {
    name?: string;
    ghid: string;
    incubator?: string;
}

interface FakeDataMission {
    start: Date;
    end: Date;
    status?: string;
    employer?: string;
    startups?: string[];
}

interface FakeDataTeam {
    name?: string;
    ghid: string;
    incubator: string;
}

interface FakeDataUser {
    fullname?: string;
    github?: string;
    role?: string;
    username: string;
    secondary_email?: string;
    primary_email?: string;
    primary_email_status?: EmailStatusCode;
    domaine?: Domaine;
    missions: FakeDataMission[];
    teams?: string[];
}

export interface FakeDataInterface {
    users?: FakeDataUser[];
    startups?: FakeDataStartup[];
    incubators?: FakeDataIncubator[];
    teams?: FakeDataTeam[];
}

function checkNoReferenceToUndefinedData(data: FakeDataInterface) {
    for (const user of data.users || []) {
        for (const teamGhid of user.teams || []) {
            if (!data.teams?.map((t) => t.ghid).includes(teamGhid)) {
                throw new Error(
                    `Team ${teamGhid} is not defined in array teams in the data you provided`
                );
            }
        }
        for (const startupGhid of user.missions.flatMap(
            (m) => m.startups || []
        ) || []) {
            if (!data.startups?.map((s) => s.ghid).includes(startupGhid)) {
                throw new Error(
                    `Startup ${startupGhid} is not defined in array startups in the data you provided`
                );
            }
        }
    }
    for (const startup of data.startups || []) {
        const incubatorGhid = startup.incubator;
        if (
            incubatorGhid &&
            !data.incubators?.map((s) => s.ghid).includes(incubatorGhid)
        ) {
            throw new Error(
                `Incubator ${incubatorGhid} is not defined in array startups in the data you provided`
            );
        }
    }
    for (const team of data.teams || []) {
        const incubatorGhid = team.incubator;
        if (
            incubatorGhid &&
            !data.incubators?.map((s) => s.ghid).includes(incubatorGhid)
        ) {
            throw new Error(
                `Incubator ${incubatorGhid} is not defined in array startups in the data you provided`
            );
        }
    }
}

export async function createData(data: FakeDataInterface) {
    checkNoReferenceToUndefinedData(data);
    for (const user of data.users || []) {
        await createUser(user, data);
    }
    for (const startup of data.startups || []) {
        await createStartup(startup, data);
    }
    for (const incubator of data.incubators || []) {
        await createIncubator(incubator, data);
    }
    for (const team of data.teams || []) {
        await createTeam(team, data);
    }
}

export async function deleteData(data: FakeDataInterface) {
    if (data.users && data.users.length) {
        await db
            .deleteFrom("users")
            .where(
                "username",
                "in",
                data.users.map((user) => user.username)
            )
            .execute();
    }
    if (data.startups && data.startups.length) {
        await db
            .deleteFrom("startups")
            .where(
                "ghid",
                "in",
                data.startups.map((startup) => startup.ghid)
            )
            .execute();
    }
    if (data.incubators && data.incubators.length) {
        await db
            .deleteFrom("incubators")
            .where(
                "ghid",
                "in",
                data.incubators.map((incubator) => incubator.ghid)
            )
            .execute();
    }
    if (data.teams && data.teams.length) {
        await db
            .deleteFrom("teams")
            .where(
                "ghid",
                "in",
                data.teams.map((incubator) => incubator.ghid)
            )
            .execute();
    }
}

const createUser = async (
    originalData: FakeDataUser,
    data: FakeDataInterface
) => {
    const sixMinutesInMs: number = 6 * 1000 * 60;
    const dbUser = {
        username: originalData.username,
        fullname: originalData.fullname || originalData.username,
        primary_email:
            originalData.primary_email || originalData.primary_email === null
                ? originalData.primary_email
                : `${originalData.username}@${config.domain}`,
        primary_email_status_updated_at: new Date(Date.now() - sixMinutesInMs),
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        github: originalData.github,
        secondary_email: originalData.secondary_email,
        domaine: (originalData.domaine ||
            Domaine.ANIMATION) as UsersDomaineEnum,
        role: originalData.role || "",
    };
    const createdUser = await db
        .insertInto("users")
        .values(dbUser)
        .returningAll()
        .executeTakeFirstOrThrow();

    for (const mission of originalData.missions) {
        const insertedRow = await db
            .insertInto("missions")
            .values({
                start: mission.start,
                end: mission.end,
                employer: mission.employer,
                user_id: createdUser.uuid,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
        for (const startup of mission.startups || []) {
            // const insertedStartup = await createStartup(startup);
            const insertedStartup = await createStartup(
                data.startups!.find((s) => s.ghid === startup)!,
                data
            );
            await db
                .insertInto("missions_startups")
                .values({
                    mission_id: insertedRow.uuid,
                    startup_id: insertedStartup.uuid,
                })
                .execute();
        }
    }
    for (const team of originalData.teams || []) {
        // const insertedTeam = await createTeam(team);
        const insertedTeam = await createTeam(
            data.teams!.find((t) => t.ghid === team)!,
            data
        );
        await db
            .insertInto("users_teams")
            .values({
                user_id: createdUser.uuid,
                team_id: insertedTeam.uuid,
            })
            .executeTakeFirstOrThrow();
    }
};

function generateRandomString(): string {
    return Math.random().toString(36).substring(2, 11);
}

const createStartup = async function (
    startup: FakeDataStartup | string,
    data: FakeDataInterface
): Promise<Selectable<Startups>> {
    const startupData: FakeDataStartup =
        typeof startup === "string"
            ? {
                  ghid: startup,
                  name: startup,
              }
            : startup;
    const insertedStartup = await db
        .insertInto("startups")
        .values({
            ghid: startupData.ghid,
            name: startupData.name || startupData.ghid,
            mailing_list: `${startupData.name}`,
        })
        .onConflict((oc) => {
            return oc.column("ghid").doUpdateSet({
                name: startupData.name,
                mailing_list: `${startupData.name}`,
            });
        })
        .returningAll()
        .executeTakeFirstOrThrow();

    await db
        .insertInto("phases")
        .values({
            startup_id: insertedStartup.uuid,
            name: "acceleration",
            start: new Date(),
        })
        .onConflict((oc) => oc.doNothing())
        .execute();
    if (typeof startup !== "string" && startup.incubator) {
        const insertedIncubator = await createIncubator(
            data.incubators!.find((t) => t.ghid === startup.incubator)!,
            data
        );
        await db
            .updateTable("startups")
            .set({
                incubator_id: insertedIncubator.uuid,
            })
            .where("startups.uuid", "=", insertedStartup.uuid)
            .execute();
    }
    return insertedStartup;
};

const createIncubator = async function (
    incubator: FakeDataIncubator | string,
    data: FakeDataInterface
): Promise<Selectable<Incubators>> {
    const incubatorData: FakeDataIncubator =
        typeof incubator === "string"
            ? {
                  title: incubator,
                  ghid: incubator,
              }
            : incubator;
    const insertedIncubator = await db
        .insertInto("incubators")
        .values({
            title: incubatorData.title || incubatorData.ghid,
            ghid: incubatorData.ghid,
        })
        .onConflict((oc) =>
            oc.column("ghid").doUpdateSet({
                title: incubatorData.title || incubatorData.ghid,
                ghid: incubatorData.ghid,
            })
        )
        .returningAll()
        .executeTakeFirstOrThrow();

    return insertedIncubator;
};

const createTeam = async function (
    team: FakeDataTeam | string,
    data: FakeDataInterface
): Promise<Selectable<Teams>> {
    const teamData: FakeDataTeam =
        typeof team === "string"
            ? {
                  name: team,
                  ghid: team,
                  incubator: generateRandomString(),
              }
            : team;
    const insertedIncubator = await createIncubator(
        data.incubators!.find((t) => t.ghid === teamData.incubator)!,
        data
    );
    const insertedTeam = await db
        .insertInto("teams")
        .values({
            name: teamData.name || teamData.ghid,
            ghid: teamData.ghid,
            incubator_id: insertedIncubator.uuid,
        })
        .onConflict((oc) => {
            return oc.column("ghid").doUpdateSet({
                name: teamData.name,
                incubator_id: insertedIncubator.uuid,
            });
        })
        .returningAll()
        .executeTakeFirstOrThrow();

    return insertedTeam;
};
