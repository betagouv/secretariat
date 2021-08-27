import jwt from "jsonwebtoken";
import config from "../config";
import BetaGouv from "../betagouv";
import knex from '../db';

async function getValidateDepartureTokenData(token) {
  if (!token) {
    throw new Error('Token missing');
  }
  const jwtIsValid = jwt.verify(token, config.secret);
  if (!jwtIsValid) {
    throw new Error('Invalid token in link');
  }
  const data = jwt.decode(token, { json: true });
  if (!data) {
    throw new Error('Corrupted data in token');
  }

  const { userId } = data;
  const userInfos = await BetaGouv.usersInfos();
  return {
    userId: userInfos.find((x) => x.id === userId),
  };
}

function redirectOutdatedDeparture(req, res) {
  req.flash('message', "Merci de ta réponse. Cette demande est expirée mais tu recevras à nouveau ce mail deux jours avant ton départ 🙂");
  return res.redirect('/');
}

export async function validateDeparture(req, res) {
  try {
    const { userId } = await getValidateDepartureTokenData(req.query.details);

    await knex('user_departure_state')
      .insert({ username: userId.id, has_validated: true })
      .onConflict('username')
      .merge({ username: userId.id, has_validated: true });

    return res.render('departure', { errors: undefined, accepted: true });
  } catch (err){
    console.error(err);
    if (err.name === 'TokenExpiredError') {
      return redirectOutdatedDeparture(req, res);
    }
    return res.render('departure', { errors: err.message });
  }
}
