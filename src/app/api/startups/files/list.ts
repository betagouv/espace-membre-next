"use server";

import { ExpressionWrapper } from "kysely";
import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { authOptions } from "@/utils/authoptions";

const commonFileFields = [
    "startups_files.title",
    "startups_files.uuid",
    "startups_files.size",
    "startups_files.comments",
    "startups_files.created_at",
    "startups_files.type",
    "startups_files.data",
] as const;

export async function getStartupFiles({
    ghid,
    uuid,
}: {
    ghid?: string;
    uuid?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    // todo: ensure user can download files here
    const files = await db
        .selectFrom(["startups", "startups_files"])
        .select(commonFileFields)
        .where((eb) => {
            const conditions: ExpressionWrapper<any, any, any>[] = [];
            conditions.push(
                eb("startups.uuid", "=", eb.ref("startups_files.startup_id"))
            );
            conditions.push(eb("startups_files.deleted_at", "is", null));
            if (ghid) conditions.push(eb("startups.ghid", "=", ghid));
            if (uuid) conditions.push(eb("startups.uuid", "=", uuid));
            return eb.and(conditions);
        })
        .orderBy("created_at", "desc")
        .execute();
    return files;
}
