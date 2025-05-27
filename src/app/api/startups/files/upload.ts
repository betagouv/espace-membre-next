"use server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { DocSchemaType } from "@/models/startupFiles";
import { authOptions } from "@/utils/authoptions";

const commonFileFields = [
    "startups_files.filename",
    "startups_files.title",
    "startups_files.uuid",
    "startups_files.size",
    "startups_files.comments",
    "startups_files.created_at",
    "startups_files.type",
    "startups_files.data",
] as const;

type PostParams = {
    content: string;
    uuid: string;
    filename: string;
    size: number;
    data?: any;
};

export async function uploadStartupFile(
    {
        title,
        type,
        uuid,
        content,
        comments,
        filename,
        size,
        data,
    }: DocSchemaType & PostParams, // formData: {
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    const base64 = Buffer.from(content);

    // todo: ensure user can upload files here
    const inserted = await db
        .insertInto("startups_files")
        .values({
            base64,
            type,
            data,
            comments,
            filename,
            size,
            title,
            startup_id: uuid,
            created_by: session.user.uuid,
        })
        .returning(commonFileFields)
        .executeTakeFirstOrThrow();
    revalidatePath("/startups");
    return inserted;
}
