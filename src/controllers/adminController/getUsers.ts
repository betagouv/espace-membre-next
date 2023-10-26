import betagouv from "@/betagouv";
import { Domaine, Member } from "@/models/member";
import db from "@/db";
import { CommunicationEmailCode, DBUser } from "@/models/dbUser/dbUser";
import { getActiveUsers, getExpiredUsers } from "../utils";

export async function getUsers(req, res) {
    console.log(req.query.domaines);
    const domaines = req.query.domaines
        ? req.query.domaines.split(",").map((domaine) => Domaine[domaine])
        : [];
    const incubators = req.query.incubators
        ? req.query.incubators.split(",")
        : [];
    const startupPhases = req.query.startupPhases
        ? req.query.startupPhases.split(",")
        : [];
    const memberStatus = req.query.memberStatus;
    let startups = req.query.startups ? req.query.startups.split(",") : [];
    // const activeMembers = req.params.activeMembers
    let users: Member[] = await betagouv.usersInfos();
    if (memberStatus === "unactive") {
        users = getExpiredUsers(users);
    } else if (memberStatus === "active") {
        users = getActiveUsers(users);
    }
    if (incubators.length) {
        const incubatorsDict = await betagouv.incubators();
        const incubatorStartups = incubators.reduce((acc, incubator) => {
            return [
                ...acc,
                ...incubatorsDict[incubator].startups.map((s) => s.id),
            ];
        }, []);
        startups = [...startups, ...incubatorStartups];
    }
    if (domaines.length) {
        users = users.filter((user) => domaines.includes(user.domaine));
    }
    if (startupPhases.length) {
        const usersStartupsByPhase: UserStartup[] = await db("users_startups")
            .whereIn(
                "user_id",
                users.map((user) => user.id)
            )
            .join("startups", "users_startups.startup_id", "startups.id")
            .whereIn("startups.current_phase", startupPhases);
        const usersByPhaseIds = usersStartupsByPhase.map(
            (item) => item.user_id
        );
        users = users.filter((user) => usersByPhaseIds.includes(user.id));
    }
    if (startups.length) {
        users = users.filter((user) => {
            return Boolean(
                startups.filter(function (n) {
                    return (user.startups || []).indexOf(n) !== -1;
                }).length
            );
        });
    }
    const dbUsers: DBUser[] = await db("users").whereIn(
        "username",
        users.map((user) => user.id)
    );
    if (
        process.env.ESPACE_MEMBRE_ADMIN &&
        process.env.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)
    ) {
        users = users.map((user) => {
            const dbUser = dbUsers.find(
                (dbUser) => dbUser.username === user.id
            );
            return {
                ...user,
                primaryEmail: dbUser ? dbUser.primary_email : "",
                secondaryEmail: dbUser ? dbUser.secondary_email : "",
                workplace_insee_code: dbUser ? dbUser.workplace_insee_code : "",
                communicationEmail: dbUser
                    ? dbUser.communication_email ===
                          CommunicationEmailCode.SECONDARY &&
                      dbUser.secondary_email
                        ? dbUser.secondary_email
                        : dbUser.primary_email
                    : "",
            };
        });
    }
    return res.json({ users });
}
