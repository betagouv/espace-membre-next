import { Metadata } from "next";

import {
    StartupInfoCreate,
    StartupInfoCreateProps,
} from "@/components/StartupInfoCreatePage";
import betagouv from "@/server/betagouv";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.startupCreate()} / Espace Membre`,
};

export default async function Page(props) {
    const incubators = await betagouv.incubators();

    return (
        <>
            <h1>{routeTitles.startupCreate()}</h1>
            <StartupInfoCreate incubators={incubators} {...props} />
        </>
    );
}
