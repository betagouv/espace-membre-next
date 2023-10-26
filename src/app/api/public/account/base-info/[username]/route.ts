import { publicPostBaseInfoUpdate } from "@/controllers/usersController"
 
export async function POST(req: Request,{ params }: { params: { username: string } }
    ) {
    // console.log(req.body)
    // return Response.json({})
    const body = await req.json()
    return await publicPostBaseInfoUpdate({ body, params: {
        username: params.username
    } }, Response)
}
