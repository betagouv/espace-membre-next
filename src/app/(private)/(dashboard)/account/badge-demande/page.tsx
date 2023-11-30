import type { Metadata } from "next";
import AccountBadgeClientPage from "./AccountBadgeClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.accountBadge()} / Espace Membre`,
};

export default function Page() {
    return <AccountBadgeClientPage />;
}
