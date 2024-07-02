import type { Metadata } from "next";

import { routeTitles } from "@/utils/routes/routeTitles";
import AccountClientPage from "./AccountClientPage";

export const metadata: Metadata = {
    title: `${routeTitles.account()} / Espace Membre`,
};

export default async function Page() {
    return <AccountClientPage />;
}
