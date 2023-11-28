"use client";

import { useSession } from "@/proxies/next-auth";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    const { status, data: session } = useSession({
        required: true,
        onUnauthenticated() {
            router.push("/login");
        },
        onAuthenticated() {
            if (window.location.pathname === "/") {
                router.push("/account");
            }
        },
    });
    return <div></div>;
}
