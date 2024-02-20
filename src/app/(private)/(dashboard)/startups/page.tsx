import { Metadata } from "next";
import { routeTitles } from "@/utils/routes/routeTitles";
import { StartupList } from "@/components/StartupListPage";
import { StartupsAPIResponse } from "@/models/startup";

export const metadata: Metadata = {
    title: `${routeTitles.startupList()} / Espace Membre`,
};

const fetchBetaApiStartups = (): Promise<StartupsAPIResponse> =>
    fetch("https://beta.gouv.fr/api/v2.5/startups.json") // TODO: env.BETA_API_STARTUPS -> config.betaApiStartups ?
        .then((r) => r.json());

export default async function Page() {
    const startups = await fetchBetaApiStartups().then((r) =>
        r.data.map((s) => ({
            value: s.id,
            label: s.attributes.name,
        }))
    );
    return (
        <>
            <h1>{routeTitles.startupList()}</h1>
            <StartupList startups={startups} />;
        </>
    );
}
