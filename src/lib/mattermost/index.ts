import config from '@config';
import * as mattermost from './mattermost'
import * as getMattermostUsersStatus from './getMattermostUsersStatus'
import { getActiveMattermostUsers } from './getActiveMattermostUsers';

export const getMattermostConfig = () => {
  if (!config.mattermostBotToken) {
    const errorMessage =
      'Unable to launch mattermost api calls without env var mattermostBotToken';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return {
    headers: {
      Authorization: `Bearer ${config.mattermostBotToken}`,
    },
  };
};


export default {
  ...mattermost,
  ...getMattermostUsersStatus,
  ...getActiveMattermostUsers
}