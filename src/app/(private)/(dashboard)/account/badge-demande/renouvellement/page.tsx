import type { Metadata } from "next";
import AccountBadgeRenewalClientPage from "./AccountBadgeRenewalClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.accountBadge()} / Espace Membre`,
};

export default function Page() {
    return <AccountBadgeRenewalClientPage />;
}
