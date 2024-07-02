import { getActiveUsersUnregisteredOnMattermost } from ".";
import * as mattermost from "@/lib/mattermost";
import config from "@/server/config";

export async function inviteUsersToTeamByEmail() {
    const activeGithubUsersNotInCommunityTeam =
        await getActiveUsersUnregisteredOnMattermost();
    const results = await mattermost.inviteUsersToTeamByEmail(
        activeGithubUsersNotInCommunityTeam
            .map((user) => user.primary_email)
            .slice(0, 19),
        config.mattermostTeamId
    );
    return results;
}
