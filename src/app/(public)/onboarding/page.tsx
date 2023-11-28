import { Metadata } from "next";
import OnboardingClientPage from "./OnboardingClientPage";

export const metadata: Metadata = {
    title: "Espace-Membre: créer ma fiche github",
};

export default function Page() {
    return <OnboardingClientPage />;
}
