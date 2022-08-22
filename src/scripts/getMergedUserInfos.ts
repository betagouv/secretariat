import betagouv from "@/betagouv";
import knex from "@/db";
import { checkUserIsExpired } from "@controllers/utils";

const getIntraUsersEmails = async () => {
    const users = await betagouv.usersInfos();
    const members = users.filter(
      (user) => !checkUserIsExpired(user)
    );
    const intras = members.filter(member => member.domaine === 'Intraprenariat')
    const intraDBUsers = await knex('users').whereIn('username', intras.map(intra => intra.id))
    intraDBUsers.forEach(user => {
        console.log(`${user.secondary_email}`)
    });
}

getIntraUsersEmails()
