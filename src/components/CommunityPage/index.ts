import { DBUserPublic } from "@/models/dbUser";
import { Member } from "@/models/member";

export interface Option {
    value: string;
    label: string;
}

export interface CommunityProps {
    title: string;
    currentUserId: string;
    errors: string[];
    messages: string[];
    users: DBUserPublic[];
    activeTab: string;
    incubatorOptions: Option[];
    startupOptions: Option[];
    domaineOptions: Option[];
    isAdmin: boolean;
}

export * from "./Community";
