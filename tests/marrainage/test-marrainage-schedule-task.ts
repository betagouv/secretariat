import nock from 'nock';
import sinon from 'sinon';
import _ from 'lodash/array';

import knex from '@/db';
import { reloadMarrainages, createMarrainages } from '@schedulers/marrainageScheduler';
import { DBUser, EmailStatusCode } from '@/models/dbUser/dbUser';
import betagouv from '@/betagouv';
import { Member } from '@models/member';
import * as Email from '@config/email.config'
import utils from '../utils';

  describe('Marrainage cronjob', () => {
    let clock;
    let sendEmailStub;
    let differenceLodashSpy;

    beforeEach((done) => {
        sendEmailStub = sinon
          .stub(Email, 'sendEmail')
          .returns(Promise.resolve(null));
        differenceLodashSpy = sinon
          .spy(_,'differenceWith')
        
        clock = sinon.useFakeTimers(new Date('2020-01-01T09:59:59+01:00'));
        done();
      });
    
      afterEach((done) => {
        knex('marrainage')
          .truncate()
          .then(() => sendEmailStub.restore())
          .then(() => clock.restore())
          .then(() => done());
        differenceLodashSpy.restore();
        sendEmailStub.restore();
      });

    it('should create marrainage requests', async () => {
      await knex('users').update({
        created_at: new Date('11/01/2021')
      })
      const [membreNouveau] : DBUser[] = await knex('users')
      .where({ username:  'membre.nouveau'}).update({
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        created_at: new Date('01/24/2022')
      }).returning('*')
      await createMarrainages()
      sendEmailStub.calledOnce.should.be.true;
      const marrainage = await knex('marrainage')
        .where({ username: 'membre.nouveau' })
        .select();
      marrainage.length.should.equal(1);
      marrainage[0].username.should.equal('membre.nouveau');
      marrainage[0].last_onboarder.should.not.be.null;
      const onboarderInfo : Member = await betagouv.userInfosById(marrainage[0].last_onboarder)
      const membreNouveauInfo : Member = await betagouv.userInfosById(membreNouveau.username)
      onboarderInfo.domaine.should.equal(membreNouveauInfo.domaine)
      // run createMarrainage a second time to see if marrainage is created twice
      await createMarrainages()
      sendEmailStub.calledOnce.should.be.true;
      differenceLodashSpy.firstCall.returned([membreNouveau]).should.be.true;
      differenceLodashSpy.secondCall.returned([]).should.be.true;
      await knex('users').update({ created_at: new Date()})
    })

    it('should send a console.warn if no marain.e available', async () => {
      utils.cleanMocks();
      await knex('users').update({
        created_at: new Date('11/01/2021')
      })
      await knex('users').where({ username:  'membre.nouveau'}).update({
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        created_at: new Date('01/24/2022')
      })
      const url = process.env.USERS_API || 'https://beta.gouv.fr';
      nock(url)
        .get((uri) => uri.includes('authors.json'))
        .reply(200, [
          {
            id: 'membre.nouveau',
            fullname: 'membre Nouveau',
            missions: [
              {
                start: new Date().toISOString().split('T')[0],
              },
            ],
          },
        ])
        .persist();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
      utils.mockOvhUserResponder();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();
      const consoleSpy = sinon.spy(console, 'warn');
  
      await knex('marrainage')
        .where({ username: 'membre.nouveau' })
        .select()
        .then((marrainage) => {
          marrainage.length.should.equal(0);
      })
      await createMarrainages();
      sendEmailStub.calledOnce.should.be.true;
      consoleSpy.firstCall.args[0].message.should.equal(
        "Aucun·e marrain·e n'est disponible pour le moment"
      );
      const marrainage = await knex('marrainage')
        .where({ username: 'membre.nouveau' })
        .select();
      marrainage.length.should.equal(0);
      consoleSpy.restore();
      await knex('users').update({ created_at: new Date()})
    });
  
    it('should reload stale marrainage requests', (done) => {
      const staleRequest = {
        username: 'membre.nouveau',
        last_onboarder: 'membre.parti',
        created_at: new Date(new Date().setDate(new Date().getDate() - 3)),
        last_updated: new Date(new Date().setDate(new Date().getDate() - 3)),
        completed: false,
        count: 1,
      };

      const validRequest = {
        username: 'membre.actif',
        last_onboarder: 'membre.nouveau',
        created_at: new Date(),
        last_updated: new Date(),
        completed: false,
        count: 1,
      };

      knex('marrainage')
        .insert([staleRequest, validRequest])
        .then(() => {
          reloadMarrainages();
          clock.tick(1001);
          const listener = (response, obj, builder) => {
            if (obj.method !== 'update') {
              return;
            }
            knex('marrainage')
              .select()
              .where({ username: staleRequest.username })
              .then((res) => {
                res[0].count.should.equal(2);
              })
              .then(() =>
                knex('marrainage')
                  .select()
                  .where({ username: validRequest.username })
              )
              .then((res) => {
                res[0].count.should.equal(1);
              })
              .then(done)
              .catch(done)
              .finally(() => {
                knex.off('query-response', listener); // remove listener else it runs in the next tests
              });
          };
          knex.on('query-response', listener);
        });
    });

    it('should reload stale marrainage requests of edge case exactly two days ago at 00:00', (done) => {
      const dateStaleRequest = new Date(
        new Date().setDate(new Date().getDate() - 2)
      );
      dateStaleRequest.setHours(11, 0, 0);
      const staleRequest = {
        username: 'membre.nouveau',
        last_onboarder: 'membre.parti',
        created_at: dateStaleRequest,
        last_updated: dateStaleRequest,
        completed: false,
        count: 1,
      };

      const dateValidRequest = new Date(
        new Date().setDate(new Date().getDate() - 1)
      );
      dateValidRequest.setHours(23, 59, 59);

      const validRequest = {
        username: 'membre.actif',
        last_onboarder: 'membre.nouveau',
        created_at: dateValidRequest,
        last_updated: dateValidRequest,
        completed: false,
        count: 1,
      };

      knex('marrainage')
        .insert([staleRequest, validRequest])
        .then(() => {
          reloadMarrainages();
          clock.tick(1001);
          const listener = (response, obj, builder) => {
            if (obj.method !== 'update') {
              return;
            }
            knex('marrainage')
              .select()
              .where({ username: staleRequest.username })
              .then((res) => {
                res[0].count.should.equal(2);
              })
              .then(() =>
                knex('marrainage')
                  .select()
                  .where({ username: validRequest.username })
              )
              .then((res) => {
                res[0].count.should.equal(1);
              })
              .then(done)
              .catch(done)
              .finally(() => knex.off('query-response', listener)); // remove listener else it runs in the next tests
          };
          knex.on('query-response', listener);
        });
    });
  });