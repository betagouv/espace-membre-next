import { postStartupInfoUpdate } from "@/controllers/startupController"
 
export async function POST(req: Request,{ params }: { params: { id: string } }
    ) {
    // console.log(req.body)
    // return Response.json({})
    const body = await req.json()
    return await postStartupInfoUpdate({ body, params: {
        startup: params.id
    } }, Response)
}
