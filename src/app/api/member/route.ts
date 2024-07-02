import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { createMission } from "@/lib/kysely/queries/missions";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { createMemberSchema } from "@/models/actions/member";
import { EmailStatusCode } from "@/models/member";
import { authOptions } from "@/utils/authoptions";
import { createUsername } from "@/utils/github";

export async function POST(req: Request) {
    console.log("Create user");
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    const rawdata = await req.json();
    const { member, missions } = createMemberSchema.parse(rawdata);

    return db
        .transaction()
        .execute(async (trx) => {
            const user = await trx
                .insertInto("users")
                .values({
                    domaine: member.domaine,
                    secondary_email: member.email,
                    fullname: `${member.firstname} ${member.lastname}`,
                    username: createUsername(member.firstname, member.lastname),
                    role: "",
                    primary_email_status:
                        EmailStatusCode.EMAIL_VERIFICATION_WAITING,
                })
                .returning("uuid")
                .executeTakeFirstOrThrow();
            for (const mission of missions) {
                // Now, use the same transaction to link to an organization
                await createMission(
                    {
                        ...mission,
                        user_id: user.uuid,
                    },
                    trx
                );
            }
            return user;
        })
        .then(async (res) => {
            console.log("res", res);
            const dbUser = await getUserInfos({
                uuid: res.uuid,
                options: { withDetails: true },
            });
            revalidatePath("/community");

            return Response.json({
                message: `Success`,
                data: dbUser,
            });
        })
        .catch((e) => {
            console.error("Transaction failed:", e);
            return Response.json({
                message: `Error`,
                data: null,
            });
        });

    // addEvent({
    //     action_code: EventCode.MEMBER_BASE_INFO_UPDATED,
    //     created_by_username: session.user.id as string,
    //     action_on_username: username,
    //     action_metadata: {
    //         value: rawdata,
    //         old_value: previousInfo
    //     }
    // });

    // return Response.json({
    //     message: "success",
    //     pr_url: prInfo.html_url,
    // });
}
