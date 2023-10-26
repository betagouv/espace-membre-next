import betagouv from "@/betagouv";
import { DBUser, statusOptions, genderOptions } from "@/models/dbUser/dbUser";
import { MemberWithPermission } from "@/models/member";
import { PULL_REQUEST_STATE } from "@/models/pullRequests";
import db from "@/db";
import { StartupInfo } from "@/models/startup";
import config from "@/config";
import { userInfos } from "@/controllers/userUtils";

export async function getBaseInfoUpdate(req) {
    try {
      const [currentUser] : [MemberWithPermission, DBUser] = await Promise.all([
        (async () => userInfos(req.auth.id, true))(),
        (async () => {
          const rows = await db('users').where({ username: req.auth.id });
          return rows.length === 1 ? rows[0] : null
        })()
      ]);
      const title = 'Mon compte';
      const formValidationErrors = {}
      const startups : StartupInfo[] = await betagouv.startupsInfos();
      const startupOptions = startups.map(startup => {
        return {
          value: startup.id,
          label: startup.attributes.name
        }
      })
      const userStartups = (currentUser.userInfos.startups || [])
        .map(userStartup => {
          const startupInfo = startups.find(s => s.id === userStartup)
          return {
            value: userStartup,
            label: startupInfo?.attributes.name
          }
        })
      const userPreviousStartups = (currentUser.userInfos.previously || [])
      .map(userStartup => {
        const startupInfo = startups.find(s => s.id === userStartup)
        return {
          value: userStartup,
          label: startupInfo?.attributes.name
        }
      })
      const updatePullRequest = await db('pull_requests')
        .where({
          username: req.auth.id,
          status: PULL_REQUEST_STATE.PR_MEMBER_UPDATE_CREATED
        })
        .orderBy('created_at', 'desc')
        .first()
      console.log('LCS BASE INFO 0')
      console.log(currentUser.userInfos)
      return {
          title,
          formValidationErrors,
          isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
          currentUserId: req.auth.id,
          genderOptions,
          statusOptions,
          startupOptions,
          activeTab: 'account',
          username: req.auth.id,
          updatePullRequest,
          formData: {
            startups: userStartups || [],
            role: currentUser.userInfos.role,
            missions: currentUser.userInfos.missions,
            end: currentUser.userInfos.end,
            start: currentUser.userInfos.start,
            previously: userPreviousStartups
          },
          errors: ['errors'],
          messages: ['messages'],
          request: req
        }
    } catch (err) {
      console.log(err)
      return
    }
  }
  
