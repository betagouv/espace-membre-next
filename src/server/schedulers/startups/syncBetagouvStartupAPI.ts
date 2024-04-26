import * as Sentry from "@sentry/node";
import { differenceInDays } from "date-fns";
import { start } from "repl";

import { getLastCommitFromFile } from "@/lib/github";
import { Incubator, dbIncubator } from "@/models/incubator";
import { Domaine, Member } from "@/models/member";
import { Sponsor, dbSponsorSchemaType } from "@/models/sponsor";
import {
    DBStartup,
    Phase,
    Startup,
    StartupInfo,
    StartupPhase,
    dbStartupSchema,
    dbStartupSchemaType,
    phaseSchema,
} from "@/models/startup";
import config from "@/server/config";
import { sendEmail } from "@/server/config/email.config";
import {
    getDBIncubator,
    getOrCreateDBIncubator,
} from "@/server/db/dbIncubator";
import { getDBSponsor, getOrCreateSponsor } from "@/server/db/dbSponsor";
import { createOrUpdateStartup, getDBStartup } from "@/server/db/dbStartup";
import { getAllUsersPublicInfo } from "@/server/db/dbUser";
import betagouv from "@betagouv";
import db from "@db";
import { EMAIL_TYPES, SendEmailProps } from "@modules/email";

function getCurrentPhase(startup: StartupInfo): StartupPhase {
    return startup.attributes.phases
        ? (startup.attributes.phases[startup.attributes.phases.length - 1]
              .name as StartupPhase)
        : StartupPhase.PHASE_INVESTIGATION;
}

function getCurrentPhaseDate(startup: StartupInfo): Date | undefined {
    let date;
    if (startup.attributes.phases) {
        date =
            startup.attributes.phases[startup.attributes.phases.length - 1]
                .start || undefined;
        if (date) {
            date = new Date(date);
        }
    }
    return date;
}

function isRecent(phaseDate: Date) {
    if (process.env.FEATURE_ALWAYS_SEND_STARTUP_PHASE_CHANGE_EMAIL === "true") {
        return true;
    }
    const TWO_MONTHS_IN_DAYS = 30 * 2;
    return differenceInDays(phaseDate, new Date()) < TWO_MONTHS_IN_DAYS;
}

async function compareAndTriggerChange(
    newStartupInfo: DBStartup,
    previousStartupInfo: DBStartup
) {
    if (
        previousStartupInfo &&
        newStartupInfo.current_phase !== previousStartupInfo.current_phase
    ) {
        const startupInfos = await getDBStartup({ id: newStartupInfo.id });
        if (!startupInfos) {
            return;
        }
        const phase = startupInfos.phases.find(
            (phase) => phase.name === newStartupInfo.current_phase
        );
        if (!phase) {
            return;
        }
        const phaseDate = new Date(phase.start);
        if (isRecent(phaseDate)) {
            if (
                newStartupInfo.current_phase === StartupPhase.PHASE_CONSTRUCTION
            ) {
                if (newStartupInfo.mailing_list) {
                    sendEmail({
                        toEmail: [
                            `${newStartupInfo.mailing_list}@${config.domain}`,
                        ],
                        type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE,
                        bcc: [config.senderEmail],
                        forceTemplate: true,
                        variables: {
                            startup: newStartupInfo.id,
                        },
                    } as SendEmailProps);
                }
            } else if (
                newStartupInfo.current_phase === StartupPhase.PHASE_ACCELERATION
            ) {
                if (newStartupInfo.mailing_list) {
                    sendEmail({
                        toEmail: [
                            `${newStartupInfo.mailing_list}@${config.domain}`,
                        ],
                        type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_ACCELERATION_PHASE,
                        bcc: [config.senderEmail],
                        forceTemplate: true,
                        variables: {
                            startup: newStartupInfo.id,
                        },
                    });
                }
            }
        }
        console.info(
            `Changement de phase de startups pour ${newStartupInfo.id}`
        );
    }
}

async function getOrCreateSponsors(
    sponsors: Sponsor[],
    startup: StartupInfo
): Promise<dbSponsorSchemaType[]> {
    const dbSponsors: dbSponsorSchemaType[] = [];
    for (const sponsorId of startup.attributes.sponsors) {
        const sponsor = sponsors.find((s) => s.ghid === sponsorId);
        if (sponsor) {
            dbSponsors.push(
                await getOrCreateSponsor({
                    ghid: sponsor.ghid,
                    name: sponsor.name,
                    acronym: sponsor.acronym,
                    domaine_ministeriel: sponsor.domaine_ministeriel,
                    type: sponsor.type,
                })
            );
        }
    }
    return dbSponsors;
}

