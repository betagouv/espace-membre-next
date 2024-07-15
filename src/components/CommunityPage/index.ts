import { Incubators } from "@/@types/db";
import { memberBaseInfoSchemaType } from "@/models/member";
import { Option } from "@/models/misc";

export interface CommunityProps {
    users: memberBaseInfoSchemaType[];
    incubatorOptions: Option[];
    startupOptions: Option[];
    domaineOptions: Option[];
    competenceOptions: Option[];
}

export * from "./Community";
