// import { PULL_REQUEST_STATE } from "@/models/pullRequests";
// import { StartupInfo } from "@/models/startup";
// import config from "@/server/config";
// import { getDBStartup } from "@/server/db/dbStartup";
// import betagouv from "@betagouv";
// import db from "@db";

// export async function getStartupInfoUpdateApi(req, res) {
//     getStartupInfoUpdatePageData(
//         req,
//         res,
//         (data) => {
//             res.json({
//                 ...data,
//             });
//         },
//         (err) => {
//             res.status(500).json({
//                 error: "Impossible de récupérer les information de la startup.",
//             });
//         }
//     );
// }

// async function getStartupInfoUpdatePageData(req, res, onSuccess, onError) {
//     try {
//         const title = "Changer une startup de phase";
//         const formValidationErrors = {};
//         // const startup: StartupInfo | undefined = await betagouv
//         //     .startupsInfos()
//         //     .then((startups) =>
//         //         startups.find((s) => s.id === req.params.startup)
//         //     );
//         const startup = await getDBStartup({ id: req.params.startup });
//         if (!startup) {
//             onError(new Error(`startup ${req.params.startup} not found`));
//             return;
//         }
//         const updatePullRequest = await db("pull_requests")
//             .where({
//                 status: PULL_REQUEST_STATE.PR_STARTUP_UPDATE_CREATED,
//                 startup: req.params.startup,
//             })
//             .orderBy("created_at", "desc")
//             .first();
//         onSuccess({
//             title,
//             formValidationErrors,
//             currentUserId: req.auth.id,
//             isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
//             activeTab: "startups",
//             subActiveTab: "udpate-phase",
//             username: req.auth.id,
//             formData: {
//                 link: startup.link,
//                 dashlord_url: startup.dashlord_url,
//                 repository: startup.repository,
//                 mission: startup.pitch,
//                 stats_url: startup.stats_url,
//                 incubator: startup.incubator,
//                 sponsors: startup.sponsors,
//                 contact: startup.contact,
//             },
//             updatePullRequest,
//             startup,
//         });
//     } catch (err) {
//         onError(err);
//     }
// }
