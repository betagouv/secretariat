import config from "@/config";
import axios from "axios";
import { getMattermostConfig } from ".";

export async function getAllChannels(i = 0) {
  try {
    const mattermostChannels = await axios
      .get(`${config.mattermostURL}/api/v4/channels/`, {
        params: {
          per_page: 200,
          page: i
        },
        ...getMattermostConfig(),
      })
      .then((response) => response.data);
    if (!mattermostChannels.length) {
      return [];
    }
    return mattermostChannels
    } catch(e) {
      console.log(`Mattermost : Errors while gettings channels ${e}`)
      return []
    }
  }

  