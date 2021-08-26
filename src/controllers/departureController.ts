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

export async function validateDeparture(req, res) {
  try {
    const { userId } = await getValidateDepartureTokenData(req.query.details);

    const marrainageDetailsReponse = await knex('user_departure_state')
      .insert({ username: userId , has_validated: true })
      .onConflict('username')
      .merge({ username: userId, has_validated: true });
  } catch (err){
    console.log(err);
  }
}
