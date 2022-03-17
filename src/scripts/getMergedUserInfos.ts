import betagouv from "../betagouv";
import { Member } from "../models/member"
import knex from "../db";

const getIntraUsersEmails = async () => {
    const members : Member[] = await betagouv.getActiveRegisteredOVHUsers()
    const intras = members.filter(member => member.domaine === 'Intraprenariat')
    const intraDBUsers = await knex('users').whereIn('username', intras.map(intra => intra.id))
    intraDBUsers.forEach(user => {
        console.log(`${user.secondary_email}`)
    });
}

getIntraUsersEmails()
