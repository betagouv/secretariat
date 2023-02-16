import { MattermostUser } from "@/lib/mattermost";
import config from '@config';
import * as mattermost from '@/lib/mattermost';
import { getMattermostUsersActiveGithubUsersNotInTeam } from ".";
  
export async function addUsersNotInCommunityToCommunityTeam() {
    console.log(`Ajout des utilisateurs existant à l'espace communauté`)
    const mattermostUsersActiveGithubUsersNotInCommunityTeam: MattermostUser[] =
      await getMattermostUsersActiveGithubUsersNotInTeam(config.mattermostTeamId);
    let userCount = 0
    console.log('Log mattermost users not in community', mattermostUsersActiveGithubUsersNotInCommunityTeam.length)
    for (const mattermostUser of mattermostUsersActiveGithubUsersNotInCommunityTeam) {
      try {
        await mattermost.addUserToTeam(mattermostUser.id, config.mattermostTeamId)
        userCount += 1
      } catch (e) {
        console.error(`Impossible d'inviter l'utilisateur ${mattermostUser.username} à la team communauté`, e)
      }
    }
    return userCount
  }
  