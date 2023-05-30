

import betagouv from '@/betagouv';
import { MattermostUser } from '@/lib/mattermost';
import { DBUser, EmailStatusCode } from '@/models/dbUser/dbUser';
import { MemberWithPrimaryEmail, Member } from '@/models/member';
import knex from '@/db';
import * as utils from '@controllers/utils';
import * as mattermost from '@/lib/mattermost';

const mergedMemberAndDBUser = (user: Member, dbUser: DBUser) => {
    return {
      ...user,
      primary_email_status: dbUser ? dbUser.primary_email_status : undefined,
      primary_email: dbUser ? dbUser.primary_email : undefined
    }
  }
  
  const findDBUser = (dbUsers: DBUser[], user: Member) => {
    return dbUsers.find((x) => x.username === user.id);
  }
  
  const filterActiveUser = (user) => {
    return user.primary_email && [EmailStatusCode.EMAIL_ACTIVE, EmailStatusCode.EMAIL_REDIRECTION_ACTIVE].includes(user.primary_email_status)
  }

  export const getActiveGithubUsersUnregisteredOnMattermost = async () : Promise<MemberWithPrimaryEmail[]> => {
    const allMattermostUsers : MattermostUser[] = await mattermost.getUserWithParams();
    const dbUsers : DBUser[] = await knex('users').select();
    const githubUsers : Member[] = await betagouv.usersInfos();
    const activeGithubUsers : Member[] = githubUsers.filter((x) => !utils.checkUserIsExpired(x));
    const concernedUsers: MemberWithPrimaryEmail[] = activeGithubUsers.map((user: Member) => {
      const dbUser = findDBUser(dbUsers, user)
      return mergedMemberAndDBUser(user, dbUser);
    }).filter(filterActiveUser)
    const allMattermostUsersEmails = allMattermostUsers.map(
      (mattermostUser) => mattermostUser.email
    );
    return concernedUsers.filter(
      (user) => !allMattermostUsersEmails.includes(user.primary_email)
    );
  };

    
export const getMattermostUsersActiveGithubUsersNotInTeam = async (teamId: string) : Promise<MattermostUser[]> => {
    const allMattermostUsers : MattermostUser[] = await mattermost.getUserWithParams({ not_in_team: teamId });
    const dbUsers : DBUser[] = await knex('users').select();
    const githubUsers : Member[] = await betagouv.usersInfos();
    const activeGithubUsers : Member[] = githubUsers.filter((x) => !utils.checkUserIsExpired(x));
    console.log(`Active github users ${activeGithubUsers.length}`)
    const concernedUsers: MemberWithPrimaryEmail[] = activeGithubUsers.map((user: Member) => {
      const dbUser = findDBUser(dbUsers, user)
      return mergedMemberAndDBUser(user, dbUser);
    }).filter(filterActiveUser)
    console.log(`Active github users ${activeGithubUsers.length}`)
    const concernedUsersEmails = concernedUsers.map(user => user.primary_email)
    return allMattermostUsers.filter(
      (user) => concernedUsersEmails.includes(user.email)
    );
};

export const getMattermostUsersActiveGithubUsersInTeam = async (teamId: string) : Promise<MattermostUser[]> => {
  const allMattermostUsers : MattermostUser[] = await mattermost.getUserWithParams({ in_team: teamId });
  const dbUsers : DBUser[] = await knex('users').select();
  const githubUsers : Member[] = await betagouv.usersInfos();
  const activeGithubUsers : Member[] = githubUsers.filter((x) => !utils.checkUserIsExpired(x));
  console.log(`Active github users ${activeGithubUsers.length}`)
  const concernedUsers: MemberWithPrimaryEmail[] = activeGithubUsers.map((user: Member) => {
    const dbUser = findDBUser(dbUsers, user)
    return mergedMemberAndDBUser(user, dbUser);
  }).filter(filterActiveUser)
  console.log(`Active github users ${activeGithubUsers.length}`)
  const concernedUsersEmails = concernedUsers.map(user => user.primary_email)
  return allMattermostUsers.filter(
    (user) => concernedUsersEmails.includes(user.email)
  );
};

export * from './createUsersByEmail'
export * from './inviteUserToTeamByEmail'
export * from './moveUsersToAlumniTeam'
export * from './reactivateUsers'
export * from './removeUsersFromCommunityTeam'
export * from './addUsersNotInCommunityToCommunityTeam'
export * from './syncMattermostUserWithMattermostMemberInfosTable'
export * from './syncMattermostUserStatusWithMattermostMemberInfosTable'
export * from './sendGroupeDeSoutienReminder'
  