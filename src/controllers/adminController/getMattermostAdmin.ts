import config from '@/config';
import { MattermostChannel } from '@/lib/mattermost';
import { getMattermostUsersWithStatus } from '@/schedulers/mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam';
import { getAllChannels } from '@/infra/chat';
import { EmailStatusCode } from '@/models/dbUser/dbUser';

export async function getMattermostAdmin(req) {
  let users = []

  const channels : MattermostChannel[] = await getAllChannels(config.mattermostTeamId) 
  try {
    const title = 'Admin Mattermost';
    return {
      title,
      users,
      channelOptions: channels.map(channel => ({
        value: channel.name,
        label: channel.display_name
      })),
      currentUserId: req.auth.id,
      activeTab: 'admin',
      isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
      // errors: req.flash('error'),
      // messages: req.flash('message'),
      request: req
    }
  } catch (err) {
    console.error(err);
    throw new Error('Erreur interne : impossible de récupérer les informations de la communauté');
  }
}


