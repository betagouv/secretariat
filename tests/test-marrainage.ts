import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import nock from 'nock';
import sinon from 'sinon';
import config from '../src/config';
import controllerUtils from '../src/controllers/utils';
import knex from '../src/db';
import app from '../src/index';
import utils from './utils';

chai.use(chaiHttp);

describe('Marrainage', () => {
  let clock;
  let sendEmailStub;

  beforeEach((done) => {
    sendEmailStub = sinon.stub(controllerUtils, 'sendMail').returns(true);
    clock = sinon.useFakeTimers(new Date('2020-01-01T09:59:59+01:00'));
    done();
  });

  afterEach((done) => {
    knex('marrainage').truncate()
      .then(() => sendEmailStub.restore())
      .then(() => clock.restore())
      .then(() => done());
  });

  describe('unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai.request(app)
        .post('/marrainage')
        .type('form')
        .send({
          newcomerId: 'membre.actif',
        })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it('should email newcomer and onboarder if accepted', (done) => {
      const newcomerId = 'membre.nouveau';
      const onboarderId = 'membre.actif';

      knex('marrainage').insert({
        username: newcomerId,
        last_onboarder: onboarderId,
      }).then(() => {
        const token = jwt.sign({ newcomerId, onboarderId }, config.secret);

        chai.request(app)
          .get(`/marrainage/accept?details=${encodeURIComponent(token)}`)
          .redirects(0)
          .end((err, res) => {
            res.should.have.status(200);
            res.text.should.include('Vous allez recevoir un email avec tous les deux en copie');
            sendEmailStub.calledOnce.should.be.true;

            const subject = sendEmailStub.args[0][1];
            const emailBody = sendEmailStub.args[0][2];

            subject.should.equal('Mise en contact 👋');
            emailBody.should.include('Membre Actif a accepté de te marrainer');
            done();
          });
      });
    });

    it('should select and email a new onboarder if declined', (done) => {
      const newcomerId = 'membre.nouveau';
      const onboarderId = 'membre.actif';

      knex('marrainage').insert({
        username: newcomerId,
        last_onboarder: onboarderId,
      }).then(() => {
        const token = jwt.sign({ newcomerId, onboarderId }, config.secret);

        chai.request(app)
          .get(`/marrainage/decline?details=${encodeURIComponent(token)}`)
          .redirects(0)
          .end((err, res) => {
            res.should.have.status(200);
            res.text.should.include('Votre décision a été prise en compte');
            sendEmailStub.calledOnce.should.be.true;

            const newOnboarderEmailArgs = sendEmailStub.args[0];

            const subject = newOnboarderEmailArgs[1];
            const emailBody = newOnboarderEmailArgs[2];

            subject.should.equal('Tu as été sélectionné·e comme marrain·e 🙌');
            emailBody.should.include('marrainage/accept');
            emailBody.should.include('marrainage/decline');
            done();
          });
      });
    });

    it('should now allow canceling a request', (done) => {
      const newcomerId = 'membre.nouveau';
      const onboarderId = 'membre.actif';

      knex('marrainage').insert({
        username: newcomerId,
        last_onboarder: onboarderId,
      }).then(() => {
        chai.request(app)
          .post('/marrainage/cancel')
          .type('form')
          .send({
            newcomerId,
          })
          .then(() => knex('marrainage').select().where({ username: newcomerId }))
          .then((dbRes) => {
            dbRes.length.should.equal(1);
          })
          .then(done)
          .catch(done);
      });
    });

    it('should now allow reloading a request', (done) => {
      const newcomerId = 'membre.nouveau';
      const onboarderId = 'membre.actif';

      knex('marrainage').insert({
        username: newcomerId,
        last_onboarder: onboarderId,
      }).then(() => {
        chai.request(app)
          .post('/marrainage/reload')
          .type('form')
          .send({
            newcomerId,
          })
          .then(() => knex('marrainage').select().where({ username: newcomerId }))
          .then((dbRes) => {
            dbRes.length.should.equal(1);
            dbRes[0].count.should.equal(1);
          })
          .then(done)
          .catch(done);
      });
    });
  });

  describe('authenticated', () => {
    it('should generate an email when sollicited', (done) => {
      chai.request(app)
        .post('/marrainage')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          newcomerId: 'membre.actif',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/community/membre.actif');
          sendEmailStub.calledOnce.should.be.true;

          const subject = sendEmailStub.args[0][1];
          const emailBody = sendEmailStub.args[0][2];

          subject.should.equal('Tu as été sélectionné·e comme marrain·e 🙌');
          emailBody.should.include('marrainage/accept');
          emailBody.should.include('marrainage/decline');
          done();
        });
    });

    it('should add info in db when sollicited', (done) => {
      chai.request(app)
        .post('/marrainage')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          newcomerId: 'membre.actif',
        })
        .redirects(0)
        .then(() => knex('marrainage').select().where({ username: 'membre.actif' }))
        .then((dbRes) => {
          dbRes.length.should.equal(1);
          dbRes[0].username.should.equal('membre.actif');
        })
        .then(done)
        .catch(done);
    });

    it('should not allow expired users to create a request', (done) => {
      chai.request(app)
        .post('/marrainage')
        .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
        .type('form')
        .send({
          newcomerId: 'membre.actif',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/community/membre.actif');
          sendEmailStub.notCalled.should.be.true;
          done();
        });
    });

    it('canceling a request redirects to the newcommer page', (done) => {
      const newcomerId = 'membre.nouveau';
      const onboarderId = 'membre.actif';

      knex('marrainage').insert({
        username: newcomerId,
        last_onboarder: onboarderId,
      }).then(() => {
        chai.request(app)
          .post('/marrainage/cancel')
          .set('Cookie', `token=${utils.getJWT(newcomerId)}`)
          .type('form')
          .send({
            newcomerId,
          })
          .redirects(0)
          .end((err, res) => {
            res.should.have.status(302);
            res.header.location.should.equal(`/community/${newcomerId}`);
            done();
          });
      });
    });

    it('canceling a request removes the DB entry', (done) => {
      const newcomerId = 'membre.nouveau';
      const onboarderId = 'membre.actif';

      knex('marrainage').insert({
        username: newcomerId,
        last_onboarder: onboarderId,
      }).then(() => {
        chai.request(app)
          .post('/marrainage/cancel')
          .set('Cookie', `token=${utils.getJWT(newcomerId)}`)
          .type('form')
          .send({
            newcomerId,
          })
          .then(() => knex('marrainage').select().where({ username: newcomerId }))
          .then((dbRes) => {
            dbRes.length.should.equal(0);
          })
          .then(done)
          .catch(done);
      });
    });

    it('reloading a request redirects to the newcommer page', (done) => {
      const newcomerId = 'membre.nouveau';
      const onboarderId = 'membre.actif';

      knex('marrainage').insert({
        username: newcomerId,
        last_onboarder: onboarderId,
      }).then(() => {
        chai.request(app)
          .post('/marrainage/reload')
          .set('Cookie', `token=${utils.getJWT(newcomerId)}`)
          .type('form')
          .send({
            newcomerId,
          })
          .redirects(0)
          .end((err, res) => {
            res.should.have.status(302);
            res.header.location.should.equal(`/community/${newcomerId}`);
            done();
          });
      });
    });

    it('reloading a request increases the count of the DB entry', (done) => {
      const newcomerId = 'membre.nouveau';
      const onboarderId = 'membre.actif';

      knex('marrainage').insert({
        username: newcomerId,
        last_onboarder: onboarderId,
      }).then(() => {
        chai.request(app)
          .post('/marrainage/reload')
          .set('Cookie', `token=${utils.getJWT(newcomerId)}`)
          .type('form')
          .send({
            newcomerId,
          })
          .then(() => knex('marrainage').select().where({ username: newcomerId }))
          .then((dbRes) => {
            dbRes.length.should.equal(1);
            dbRes[0].count.should.equal(2);
          })
          .then(done)
          .catch(done);
      });
    });

    it('should not choose a busy marrainage candidate', (done) => {
      const newcomerId = 'membre.nouveau';
      const busyOnboarders = [
        'membre.actif',
        'membre.parti',
        'julien.dauphant',
        'laurent.bossavit',
        'loup.wolff',
        'thomas.guillet',
        'membre.plusieurs.missions',
      ];
      const dbEntries = [];
      for (let i = 0; i < busyOnboarders.length; i += 1) {
        const onboarder = busyOnboarders[i];
        dbEntries.push({
          username: `test_${i}`,
          last_onboarder: onboarder,
        });
      }
      knex('marrainage').insert(dbEntries).then(() => {
        chai.request(app)
          .post('/marrainage')
          .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
          .type('form')
          .send({ newcomerId })
          .then(() => knex('marrainage').select().where({ username: newcomerId }))
          .then((dbRes) => {
            // Since all onboarders are busy, the newcomer was not able to ask for a marraine
            dbRes.length.should.equal(0);
          })
          .then(done)
          .catch(done);
      });
    });
  });

  describe('marrainage scheduler', () => {
    const betaUsers =  [
      {
        id: 'membre.actif',
        fullname: 'membre actif',
        role: 'Chargé de déploiement',
        start: '2020-09-01',
        end: '2090-01-30',
        employer: 'admin/'
      }, {
        id: 'membre.expire',
        fullname: 'membre expire',
        role: 'Intrapreneur',
        start: '2018-01-01',
        end: '2019-12-31',
        employer: 'admin/'
      },
    ];

    const url = config.usersAPI;
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, betaUsers)
      .persist();

    it('should change completed to false', (done) => {
      const user = {
        username: 'membre.actif',
        last_onboarder: 'membre.expire',
        created_at: new Date(new Date().setDate(new Date().getDate() - 3)),
        last_updated: new Date(new Date().setDate(new Date().getDate() - 3)),
        completed: true,
        count: 1,
      };
      knex('marrainage').insert([user]).then(async () => {

        const { removeMarrainageForExpiredUsers } = require('../src/schedulers/marrainageScheduler');
        const expiredUsers =  await removeMarrainageForExpiredUsers();

        expiredUsers.length.should.equal(1);

        knex('marrainage').select().where({ username: user.username })
        .then((res) => {
          res[0].completed.should.be.false;
        })
        .then(done)
        .catch(done);
      })
    });
  });

  describe('cronjob', () => {
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

      knex('marrainage').insert([staleRequest, validRequest]).then(() => {
        // Disabels global require since requiring the cron job
        // will immediatly start it.
        /* eslint-disable global-require */
        const { reloadMarrainageJob } = require('../src/schedulers/marrainageScheduler');
        clock.tick(1001);
        const listener = (response, obj, builder) => {
          if (obj.method !== 'update') {
            return;
          }
          knex('marrainage').select().where({ username: staleRequest.username })
          .then((res) => {
            res[0].count.should.equal(2);
          })
          .then(() => knex('marrainage').select().where({ username: validRequest.username }))
          .then((res) => {
            res[0].count.should.equal(1);
            reloadMarrainageJob.stop();
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
      const dateStaleRequest = new Date(new Date().setDate(new Date().getDate() - 2));
      dateStaleRequest.setHours(11, 0, 0);
      const staleRequest = {
        username: 'membre.nouveau',
        last_onboarder: 'membre.parti',
        created_at: dateStaleRequest,
        last_updated: dateStaleRequest,
        completed: false,
        count: 1,
      };

      const dateValidRequest = new Date(new Date().setDate(new Date().getDate() - 1));
      dateValidRequest.setHours(23, 59, 59);

      const validRequest = {
        username: 'membre.actif',
        last_onboarder: 'membre.nouveau',
        created_at: dateValidRequest,
        last_updated: dateValidRequest,
        completed: false,
        count: 1,
      };

      knex('marrainage').insert([staleRequest, validRequest]).then(() => {
        // Disabels global require since requiring the cron job
        // will immediatly start it.
        /* eslint-disable global-require */
        const { reloadMarrainageJob } = require('../src/schedulers/marrainageScheduler');
        // we start it manually as it may have been stopped in previous tests
        reloadMarrainageJob.start();

        clock.tick(1001);
        const listener = (response, obj, builder) => {
          if (obj.method !== 'update') {
            return;
          }
          knex('marrainage').select().where({ username: staleRequest.username })
          .then((res) => {
            res[0].count.should.equal(2);
          })
          .then(() => knex('marrainage').select().where({ username: validRequest.username }))
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
});
