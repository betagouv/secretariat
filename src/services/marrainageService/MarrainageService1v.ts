import _ from 'lodash/array';

import db from "@/db";
import { MarrainageService } from ".";
import { Marrainage } from "@models/marrainage";
import { Domaine, Member } from '@models/member';
import * as utils from '@controllers/utils';
import knex from '@/db';
import { DBUser, EmailStatusCode } from "@/models/dbUser/dbUser";
import betagouv from '@/betagouv';
import { sendEmail } from '@/config/email.config';
import { EMAIL_TYPES } from '@/modules/email';


export class MarrainageService1v implements MarrainageService {
    private _sendOnboarderRequestEmail: (newcomerId: string, onboarderId: string) => Promise<null>;
    senderEmail: string;

    constructor(
        senderEmail: string,
        sendOnboarderRequestEmail: (newcomerId:string, onboarderId: string) => Promise<null>) {
        this._sendOnboarderRequestEmail = sendOnboarderRequestEmail
        this.senderEmail = senderEmail
    }

    async selectRandomOnboarder(newcomerId, domaine) {
        const users: Member[] = await betagouv.usersInfos();
        const minimumSeniority = new Date().setMonth(new Date().getMonth() - 6);
        const existingCandidates: string[] = await db('marrainage')
            .select('last_onboarder')
            .where({ completed: false })
            .distinct()
            .then((marrainages: Marrainage[]) => marrainages.map((x) => x.last_onboarder));

        const onboarders = users.filter((x) => {
            const existingCandidate = existingCandidates.includes(x.id);
            const senior = new Date(minimumSeniority) > new Date(x.start);
            const stillActive = !utils.checkUserIsExpired(x);
            const isRequester = x.id === newcomerId;
            return !existingCandidate && senior && stillActive && !isRequester;
        });
        const onboardersFromDomaine = onboarders.filter(onboarder => onboarder.domaine === domaine)
        const onboarderPool = (domaine === Domaine.AUTRE || !onboardersFromDomaine.length) ? onboarders : onboardersFromDomaine
        return onboarderPool[Math.floor(Math.random() * onboarderPool.length)];
    }

    async createMarrainage(newcomerId: string, domaine: string) : Promise<Member> {
        const onboarder = await this.selectRandomOnboarder(newcomerId, domaine)
        if (!onboarder) {
            const recipientEmailList = [this.senderEmail];
            const errorMessage = "Aucun·e marrain·e n'est disponible pour le moment";
            await sendEmail({
              type: EMAIL_TYPES.MARRAINAGE_REQUEST_FAILED,
              toEmail: recipientEmailList,
              variables: {
                errorMessage,
                userId: newcomerId
              }
            },
            );
            throw new Error(errorMessage);
          }
        
          await knex('marrainage').insert({
            username: newcomerId,
            last_onboarder: onboarder.id,
          });
          await this._sendOnboarderRequestEmail(newcomerId, onboarder.id);
          return onboarder
    }

    async updateMarrainage(newcomer: Member) : Promise<Member> {
        const marrainageDetailsReponse = await knex('marrainage')
        .select()
        .where({ username: newcomer.id, completed: false });
    
      if (marrainageDetailsReponse.length !== 1) {
        throw new Error(
          "Il n'y a pas de demande de marrainage existant pour cette personne."
        );
      }
      const onboarder = await this.selectRandomOnboarder(newcomer.id, newcomer.domaine);
    
      if (!onboarder) {
        throw new Error(
          `Erreur lors de la relance de marrainage pour ${newcomer.id} : Aucun·e marrain·e n'est disponible pour le moment.`
        );
      }
      console.log(`Select ${onboarder.id} (${onboarder.domaine} for ${newcomer.id} (${newcomer.domaine}))`)

        await knex('marrainage')
        .where({ username: newcomer.id })
        .increment('count', 1)
        .update({ last_onboarder: onboarder.id, last_updated: knex.fn.now() });
        await this._sendOnboarderRequestEmail(newcomer.id, onboarder.id);
        return onboarder
    }

    async getUsersWithoutMarrainage() : Promise<DBUser[]> {
        const dateFeatureAdded = new Date('01/23/2022');
        const users : DBUser[] = await knex('users').where({
          primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        }).andWhere('created_at', '>', dateFeatureAdded)
        const marrainages = await knex('marrainage').whereIn('username', users.map(user => user.username))
        return _.differenceWith(users, marrainages, (user, marrainage) => user.username === marrainage.username)
    }
}