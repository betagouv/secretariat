import jwt from 'jsonwebtoken';
import betagouv from "@/betagouv";
import { sendEmail } from "@/config/email.config";
import { DBUser, CommunicationEmailCode } from "@/models/dbUser/dbUser";
import { Member } from "@/models/member";
import { EMAIL_TYPES } from "@/modules/email";
import config from "@config";
import knex from "@/db";

export const sendOnboarderRequestEmail = async function (newcomerId: string, onboarderId: string) {
    const usersInfos : Member[] = await betagouv.usersInfos()
    const newcomer = usersInfos.find(user => user.id === newcomerId) 
    const onboarder = usersInfos.find(user => user.id === onboarderId) 
  
    const token = jwt.sign(
      {
        newcomerId: newcomer.id,
        onboarderId: onboarder.id,
      },
      config.secret,
      { expiresIn: 7 * 24 * 3600 }
    );
  
    const marrainageAcceptUrl = `${config.protocol}://${config.host
      }/marrainage/accept?details=${encodeURIComponent(token)}`;
    const marrainageDeclineUrl = `${config.protocol}://${config.host
      }/marrainage/decline?details=${encodeURIComponent(token)}`;
  
    const startup: string | null = newcomer.startups && newcomer.startups.length > 0 ? newcomer.startups[0] : null;
  
    const dbOnboarder: DBUser = await knex('users').where({
      username: onboarder.id
    }).first()
    try {
      const email = dbOnboarder.communication_email === CommunicationEmailCode.SECONDARY && dbOnboarder.secondary_email ? dbOnboarder.secondary_email : dbOnboarder.primary_email
      return await sendEmail({
        toEmail: [email],
        type: EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL,
        variables: {
          newcomer,
          onboarder,
          marrainageAcceptUrl,
          marrainageDeclineUrl,
          startup,
        }
      });
    } catch (err) {
      throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }
  }