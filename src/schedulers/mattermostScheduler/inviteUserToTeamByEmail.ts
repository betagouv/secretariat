import config from "@/config";
import { MemberWithPrimaryEmailInfo } from "@/models/member";
import * as mattermost from '@/lib/mattermost';
import { getActiveGithubUsersUnregisteredOnMattermost } from ".";

export async function inviteUsersToTeamByEmail() {
    const activeGithubUsersNotInCommunityTeam: MemberWithPrimaryEmailInfo[] =
      await getActiveGithubUsersUnregisteredOnMattermost();
    const results = await mattermost.inviteUsersToTeamByEmail(
      activeGithubUsersNotInCommunityTeam
        .map((user) => user.primary_email)
        .slice(0, 19),
      config.mattermostTeamId
    );
    return results;
  }
  