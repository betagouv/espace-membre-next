import { Metadata } from "next";
import { LoginPage } from "@/components/LoginPage";
import { routeTitles } from "@/utils/routes/routeTitles";
import { cookies } from "next/headers";
import config from "@/server/config";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: `${routeTitles.login()} / Espace Membre`,
};

async function Login() {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    if (session && session.id) {
        return redirect("/account");
    }
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

export default Login;
