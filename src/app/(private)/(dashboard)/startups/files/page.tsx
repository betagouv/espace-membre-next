import { Metadata } from "next";

import { StartupType } from "@/components/SESelect";
import { StartupList } from "@/components/StartupListPage";
import { getAllStartups } from "@/lib/kysely/queries";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getStartupFiles } from "@/app/api/startups/files/list";
import { FileList } from "@/components/StartupFiles/FileList";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";

import { contenusTypes } from "@/components/StartupFiles/FormDoc";
import { SearchFiles } from "./SearchFiles";

export const metadata: Metadata = {
    title: `${routeTitles.startupsFiles()} / Espace Membre`,
};

export default async function Page() {
    const files = await getStartupFiles();
    return (
        <>
            <h1>{routeTitles.startupsFiles()}</h1>
            <SearchFiles files={files} />
        </>
    );
}
