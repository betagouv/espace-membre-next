import type { Metadata } from "next";

import MatomoServiceForm from "@/components/Service/MatomoServiceForm";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.communityCreateMember()} / Espace Membre`,
};

export default async function MatomoPage() {
    return (
        <>
            <h1>Compte matomo</h1>
            <MatomoServiceForm />
        </>
    );
}
