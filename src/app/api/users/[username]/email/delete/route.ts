import { deleteEmailForUser } from "@/controllers/usersController/deleteEmailForUser";

export async function POST(req: Request) {
    // console.log(req.body)
    // return Response.json({})
    const body = await req.json();
    return await deleteEmailForUser({ body }, Response);
}
