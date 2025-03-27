import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { LoginPage } from "@/components/LoginPage";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.login()} / Espace Membre`,
};

async function Login({
    searchParams,
}: {
    searchParams: { [key: string]: string };
}) {
    let session;
    try {
        session = await getServerSession(authOptions);
    } catch (e) {
        // pass
    }
    if (session && session.user.id) {
        return redirect("/dashboard");
    }

    return <LoginPage />;
}

export default Login;
