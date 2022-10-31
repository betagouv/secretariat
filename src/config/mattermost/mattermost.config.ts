import config from "..";

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