import { Metadata } from "next";

import { SearchFiles } from "./SearchFiles";
import { getStartupFiles } from "@/app/api/startups/files/list";
import { StartupType } from "@/components/SESelect";
import { StartupList } from "@/components/StartupListPage";
import { getAllStartups } from "@/lib/kysely/queries";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.startupList()} / Espace Membre`,
};

export default async function Page() {
    const files = await getStartupFiles();
    const startups = await getAllStartups().then((r) =>
        r.map(
            (s) =>
                ({
                    value: s.uuid,
                    label: s.name,
                }) as StartupType,
        ),
    );
    return (
        <>
            <h1>Explorer les produits</h1>
            <h2>Fiches produits</h2>
            <StartupList startups={startups} />
            <hr />
            <h2>Documents partagés</h2>
            <SearchFiles files={files} />
        </>
    );
}
