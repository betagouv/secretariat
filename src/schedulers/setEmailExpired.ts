import { Member } from "@models/member";
import { DBUser } from "@/models/dbUser/dbUser";
import BetaGouv from "@/betagouv";
import * as utils from "@controllers/utils";
import knex from "@/db";
import { EmailStatusCode } from "@/models/dbUser/dbUser";
import config from "@config";

export async function setEmailExpired(optionalExpiredUsers?: Member[]) {
    let expiredUsers: Member[] = optionalExpiredUsers;
    let dbUsers : DBUser[];
    if (!expiredUsers) {
      const users: Member[] = await BetaGouv.usersInfos();
      expiredUsers = users.filter((user) => {
        return (
          utils.checkUserIsExpired(user, 30)
        );
      });
      const today = new Date();
      const todayLess30days = new Date()
      todayLess30days.setDate(today.getDate() - 30)
      dbUsers = await knex('users')
        .whereIn('username', expiredUsers.map(user => user.id))
        .andWhere({ primary_email_status: EmailStatusCode.EMAIL_SUSPENDED })
        .andWhere("primary_email_status_updated_at", '<', todayLess30days)
        .andWhere("primary_email", 'NOT LIKE', `%@${config.domain}%`)
    }
    for (const user of dbUsers) {
      try {
        await knex('users').where({
          username: user.username
        }).update({
          primary_email_status: EmailStatusCode.EMAIL_EXPIRED
        })
        console.log(`Email principal pour ${user.username} défini comme expiré`);
      } catch {
        console.log(
          `Erreur lors du changement de statut en expiré de l'email principal pour ${user.username}`
        );
      }
    }
  }
