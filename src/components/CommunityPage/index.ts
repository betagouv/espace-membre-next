import { memberBaseInfoSchemaType } from "@/models/member";
import { Option } from "@/models/misc";
import { getAllIncubatorsMembers } from "@/lib/kysely/queries/incubators";

export interface CommunityProps {
    users: memberBaseInfoSchemaType[];
    incubatorOptions: Option[];
    startupOptions: Option[];
    domaineOptions: Option[];
    competenceOptions: Option[];
    incubatorMembers: Awaited<ReturnType<typeof getAllIncubatorsMembers>>;
}

export * from "./Community";
