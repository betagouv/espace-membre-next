import { Metadata } from "next";
import { LoginPage } from "@/components/LoginPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.login()} / Espace Membre`,
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
