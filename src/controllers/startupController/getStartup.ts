import betagouv from "@/betagouv";
import db from "@/db";
import { PULL_REQUEST_STATE } from "@/models/pullRequests";
import config from "@/config";
import { Member } from "@/models/member";
import { PHASE_READABLE_NAME, Startup } from "@/models/startup";

function getCurrentPhase(startup : Startup) {
  return startup.phases ? startup.phases[startup.phases.length - 1].name : undefined
}

export async function getStartup({ startup }: { startup: string }) {
  try {
    const startupInfos: Startup = await betagouv.startupInfosById(startup)
    const usersInfos: Member[] = await betagouv.usersInfos()
    const members : {
      expired_members: Member[],
      active_members: Member[],
      previous_members: Member[],
    } = {
      expired_members: [],
      active_members: [],
      previous_members: []
    }
    const memberTypes = ['expired_members', 'active_members', 'previous_members']
    memberTypes.forEach((memberType) => {
      members[memberType] = startupInfos[memberType].map(
        member => usersInfos.find(user => user.id === member))
    })
    const updatePullRequest = await db('pull_requests')
    .where({
      username: '',
      status: PULL_REQUEST_STATE.PR_STARTUP_UPDATE_CREATED
    })
    .orderBy('created_at', 'desc')
    .first()
    const title = `Startup ${startup}`;
    return {
      title,
      // currentUserId: req.auth.id,
      startupInfos: startupInfos,
      currentPhase: PHASE_READABLE_NAME[getCurrentPhase(startupInfos)],
      members,
      isAdmin: false,//config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
      subActiveTab: 'list',
      domain: config.domain,
      activeTab: 'startups',
      // errors: req.flash('error'),
      // messages: req.flash('message'),
      updatePullRequest
    }
  } catch (err) {
    console.error(err);
    throw new Error('Impossible de récupérer vos informations.');
  }
}