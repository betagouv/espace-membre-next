import { Member } from "@/models/member";

export interface Option {
    value: string;
    label: string;
}

export interface CommunityProps {
    users: Member[];
    incubatorOptions: Option[];
    startupOptions: Option[];
    domaineOptions: Option[];
    competenceOptions: Option[];
}

export * from "./Community";
