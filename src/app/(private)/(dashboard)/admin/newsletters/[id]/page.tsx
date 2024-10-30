import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { NewsletterForm } from "@/components/NewsletterForm/NewsletterForm";
import { db } from "@/lib/kysely";
import { newsletterToModel } from "@/models/mapper/newsletterMapper";
import { authOptions } from "@/utils/authoptions";

type Props = {
    params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // read route params
    const id = params.id;

    return {
        title: `Newsletter ${id} / Espace Membre`,
    };
}

export default async function Page({ params }: Props) {
    const session = await getServerSession(authOptions);

    if (session && !session.user.isAdmin) {
        redirect("/dashboard");
    }

    const dbNewsletter = await db
        .selectFrom("newsletters")
        .selectAll()
        .where("id", "=", params.id)
        .executeTakeFirst();
    if (!dbNewsletter) {
        redirect("/dashboard");
    }
    const newsletter = newsletterToModel(dbNewsletter);
    // const newsletter = newsletterToModel(dbNewsletter);
    return <NewsletterForm newsletter={newsletter} />;
}
