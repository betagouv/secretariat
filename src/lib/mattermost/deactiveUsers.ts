import config from "@/config";
import { getMattermostConfig } from "@/config/mattermost/mattermost.config";
import axios from "axios";

export async function deactiveUsers(userId) {
    try {
      const response = await axios.delete(
        `${config.mattermostURL}/api/v4/users/${userId}`,
        getMattermostConfig()
      );
      console.log(`Le compte mattermost ${userId} a été désactivé`);
      return response.data;
    } catch (err) {
      console.error("Erreur d'activation de l‘utilisateurs à mattermost", err);
    }
  }
