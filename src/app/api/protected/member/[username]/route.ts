import { HttpStatusCode } from "axios";

import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";

export async function GET(
    _: Request,
    { params: { username } }: { params: { username: string } }
) {
    const dbUser = await getUserBasicInfo({ username });
    if (!dbUser) {
        return Response.json(
            { error: "No user found for this username" },
            { status: HttpStatusCode.NotFound }
        );
    }
    const member = memberBaseInfoToModel(dbUser);
    return Response.json(member);
}
