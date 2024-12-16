import { z } from "zod";

import { EventCode } from "./actionEvent";
import { SERVICES } from "@/models/services";

export const EventServiceAccountDeletedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SERVICE_ACCOUNT_DELETED),
    action_metadata: z.object({
        email: z.string(),
        service: z.nativeEnum(SERVICES),
    }),
});
