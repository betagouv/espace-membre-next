import db from ".";
import { Sponsor, dbSponsorSchemaType } from "@/models/sponsor";

export const getDBSponsor = (
    params:
        | {
              ghid: string;
          }
        | { id: number }
): Promise<dbSponsorSchemaType | undefined> => {
    return db("organizations").where(params).first();
};

export const getAllSponsors = (): Promise<dbSponsorSchemaType[]> => {
    return db("organizations");
};

export const getOrCreateSponsor = async (
    sponsor: Sponsor
): Promise<dbSponsorSchemaType> => {
    const [dbSponsor] = await db("organizations")
        .insert(sponsor)
        .onConflict("name")
        .merge()
        .returning("*");
    return dbSponsor;
};
