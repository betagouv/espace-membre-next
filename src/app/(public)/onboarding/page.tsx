import { Metadata } from "next";
import OnboardingClientPage from "./OnboardingClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.onboarding()} / Espace Membre`,
};

export default function Page() {
    return <OnboardingClientPage />;
}
