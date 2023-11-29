import type { Metadata } from "next";
import AccountInfoClientPage from "./AccountInfoClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditPrivateInfo()} / Espace Membre`,
};

export default function Page() {
    return <AccountInfoClientPage />;
}
