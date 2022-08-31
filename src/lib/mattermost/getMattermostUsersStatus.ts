import config from "@/config";
import axios from "axios";
import { getMattermostConfig } from ".";

export async function getMattermostUsersStatus(userIds : string[]) {
    const mattermostUsersStatus = await axios
      .get(`${config.mattermostURL}/api/v4/users/status/ids`, {
        params: {
            ids: userIds
        },
        ...getMattermostConfig(),
      }
    )
    .then((response) => response.data);
    return mattermostUsersStatus
}