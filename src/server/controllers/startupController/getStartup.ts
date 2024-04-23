import { DBUser, DBUserPublic } from "@/models/dbUser";
import { Member } from "@/models/member";
import { PULL_REQUEST_STATE } from "@/models/pullRequests";
import { PHASE_READABLE_NAME, Startup, StartupPhase } from "@/models/startup";
import config from "@/server/config";
import { getDBStartup } from "@/server/db/dbStartup";
import {
    getAllUsersPublicInfo,
    getDBUsersForStartup,
} from "@/server/db/dbUser";
import betagouv from "@betagouv";
import db from "@db";

function getCurrentPhase(startup: Startup) {
    return startup.phases
        ? startup.phases[startup.phases.length - 1].name
        : undefined;
}

export async function getStartup(req, res) {
    getStartupPageData(
        req,
        res,
        (data) => {
            res.render("startup", {
                ...data,
                errors: req.flash("error"),
                messages: req.flash("message"),
            });
        },
        (err) => {
            console.error(err);
            req.flash("error", "Impossible de récupérer vos informations.");
            return res.redirect("/");
        }
    );
}

export async function getStartupApi(req, res) {
    getStartupPageData(
        req,
        res,
        (data) => {
            res.json({
                ...data,
            });
        },
        (err) => {
            res.status(500).json({
                error: err,
            });
        }
    );
}

async function getStartupPageData(req, res, onSuccess, onError) {
    try {
        const { startup } = req.params;
        const startupInfos = await getDBStartup({ uuid: startup });
        console.log("LCS GET STARTUP", startupInfos);
        if (!startupInfos) {
            throw new Error("Not found");
        }
        console.log("LCS GET STARTUP 2");

        // const usersInfos = await db("missions_startups")
        //     .where({
        //         startup_id: startup,
        //     })
        //     .rightJoin("missions", "missions.uuid", "mission_id")
        //     .rightJoin("users", "user_id", "users.uuid")
        //     .groupBy("users.uuid");
        // console.log(usersInfos);
        // try {
        interface Members {
            expired_members: DBUserPublic[];
            active_members: DBUserPublic[];
            previous_members: DBUserPublic[];
        }

        const members: Members = {
            expired_members: [],
            active_members: [],
            previous_members: [],
        };
        const memberTypes = [
            "expired_members",
            "active_members",
            "previous_members",
        ];
        try {
            const usersInfos = await getDBUsersForStartup(startup);
            usersInfos.forEach((user) => {
                if (user.end > new Date()) {
                    members["active_members"].push(user);
                } else {
                    members["previous_members"].push(user);
                }
            });
            console.log(usersInfos);
        } catch (e) {
            console.log("LCS GET SE ERORS", e);
        }
        // } catch (e) {}
        const updatePullRequest = await db("pull_requests")
            .where({
                username: req.auth.id,
                status: PULL_REQUEST_STATE.PR_STARTUP_UPDATE_CREATED,
            })
            .orderBy("created_at", "desc")
            .first();
        const title = `Startup ${startup}`;
        return onSuccess({
            title,
            currentUserId: req.auth.id,
            startupInfos: startupInfos,
            currentPhase: startupInfos.current_phase
                ? PHASE_READABLE_NAME[startupInfos.current_phase]
                : undefined,
            members,
            isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
            subActiveTab: "list",
            domain: config.domain,
            activeTab: "startups",
            updatePullRequest,
        });
    } catch (err) {
        onError(err);
    }
}
