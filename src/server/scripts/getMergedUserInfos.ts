import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { publicUserInfosToModel } from "@/models/mapper";
import betagouv from "@betagouv";
import { checkUserIsExpired } from "@controllers/utils";
import knex from "@db";

const getIntraUsersEmails = async () => {
    const users = (await getAllUsersInfo()).map((user) =>
        publicUserInfosToModel(user)
    );
    const members = users.filter((user) => !checkUserIsExpired(user));
    const intras = members.filter(
        (member) => member.domaine === "Intraprenariat"
    );
    const intraDBUsers = await knex("users").whereIn(
        "username",
        intras.map((intra) => intra.username)
    );
    intraDBUsers.forEach((user) => {
        console.log(`${user.secondary_email}`);
    });
};

getIntraUsersEmails();
