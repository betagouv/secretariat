import { checkUserIsExpired } from '../controllers/utils';
import * as BetaGouv from '../betagouv';
import { inviteUserByUsername, getAllOrganizationMembers } from '../lib/github'

// get users that are member (got a github card) and mattermost account that is not in the team
const getUnregisteredMemberActifs = async (activeGithubUsers, allGithubOrganizationMembers) => {
    const allGithubOrganizationMembersUsername = allGithubOrganizationMembers.map((githubOrganizationMember) => githubOrganizationMember.username);
    console.log('allGithubOrganizationMembersUsername:', allGithubOrganizationMembersUsername)
    console.log('activeGithubUsers:', activeGithubUsers)

    const unregisteredMemberActifs = activeGithubUsers.filter(
      (user) => !allGithubOrganizationMembersUsername.includes(user.github),
    );
    console.log('unregisteredMemberActifs', unregisteredMemberActifs)

    return unregisteredMemberActifs;
  };


const addGithubUserToOrganization = async () => {

    const allGithubOrganizationMembers = await getAllOrganizationMembers();
    const users = await BetaGouv.usersInfos();

    const activeGithubUsers = users.filter((x) => {
      const stillActive = !checkUserIsExpired(x);
      return stillActive && x.github;
    });

    const unregisteredMemberActifs = await getUnregisteredMemberActifs(activeGithubUsers, allGithubOrganizationMembers);
    
    unregisteredMemberActifs.forEach(async member => {
        // const githubUser = await getUsername(member.github)
        inviteUserByUsername(member)
    })
}

export default addGithubUserToOrganization