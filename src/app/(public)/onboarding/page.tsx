import { Onboarding } from "@/legacyPages/OnboardingPage";
import { getForm } from "@/controllers/onboardingController/getOnboardingForm";

export default async function Page() {
    const props = await getForm({}, {});
    console.log("CALL PAGE");
    return <Onboarding {...props} />;
}
