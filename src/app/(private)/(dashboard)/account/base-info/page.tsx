import type { Metadata } from "next";
import AccountBaseInfoClientPage from "./AccountBaseInfoClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

export default function Page() {
    return <AccountBaseInfoClientPage />;
}
