import { number } from "zod";

import db from ".";
import { dbIncubator } from "@/models/incubator";

export const getDBIncubator = (
    params: { id: number } | { ghid: string }
): Promise<dbIncubator | undefined> => {
    return db("incubators").where(params).first();
};

export const getAllIncubators = (): Promise<dbIncubator[]> => {
    return db("incubators");
};

export const getOrCreateDBIncubator = async (
    params: Omit<dbIncubator, "uuid">
): Promise<dbIncubator> => {
    const [dbIncubator] = await db("incubators")
        .insert({
            ...params,
        })
        .onConflict("ghid")
        .merge()
        .returning("*");
    return dbIncubator;
};
