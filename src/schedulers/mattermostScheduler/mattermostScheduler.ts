

import betagouv from '@/betagouv';
import { MattermostUser } from '@/lib/mattermost';
import { DBUser, EmailStatusCode } from '@/models/dbUser';
import { MemberWithPrimaryEmail, Member } from '@/models/member';
import knex from '@/db';
import * as utils from '@controllers/utils';
import * as mattermost from '@/lib/mattermost';
import { sendInfoToChat } from '@/infra/chat';
import config from '@/config';

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
    return user.primary_email && user.primary_email_status === EmailStatusCode.EMAIL_ACTIVE
  }

  export const sendMessageToMattermostUsersWithUnallowedEmails = async(teamId: string) : Promise<void> => {
    const allMattermostUsers : MattermostUser[] = await mattermost.getUserWithParams({
      in_team: teamId,
      active: true
    });
    const usersWithNonAppropriateEmails = allMattermostUsers.filter(user => {
      const domain = user.email.split('@')[1]
      return !(config.MATTERMOST_ALLOWED_DOMAINS).split(',').includes(domain)
    })
    console.log('Users with non appropriate emails', usersWithNonAppropriateEmails);
    for (const user of usersWithNonAppropriateEmails) {
      await sendInfoToChat({
        text: `Bonjour, cet espace mattermost (espace Communauté) n'est autorisé que pour les personnes ayant une adresse d'agent public.
  Généralement une adresse @beta.gouv.fr. Tu as probablement changé ton adresse sans le savoir. 
  Nous t'invitons à utiliser ton adresse d'agent public, sinon ton compte risque d'être désactivé la semaine prochaine.`,
        username: user.username,
        channel: 'secretariat',
      })
    }
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
    const concernedUsers: MemberWithPrimaryEmail[] = activeGithubUsers.map((user: Member) => {
      const dbUser = findDBUser(dbUsers, user)
      return mergedMemberAndDBUser(user, dbUser);
    }).filter(filterActiveUser)
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
