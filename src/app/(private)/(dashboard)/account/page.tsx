import type { Metadata } from "next";
import AccountClientPage from "./AccountClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.account()} / Espace Membre`,
};

export default function Page() {
    return <AccountClientPage />;
}
