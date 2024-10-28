import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { NewsletterForm } from "@/components/NewsletterForm/NewsletterForm";
import { db } from "@/lib/kysely";
import { newsletterToModel } from "@/models/mapper/newsletterMapper";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.adminMattermost()} / Espace Membre`,
};

export default async function Page(props) {
    const session = await getServerSession(authOptions);

    if (session && !session.user.isAdmin) {
        redirect("/dashboard");
    }

    const dbNewsletter = await db
        .selectFrom("newsletters")
        .selectAll()
        .where("sent_at", "is", null)
        .executeTakeFirst();
    if (!dbNewsletter) {
        redirect("/dashboard");
    }
    const newsletter = newsletterToModel(dbNewsletter);
    return <NewsletterForm newsletter={newsletter}></NewsletterForm>;
}
