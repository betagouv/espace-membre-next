import { Metadata } from "next";

import { StartupType } from "@/components/SESelect";
import { StartupList } from "@/components/StartupListPage";
import { getAllStartups } from "@/lib/kysely/queries";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getStartupFiles } from "@/app/api/startups/files/list";

import { SearchFiles } from "./SearchFiles";

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
                } as StartupType)
        )
    );
    return (
        <>
            <h1>{routeTitles.startupList()}</h1>
            <StartupList startups={startups} />
            <hr />
            <h2>{routeTitles.startupsFiles()}</h2>
            <SearchFiles files={files} />
        </>
    );
}
