import { postLoginApi } from "@/controllers/loginController/postLoginApi";
import { NextResponse, NextRequest } from "next/server";
function paramsToObject(entries) {
    const result = {};
    for (const [key, value] of entries) {
        // each 'entry' is a [key, value] tupple
        result[key] = value;
    }
    return result;
}

export async function POST(
    req: NextRequest,
    { params }: { params: { username: string } }
) {
    // console.log(req.body)
    // return Response.json({})
    const body = await req.json();
    return await postLoginApi(
        {
            body,
            query: paramsToObject(req.nextUrl.searchParams.entries()),
            get: (key: string) => req.headers.get(key),
        },
        Response
    );
}
