import { DBUserPublic } from "@/models/dbUser";
import { Member } from "@/models/member";

export interface Option {
    value: string;
    label: string;
}

export interface CommunityProps {
    users: DBUserPublic[];
    incubatorOptions: Option[];
    startupOptions: Option[];
    domaineOptions: Option[];
    competenceOptions: Option[];
}

export * from "./Community";