async function getOrCreateIncubator(
    incubators: Omit<Incubator, "id">[],
    startup: StartupInfo
): Promise<dbIncubator | undefined> {
    try {
        const incubator = incubators.find(
            (i) => i.ghid === startup.relationships.incubator.data.id
        );
        if (incubator) {
            return getOrCreateDBIncubator({
                ghid: incubator.ghid,
                owner_id: (
                    await getDBSponsor({
                        ghid: (incubator.owner || "").replace(
                            "/organisations/",
                            ""
                        ),
                    })
                )?.id,
                title: incubator.title,
                contact: incubator.contact,
                address: incubator.address,
                website: incubator.website,
                github: incubator.github,
            });
        }
    } catch (e) {
        console.error(e);
    }
    return;
}

export async function syncBetagouvStartupAPI() {
    const startups: StartupInfo[] = await betagouv.startupsInfos();
    const startupDetailsInfo: Startup[] = await betagouv.startupInfos();
    const allSponsors = await betagouv.sponsors();
    const allIncubators = await betagouv.incubators();
    const members = await getAllUsersPublicInfo();

    for (const startup of startups) {
        console.log(`working on startup : ${startup.id}`);
        const previousStartupInfo: DBStartup = await db("startups")
            .where({ id: startup.id })
            .first();
        const startupDetailInfo = startupDetailsInfo.find(
            (s) => s.id === startup.id
        );
        if (!startupDetailInfo) {
            continue;
        }
        let has_intra = false;
        let has_coach = false;
        for (const member of startupDetailInfo.active_members) {
            if (
                members.find(
                    (m) =>
                        m.username === member &&
                        m.domaine === Domaine.INTRAPRENARIAT
                )
            ) {
                has_intra = true;
            }
            if (
                members.find(
                    (m) =>
                        m.username === member && m.domaine === Domaine.COACHING
                )
            ) {
                has_coach = true;
            }
        }

        const nb_total_members = new Set([
            ...startupDetailInfo.active_members,
            ...startupDetailInfo.expired_members,
            ...startupDetailInfo.previous_members,
        ]);
        const res = await getLastCommitFromFile(
            `content/_startups/${startup.id}.md`,
            "master"
        );
        const sponsors = await getOrCreateSponsors(allSponsors, startup);
        const incubator = await getOrCreateIncubator(allIncubators, startup);
        const newStartupInfo: dbStartupSchemaType = {
            id: startup.id,
            name: startup.attributes.name,
            pitch: startup.attributes.pitch,
            stats_url: startup.attributes.stats_url,
            stats: startup.attributes.stats,
            link: startup.attributes.link,
            repository: startup.attributes.repository,
            contact: startup.attributes.contact,
            website: startup.attributes.website,
            incubator_id: incubator ? incubator.uuid : undefined,
            analyse_risques: startup.attributes.analyse_risques,
            analyse_risques_url: startup.attributes.analyse_risques_url,
            content_url_encoded_markdown:
                startup.attributes.content_url_encoded_markdown,
            accessibility_status: startup.attributes.accessibility_status,
            dashlord_url: startup.attributes.dashlord_url,
            github: startup.attributes.github,
            phases: startup.attributes.phases.map((phase: Phase) =>
                phaseSchema.parse({
                    ...phase,
                    end: phase.end ? new Date(phase.end) : undefined,
                    start: phase.start ? new Date(phase.start) : undefined,
                })
            ),
            current_phase: getCurrentPhase(startup),
            current_phase_date: getCurrentPhaseDate(startup),
            mailing_list: previousStartupInfo
                ? previousStartupInfo.mailing_list
                : undefined,
            incubator: startup.relationships
                ? startup.relationships.incubator.data.id
                : undefined,
            nb_active_members: startupDetailInfo.active_members.length,
            last_github_update:
                res.data && res.data.length
                    ? new Date(res.data[0].commit.committer.date)
                    : undefined,
            nb_total_members: Array.from(nb_total_members).length,
            has_intra,
            has_coach,
            // sponsors: [],
            budget_url: startup.attributes.budget_url,
        };
        createOrUpdateStartup({
            ...newStartupInfo,
            organization_ids: sponsors.map((s) => s.uuid),
        });
        // if (previousStartupInfo) {
        //     await db("startups")
        //         .update({
        //             ...newStartupInfo,
        //             phases: JSON.stringify(newStartupInfo.phases),
        //         })
        //         .where({
        //             id: startup.id,
        //         });
        // } else {
        //     await db("startups").insert({
        //         ...newStartupInfo,
        //         phases: JSON.stringify(newStartupInfo.phases),
        //     });
        // }
        // try {
        //     await compareAndTriggerChange(
        //         {
        //             ...newStartupInfo,
        //             phases: startup.attributes.phases,
        //         } as unknown as DBStartup,
        //         previousStartupInfo
        //     );
        // } catch (e) {
        //     Sentry.captureException(e);
        //     console.error(e);
        // }
    }
    console.log("LCS SYNC FINISHED");
}
