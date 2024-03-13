import db from ".";
import { DBUser } from "@/models/dbUser";

export const getDBUser = (username: string): Promise<DBUser | undefined> => {
    return db("users").where({ username }).first();
};
