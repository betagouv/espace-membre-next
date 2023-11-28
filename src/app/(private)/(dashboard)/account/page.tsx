import type { Metadata } from "next";
import AccountClientPage from "./AccountClientPage";

export const metadata: Metadata = {
    title: "Espace-Membre: Mon compte",
};

export default function Page() {
    return <AccountClientPage />;
}
