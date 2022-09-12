import config from "@/config";
import axios from "axios";
import { getMattermostConfig } from ".";

export async function getAllChannels(i = 0) {
    const mattermostChannels = await axios
      .get(`${config.mattermostURL}/api/v4/sharedchannels/`, {
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
    const nextPageMattermostChannels = await getAllChannels(
      i + 1
    );
    return [...mattermostChannels, ...nextPageMattermostChannels];
  }

  