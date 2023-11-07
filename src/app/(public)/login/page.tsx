"use client";

import { LoginPage } from "@/legacyPages/LoginPage";

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
