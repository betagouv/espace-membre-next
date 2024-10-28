import { db } from "@/lib/kysely";
import {
    newsletterInfoUpdateSchema,
    newsletterInfoUpdateSchemaType,
} from "@/models/actions/newsletter";

export const updateNewsletter = async (
    data: newsletterInfoUpdateSchemaType,
    newsletterId: string
) => {
    const newsletterUpdatePayload = newsletterInfoUpdateSchema.parse(data);

    await db
        .updateTable("newsletters")
        .where("id", "=", newsletterId)
        .set({
            ...newsletterUpdatePayload,
        })
        .execute();

    return true;
};
