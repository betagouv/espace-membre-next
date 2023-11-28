import type { Metadata } from "next";
import AccountInfoClientPage from "./AccountInfoClientPage";

export const metadata: Metadata = {
    title: "Espace-Membre: Modifier les infos privées",
};

export default function Page() {
    return <AccountInfoClientPage />;
}
