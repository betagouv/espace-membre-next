import { Metadata } from "next";
import { LoginPage } from "@/legacyPages/LoginPage";

export const metadata: Metadata = {
    title: "Espace-Membre: page de connexion",
};

export default function Login() {
    const errors: any[] = [];
    const messages = "";
    const domain = "";
    const next = "";
    return (
        <LoginPage
            errors={errors}
            messages={messages}
            domain={domain}
            next={next}
        />
    );
}
