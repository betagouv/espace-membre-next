import { PropsWithChildren } from "react";

import { PrivateLayout } from "@/app/(private)/(dashboard)/PrivateLayout";
import { fetchAirtableFormationById } from "@/lib/airtable";

export default async function Layout(
    props: PropsWithChildren & { params: { id: string } }
) {
    const formation = await fetchAirtableFormationById(props.params.id);

    return (
        <PrivateLayout currentPage={formation.name}>
            {props.children}
        </PrivateLayout>
    );
}
