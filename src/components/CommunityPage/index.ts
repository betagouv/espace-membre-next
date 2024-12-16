import { memberBaseInfoSchemaType } from "@/models/member";
import { Option } from "@/models/misc";
import { getAllIncubatorsMembers } from "@/lib/kysely/queries/incubators";

type memberBaseInfoSchemaTypeWithGeoLoc = memberBaseInfoSchemaType & {
    latLon: { lat: number | null; lon: number | null };
};
export interface CommunityProps {
    users: memberBaseInfoSchemaTypeWithGeoLoc[];
    incubatorOptions: Option[];
    startupOptions: Option[];
    domaineOptions: Option[];
    competenceOptions: Option[];
    incubatorMembers: Awaited<ReturnType<typeof getAllIncubatorsMembers>>;
}

export * from "./Community";
