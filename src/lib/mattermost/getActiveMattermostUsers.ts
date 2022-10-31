import axios from "axios";
import config from "@/config";
import { getMattermostConfig } from "@/config/mattermost/mattermost.config";

interface ParamsType {
    in_team?: string
}

export async function getActiveMattermostUsers(params : ParamsType = {}, i : number = 0) {
    const mattermostUsers = await axios
      .get(`${config.mattermostURL}/api/v4/users`, {
        params: {
          ...params,
          per_page: 200,
          page: i,
          active: true,
        },
        ...getMattermostConfig(),
      })
      .then((response) => response.data);
    if (!mattermostUsers.length) {
      return [];
    }
    const nextPageMattermostUsers = await getActiveMattermostUsers(
      params,
      i + 1
    );
    return [...mattermostUsers, ...nextPageMattermostUsers];
  }