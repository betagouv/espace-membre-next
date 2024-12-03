import { HttpStatusCode } from 'axios';

import { safeGetUserPublicInfo } from '@/app/api/member/actions';

export async function GET(
    _: Request,
    { params: { username } }: { params: { username: string } }
) {
    const userInfo = await safeGetUserPublicInfo(username);
    if (userInfo.success) {
        return Response.json(userInfo.data);
    }
    return Response.json({ error: userInfo.message }, { status: HttpStatusCode.NotFound });
}