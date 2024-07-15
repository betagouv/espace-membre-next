import { Metadata } from "next";

import { IncubatorList } from "@/components/IncubatorListPage";
import { getAllIncubatorsOptions } from "@/lib/kysely/queries/incubators";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.incubatorList()} / Espace Membre`,
};

export default async function Page() {
    const incubatorOptions = await getAllIncubatorsOptions();
    return (
        <>
            <h1>{routeTitles.incubatorList()}</h1>
            <IncubatorList incubatorOptions={incubatorOptions} />;
        </>
    );
}
