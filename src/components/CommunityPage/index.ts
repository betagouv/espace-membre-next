import { DBUserPublic } from "@/models/dbUser";
import { Member, memberPublicInfoSchemaType } from "@/models/member";

export interface Option {
    value: string;
    label: string;
}

export interface CommunityProps {
    users: memberPublicInfoSchemaType[];
    incubatorOptions: Option[];
    startupOptions: Option[];
    domaineOptions: Option[];
    competenceOptions: Option[];
}

export * from "./Community";
