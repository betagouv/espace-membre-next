'use client';

import { Home } from "@/legacyPages/HomePage";

export default function Login() {
    const errors: any[] = []
    const messages = ''
    const domain = ''
    const next = ''
    return <Home
        errors={errors}
        messages={messages}
        domain={domain}
        next={next}
    />
}