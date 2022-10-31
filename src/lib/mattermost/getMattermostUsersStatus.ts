import config from "@/config";
import axios from "axios";
import { getMattermostConfig } from "@/config/mattermost/mattermost.config";

interface UserStatus {
  user_id: string,
  status: string,
  manual: true,
  last_activity_at: 0
}

export async function getMattermostUsersStatus(userIds : string[]) : Promise<UserStatus[]> {
    const mattermostUsersStatus = await axios
      .post(`${config.mattermostURL}/api/v4/users/status/ids`,
        userIds,
        getMattermostConfig(),
      )
    .then((response) => response.data);
    return mattermostUsersStatus
}
