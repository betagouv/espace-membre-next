import { Metadata } from "next";
import OnboardingClientPage from "./OnboardingClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.onboarding()} / Espace Membre`,
};

export default function Page() {
    return (
        <div className="fr-mt-10w">
            <h1>Onboarding</h1>
            <p>
                Une personne de la communauté doit vous inviter pour que vous
                puissiez nous rejoindre.
            </p>
        </div>
    );
}
