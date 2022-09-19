import axios from "axios";

import config from "@/config";
import { getMattermostConfig } from ".";

export async function createUser({ email, username, password }, inviteId) {
    if (!inviteId) {
      const errorMessage =
        'Unable to launch createUser without env var MATTERMOST_INVITE_ID';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    let res;
    try {
      res = await axios
        .post(
          `${config.mattermostURL}/api/v4/users?iid=${inviteId}`,
          {
            email,
            username,
            password,
          },
          getMattermostConfig()
        )
        .then((response) => response.data);
    } catch (err) {
      throw new Error(`Erreur d'ajout de l'utilisateurs ${username} à mattermost : ${err}`)
    }
    console.log("Ajout de l'utilisateur", email, username);
    return res;
}
