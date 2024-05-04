import { equal } from "assert";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ExpressionBuilder } from "kysely";
import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";
import { db, sql, jsonArrayFrom } from "@/lib/kysely";
import { memberSchema } from "@/models/member";
import { DBStartup } from "@/models/startup";
import { getAllStartups } from "@/server/db/dbStartup";
import { getDBUserAndMission } from "@/server/db/dbUser";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";
import { UUID } from "crypto";
import { DB } from "@/@types/db";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

function withMissionStartups(eb: ExpressionBuilder<DB, "missions">) {
    return jsonArrayFrom(
        eb
            .selectFrom("startups")
            .leftJoin(
                "missions_startups",
                "missions_startups.startup_id",
                "startups.uuid"
            )
            .leftJoin(
                "missions as missions2",
                "missions.uuid",
                "missions_startups.mission_id"
            )
            .select(["startups.uuid", "startups.id", "startups.name"])
            .whereRef("missions2.uuid", "=", "missions.uuid")
            .orderBy("startups.id")
    ).as("startups");
}

function withMissions(eb: ExpressionBuilder<DB, "users">) {
    return jsonArrayFrom(
        eb
            .selectFrom("missions")
            .select((eb2) => [
                "missions.uuid",
                "missions.start",
                "missions.end",
                "missions.employer",
                "missions.role",
                "missions.status",
                withMissionStartups(eb2),
            ])
            .whereRef("missions.user_id", "=", "users.uuid")
            .orderBy("missions.start")
    ).as("missions");
}

function withEndDate(eb: ExpressionBuilder<DB, "users">) {
    return eb
        .selectFrom("missions")
        .select((eb2) => [
            sql`(SELECT CASE 
                    WHEN max(missions.start) > MAX(missions.end) THEN 
                        NULL
                    ELSE
                        MAX(missions.end) 
                    END
                    from missions where missions.end IS NOT NULL and missions.user_id=users.uuid)`.as(
                "end"
            ),
        ])
        .limit(1)
        .as("end");
}

async function getUserBaseInfo(username: string) {
    const query = db
        .selectFrom("users")
        .select((eb) => [
            "users.username",
            "users.fullname",
            "users.role",
            "users.domaine",
            "users.primary_email",
            "users.secondary_email",
            // aggregate missions and startups
            withMissions(eb),
            // compute end date
            withEndDate(eb),
        ])
        .where("users.username", "=", username)
        .compile();

    console.log(query);
    const userInfos = await db.executeQuery(query);
    return userInfos.rows.length && userInfos.rows[0];
}

export default async function Page() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }
    const username = session.user.id;
    const formData = await getUserBaseInfo(username);

    console.log("infos", JSON.stringify(formData, null, 2));
    //const authorPR = await getPullRequestForBranch(`edit-authors-${username}`);

    //    const sha = authorPR && authorPR.head.sha;
    // const formData = await getDBUserAndMission(username); // fetchGithubPageData(username, sha || "master");
    const startups: DBStartup[] = await getAllStartups();
    const startupOptions = startups.map((startup) => ({
        value: startup.uuid,
        label: startup.name,
    }));
    if (!formData) {
        redirect("/errors");
    }

    const props = {
        formData: {
            ...formData,
            // missions:
            //     formData.missions &&
            //     formData.missions.length &&
            //     formData.missions.map((m) => ({
            //         ...m,
            //         startups: m.startups.map((s) => s.uuid),
            //     })),
            //startups: formData.startups || [],
        },
        startupOptions,
        //  updatePullRequest: authorPR,
    };
    //console.log(props.formData);

    return <BaseInfoUpdate {...props} />;
}
