import { db } from "@/lib/kysely";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import betagouv from "@betagouv";
import { checkUserIsExpired } from "@controllers/utils";

const getIntraUsersEmails = async () => {
  const users = (await getAllUsersInfo()).map((user) =>
    memberBaseInfoToModel(user),
  );
  const members = users.filter((user) => !checkUserIsExpired(user));
  const intras = members.filter(
    (member) => member.domaine === "Intraprenariat",
  );
  const intraDBUsers = await db
    .selectFrom("users")
    .selectAll()
    .where(
      "username",
      "in",
      intras.map((intra) => intra.username),
    )
    .execute();
  intraDBUsers.forEach((user) => {
    console.log(`${user.secondary_email}`);
  });
};

getIntraUsersEmails();
