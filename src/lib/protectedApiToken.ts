import { HttpStatusCode } from 'axios';
import { NextRequest } from 'next/server';

import config from '@/server/config'

const API_KEY_NAME = "apiKey";
export const validateApiToken = (req: NextRequest) => {
    if (!req.nextUrl.searchParams.has(API_KEY_NAME)) {
        return Response.json({ error: `Api key is required.` }, { status: HttpStatusCode.UnprocessableEntity });
    }
    const apiKey = req.nextUrl.searchParams.get('apiKey') ?? "";
    if (!config.PUBLIC_API_KEYS.includes(apiKey)) {
        return Response.json({ error: `Invalid api key.` }, { status: HttpStatusCode.Unauthorized });
    }

    return null;
}