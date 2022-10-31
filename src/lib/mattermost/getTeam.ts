import config from "@/config";
import { getMattermostConfig } from "@/config/mattermost/mattermost.config";
import axios from "axios";

export async function getTeam(teamId : string) {
    try {
        return await axios
        .get(`${config.mattermostURL}/api/v4/teams/${teamId}`, {
            ...getMattermostConfig(),
        })
        .then((response) => response.data);
    } catch (e) {
        throw new Error(`Cannot get team info for ${teamId} : ${e}`)
    }
}
  