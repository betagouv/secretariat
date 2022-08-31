import crypto from 'crypto'
import { MemberWithPrimaryEmail } from "@/models/member";
import { EMAIL_TYPES } from "@/modules/email";
import * as mattermost from '@/lib/mattermost';

export async function createUsersByEmail() {
    let activeGithubUsersUnregisteredOnMattermost : MemberWithPrimaryEmail[] =
      await getActiveGithubUsersUnregisteredOnMattermost();
    activeGithubUsersUnregisteredOnMattermost =
      activeGithubUsersUnregisteredOnMattermost.filter((user) => {
        const userStartDate = new Date(user.start).getTime();
        // filter user that have have been created after implementation of this function
        return userStartDate >= new Date('2021-07-08').getTime();
      });
    const results = await Promise.all(
      activeGithubUsersUnregisteredOnMattermost.map(async (user) => {
        const email = user.primary_email;
        const password = crypto.randomBytes(20).toString('base64').slice(0, -2);
        try {
          await mattermost.createUser({
            email,
            username: user.id,
            // mattermost spec : password must contain at least 20 characters
            password,
          });
  
          await sendEmail({
            toEmail: [email],
            type: EMAIL_TYPES.EMAIL_MATTERMOST_ACCOUNT_CREATED,
            variables: {
              resetPasswordLink: 'https://mattermost.incubateur.net/reset_password',
            }
          })
        } catch (err) {
          console.error(
            "Erreur d'ajout des utilisateurs à mattermost", err
          );
        }
      })
    );
    return results;
  }

function getActiveGithubUsersUnregisteredOnMattermost(): MemberWithPrimaryEmail[] | PromiseLike<MemberWithPrimaryEmail[]> {
    throw new Error("Function not implemented.");
}


function sendEmail(arg0: { toEmail: any[]; type: any; variables: { resetPasswordLink: string; }; }) {
    throw new Error("Function not implemented.");
}
