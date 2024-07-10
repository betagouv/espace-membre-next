import { Metadata } from "next";

import { IncubatorList } from "@/components/IncubatorListPage";
import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.incubatorList()} / Espace Membre`,
};

export default async function Page() {
    const incubators = await getAllIncubators().then((r) =>
        r.map((s) => ({
            value: s.uuid,
            label: s.title,
        }))
    );
    return (
        <>
            <h1>{routeTitles.incubatorList()}</h1>
            <IncubatorList incubators={incubators} />;
        </>
    );
}
