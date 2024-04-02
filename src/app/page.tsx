"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Home() {
    const router = useRouter();

    const { status, data: session } = useSession({
        required: true,
        onUnauthenticated() {
            router.push("/login");
        },
    });
    return <div></div>;
}
