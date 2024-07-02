import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent";

describe("Add events", () => {
    it("should add event to db properly", async () => {
        const event = await addEvent({
            action_code: EventCode.MEMBER_REDIRECTION_CREATED,
            created_by_username: "membre.actif",
            action_on_username: "membre.expire",
            action_metadata: {
                value: "toto@gmail.com",
            },
        });
        const res = await db
            .selectFrom("events")
            .selectAll()
            .orderBy("created_at", "desc")
            .executeTakeFirst();
        res.action_metadata.should.equal(`"value"=>"toto@gmail.com"`);
        res.created_by_username.should.equal("membre.actif");
        res.action_on_username.should.equal("membre.expire");
    });
});
