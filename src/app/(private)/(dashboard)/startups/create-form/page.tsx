import { Metadata } from "next";

import { StartupInfoCreate } from "@/components/StartupInfoCreatePage";
import betagouv from "@/server/betagouv";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.startupCreate()} / Espace Membre`,
};

export default async function Page(props) {
    const incubators = await betagouv.incubators();
    const sponsors = await betagouv.sponsors();

    return (
        <>
            <h1>{routeTitles.startupCreate()}</h1>
            <StartupInfoCreate
                sponsors={sponsors}
                incubators={incubators}
                {...props}
            />
        </>
    );
}
