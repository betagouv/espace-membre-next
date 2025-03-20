 "use server" 
     
import { getLastEvent } from "@/lib/events";
import { EventCode } from "@/models/actionEvent";

export const isWaitingValidation = async (username) => {
    const eventMemberCreated = await getLastEvent(
        username,
        EventCode.MEMBER_CREATED
    );

    const eventMemberValidated = await getLastEvent(
        username,
        EventCode.MEMBER_VALIDATED
    );

    return !!eventMemberCreated && !eventMemberValidated;
};
