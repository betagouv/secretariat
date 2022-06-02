import { checkUserIsExpired } from '../controllers/utils';
import BetaGouv from '../betagouv';
import db from '../db';
import { Member } from '../models/member';

export async function syncBetagouvUserAPI() {
  let members : Member[] = await BetaGouv.usersInfos()
  members = members.filter(member => !checkUserIsExpired(member))
  for (const member of members) {
    await db('users').update({
      domaine: member.domaine
    });
  }
}
