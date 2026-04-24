import { getAllIncubatorsMembers } from "@/lib/kysely/queries/incubators";
import { memberBaseInfoSchemaType } from "@/models/member";
import { Option } from "@/models/misc";

type memberBaseInfoSchemaTypeWithGeoLoc = Omit<
  memberBaseInfoSchemaType,
  "secondary_email"
> & {
  latLon: { lat: number | null; lon: number | null };
};
export interface CommunityProps {
  users: memberBaseInfoSchemaTypeWithGeoLoc[];
  incubatorOptions: Option[];
  startupOptions: Option[];
  primaryEmailStatusOptions: Option[];
  domaineOptions: Option[];
  competenceOptions: Option[];
  incubatorMembers: Awaited<ReturnType<typeof getAllIncubatorsMembers>>;
}

export * from "./Community";
