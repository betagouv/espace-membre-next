import { Selectable } from "kysely";

import { newsletterSchemaType } from "../newsletter";
import { Newsletters } from "@/@types/db";

export const newsletterToModel = (
    newsletter: Selectable<Newsletters>
): newsletterSchemaType => {
    return {
        created_at: newsletter.created_at,
        sent_at: newsletter.sent_at,
        id: newsletter.id,
        url: newsletter.url,
    };
};
