import { postStartupInfoCreate } from "@/controllers/startupController/postStartupInfoCreate"
 
export async function POST(req: Request) {
    // console.log(req.body)
    // return Response.json({})
    const body = await req.json()
    return await postStartupInfoCreate({ body  }, Response)
}
