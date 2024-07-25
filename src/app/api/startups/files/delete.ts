"use server";

import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";

import { authOptions } from "@/utils/authoptions";

export async function deleteFile({ uuid }: { uuid: string }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    await db
        .updateTable("startups_files")
        .set({ deleted_by: session.user.uuid, deleted_at: new Date() })
        .where("uuid", "=", uuid)
        .executeTakeFirstOrThrow();
    return true;
}
