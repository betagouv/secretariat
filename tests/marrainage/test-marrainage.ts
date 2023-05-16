import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import sinon from 'sinon';
import _ from 'lodash/array';

import config from '@config';
import * as Email from '@config/email.config'
import knex from '@/db';
import app from '@/index';
import { EMAIL_TYPES, SendEmailProps } from '@/modules/email';
import utils from '../utils';
import * as session from '@/middlewares/session';

import testUsers from "../users.json"

chai.use(chaiHttp);

describe('Marrainage', () => {
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

  describe('unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai
        .request(app)
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

      knex('marrainage')
        .insert({
          username: newcomerId,
          last_onboarder: onboarderId,
        })
        .then(() => {
          const token = jwt.sign({ newcomerId, onboarderId }, config.secret);

          chai
            .request(app)
            .get(`/marrainage/accept?details=${encodeURIComponent(token)}`)
            .redirects(0)
            .end((err, res) => {
              res.should.have.status(200);
              res.text.should.include(
                'Vous allez recevoir un email avec tous les deux en copie'
              );
              sendEmailStub.calledTwice.should.be.true;

              const email1 : SendEmailProps = sendEmailStub.args[0][0];
              const email2 : SendEmailProps = sendEmailStub.args[1][0];
              email1.type.should.equal(EMAIL_TYPES.MARRAINAGE_ACCEPT_ONBOARDER_EMAIL)
              email2.type.should.equal(EMAIL_TYPES.MARRAINAGE_ACCEPT_NEWCOMER_EMAIL)
              done();
            });
        });
    });

    it('should select and email a new onboarder if declined', (done) => {
      const newcomerId = 'membre.nouveau';
      const onboarderId = 'membre.actif';

      knex('marrainage')
        .insert({
          username: newcomerId,
          last_onboarder: onboarderId,
        })
        .then(() => {
          const token = jwt.sign({ newcomerId, onboarderId }, config.secret);

          chai
            .request(app)
            .get(`/marrainage/decline?details=${encodeURIComponent(token)}`)
            .redirects(0)
            .end((err, res) => {
              res.should.have.status(200);
              res.text.should.include('Votre décision a été prise en compte');
              sendEmailStub.calledOnce.should.be.true;

              const email : SendEmailProps = sendEmailStub.args[0][0];
              email.type.should.equal(EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL)

              done();
            });
        });
    });

    it('should now allow canceling a request', (done) => {
      const newcomerId = 'membre.nouveau';
      const onboarderId = 'membre.actif';

      knex('marrainage')
        .insert({
          username: newcomerId,
          last_onboarder: onboarderId,
        })
        .then(() => {
          chai
            .request(app)
            .post('/marrainage/cancel')
            .type('form')
            .send({
              newcomerId,
            })
            .then(() =>
              knex('marrainage').select().where({ username: newcomerId })
            )
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

      knex('marrainage')
        .insert({
          username: newcomerId,
          last_onboarder: onboarderId,
        })
        .then(() => {
          chai
            .request(app)
            .post('/marrainage/reload')
            .type('form')
            .send({
              newcomerId,
            })
            .then(() =>
              knex('marrainage').select().where({ username: newcomerId })
            )
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
    let getToken
    
    beforeEach(() => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
    })

    afterEach(() => {
      getToken.restore()
    })

    it('should generate an email when sollicited', (done) => {
      chai
        .request(app)
        .post('/marrainage')
        .type('form')
        .send({
          newcomerId: 'membre.actif',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/community/membre.actif');
          sendEmailStub.calledOnce.should.be.true;

          const email : SendEmailProps = sendEmailStub.args[0][0];
          email.type.should.equal(EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL)

          done();
        });
    });

    it('email should include position and startup when available', (done) => {
      chai
        .request(app)
        .post('/marrainage')
        .type('form')
        .send({
          newcomerId: 'membre.actif',
        })
        .end((err, res) => {
          sendEmailStub.calledOnce.should.be.true;
          const email: SendEmailProps = sendEmailStub.args[0][0];
          email.type.should.equal(EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL)
          email.variables.newcomer.id.should.equal('membre.actif')
          email.variables.startup.should.equal('test-startup')
          done();
        });
    });

    it('email should include role only when startup not available', async () => {
      getToken.returns(utils.getJWT('membre.plusieurs.missions'))

      await chai
        .request(app)
        .post('/marrainage')
        .type('form')
        .send({
          newcomerId: 'membre.plusieurs.missions',
        })

      sendEmailStub.calledOnce.should.be.true;
      const email : SendEmailProps = sendEmailStub.args[0][0];
      email.type.should.equal(EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL)
      email.variables.newcomer.role.should.equal(testUsers.find(user => user.id === 'membre.plusieurs.missions').role)
    });

    it('should add info in db when sollicited', (done) => {
      chai
        .request(app)
        .post('/marrainage')
        .type('form')
        .send({
          newcomerId: 'membre.actif',
        })
        .redirects(0)
        .then(() =>
          knex('marrainage').select().where({ username: 'membre.actif' })
        )
        .then((dbRes) => {
          dbRes.length.should.equal(1);
          dbRes[0].username.should.equal('membre.actif');
        })
        .then(done)
        .catch(done);
    });

    it('should not allow expired users to create a request', (done) => {
      getToken.returns(utils.getJWT('membre.expire'))
      chai
        .request(app)
        .post('/marrainage')
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
      getToken.returns(utils.getJWT(newcomerId))

      knex('marrainage')
        .insert({
          username: newcomerId,
          last_onboarder: onboarderId,
        })
        .then(() => {
          chai
            .request(app)
            .post('/marrainage/cancel')
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
      getToken.returns(utils.getJWT(newcomerId))

      knex('marrainage')
        .insert({
          username: newcomerId,
          last_onboarder: onboarderId,
        })
        .then(() => {
          chai
            .request(app)
            .post('/marrainage/cancel')
            .type('form')
            .send({
              newcomerId,
            })
            .then(() =>
              knex('marrainage').select().where({ username: newcomerId })
            )
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
      getToken.returns(utils.getJWT(newcomerId))

      knex('marrainage')
        .insert({
          username: newcomerId,
          last_onboarder: onboarderId,
        })
        .then(() => {
          chai
            .request(app)
            .post('/marrainage/reload')
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
      getToken.returns(utils.getJWT(newcomerId))

      knex('marrainage')
        .insert({
          username: newcomerId,
          last_onboarder: onboarderId,
        })
        .then(() => {
          chai
            .request(app)
            .post('/marrainage/reload')
            .type('form')
            .send({
              newcomerId,
            })
            .then(() =>
              knex('marrainage').select().where({ username: newcomerId })
            )
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
      knex('marrainage')
        .insert(dbEntries)
        .then(() => {
          chai
            .request(app)
            .post('/marrainage')
            .type('form')
            .send({ newcomerId })
            .then(() =>
              knex('marrainage').select().where({ username: newcomerId })
            )
            .then((dbRes) => {
              // Since all onboarders are busy, the newcomer was not able to ask for a marraine
              dbRes.length.should.equal(0);
            })
            .then(done)
            .catch(done);
        });
    });
  });
});
