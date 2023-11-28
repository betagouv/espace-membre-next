import type { Metadata } from "next";
import AccountBaseInfoClientPage from "./AccountBaseInfoClientPage";

export const metadata: Metadata = {
    title: "Espace-Membre: Modifier les infos de base",
};

export default function Page() {
    return <AccountBaseInfoClientPage />;
}
