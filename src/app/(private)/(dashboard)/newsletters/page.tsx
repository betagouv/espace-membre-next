import { Metadata, ResolvingMetadata } from "next";

import NewsletterPage from "@/components/NewsletterPage/NewsletterPage";
import { db } from "@/lib/kysely";
import { newsletterToModel } from "@/models/mapper/newsletterMapper";

type Props = {
    params: { id: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata,
): Promise<Metadata> {
    // read route params
    const id = params.id;

    return {
        title: `Infolettre / Espace Membre`,
    };
}

export default async function Page(props) {
    let allNewsletters = (
        await db
            .selectFrom("newsletters")
            .selectAll()
            .orderBy("created_at", "desc")
            .execute()
    ).map((newsletter) => newsletterToModel(newsletter));

    const currentNewsletter = allNewsletters[0];
    const previousNewsletters = allNewsletters.slice(1);

    return (
        <NewsletterPage
            currentNewsletter={currentNewsletter}
            newsletters={previousNewsletters}
        />
    );
}
