import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

import jwt from "jsonwebtoken";

export const metadata: Metadata = {
    title: `${routeTitles.metabase()} / Espace Membre`,
};

export default async function Page() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const METABASE_SITE_URL = "https://metabase.incubateur.net";
    const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY || "";

    const payload = {
        resource: { dashboard: 16 },
        params: {},
        exp: Math.round(Date.now() / 1000) + 10 * 60, // 10 minute expiration
    };
    const token = jwt.sign(payload, METABASE_SECRET_KEY);

    const iframeUrl =
        METABASE_SITE_URL +
        "/embed/dashboard/" +
        token +
        "#bordered=false&titled=false";

    return (
        <>
            <iframe
                src={iframeUrl}
                width="100%"
                height="5000"
                allowTransparency
            ></iframe>
        </>
    );
}
