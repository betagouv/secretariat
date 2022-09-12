import config from "@/config";
import axios from "axios";
import { getMattermostConfig } from ".";

export async function getAllChannels() {
    const mattermostChannels = await axios
      .get(`${config.mattermostURL}/api/v4/channels`, {
        ...getMattermostConfig(),
      })
      .then((response) => response.data);
    return mattermostChannels
  }

  