import { MattermostUser } from "@/lib/mattermost";
import config from '@config';
import * as mattermost from '@/lib/mattermost';
import { getMattermostUsersActiveGithubUsersInTeam } from ".";
  
export async function addUsersNotInCommunityToCommunityTeam() {
    console.log(`Ajout des utilisateurs existant à l'espace communauté`)
    // mattermost V4 api does not work as expected on current version we are using 7.1.4
    // per_page and not_in_team params does not do pagination
    // we use get user in team "Alumni" instead for the time being
    // const mattermostUsers: MattermostUser[] =
    //   await getMattermostUsersActiveGithubUsersNotInTeam(config.mattermostTeamId);
    const mattermostUsers: MattermostUser[] = await getMattermostUsersActiveGithubUsersInTeam(config.mattermostAlumniTeamId);
    let userCount = 0
    console.log('Log mattermost users not in community', mattermostUsers.length)
    for (const mattermostUser of mattermostUsersm) {
      try {
        await mattermost.addUserToTeam(mattermostUser.id, config.mattermostTeamId)
        userCount += 1
      } catch (e) {
        console.error(`Impossible d'inviter l'utilisateur ${mattermostUser.username} à la team communauté`, e)
      }
    }
    return userCount
  }
  