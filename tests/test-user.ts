import chai from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';
import sinon from 'sinon';
import Betagouv from '../src/betagouv';
import config from '../src/config';
import controllerUtils from '../src/controllers/utils';
import knex from '../src/db';
import app from '../src/index';
import { createEmailAddresses } from '../src/schedulers/emailCreationScheduler';
import testUsers from './users.json';
import utils from './utils';

chai.use(chaiHttp);

describe('User', () => {
  let ovhPasswordNock;

  describe('POST /users/:username/email unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai.request(app)
        .post('/users/membre.parti/email')
        .type('form')
        .send({
          _method: 'POST',
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });
  describe('POST /users/:username/email authenticated', () => {
    before(async () => {
      await knex('marrainage').truncate();
    });

    let sendEmailStub;
    beforeEach((done) => {
      sendEmailStub = sinon.stub(controllerUtils, 'sendMail').returns(Promise.resolve(true));
      done();
    });

    afterEach(async () => {
      await knex('marrainage').truncate();
      sendEmailStub.restore();
    });

    it('should ask OVH to create an email and create marrainage', (done) => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);
      knex('marrainage').where({ username: 'membre.nouveau' }).select()
        .then((marrainage) => {
          marrainage.length.should.equal(0);
        })
        .then(() => {
          chai.request(app)
            .post('/users/membre.nouveau/email')
            .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
            .type('form')
            .send({
              to_email: 'test@example.com',
            })
            .then(async () => {
              ovhEmailCreation.isDone().should.be.true;
              sendEmailStub.calledTwice.should.be.true;
              const marrainage = await knex('marrainage').where({ username: 'membre.nouveau' }).select();
              marrainage.length.should.equal(1);
              marrainage[0].username.should.equal('membre.nouveau');
              marrainage[0].last_onboarder.should.not.be.null;
              done();
            })
            .catch(done)
            .finally(() => {
              sendEmailStub.restore();
            });
        });
    });

    it('should ask OVH to create an email and should send a console.warn if no marain.e available', (done) => {
      utils.cleanMocks();
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
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();
      const consoleSpy = sinon.spy(console, 'warn');

      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);
      knex('marrainage').where({ username: 'membre.nouveau' }).select()
        .then((marrainage) => {
          marrainage.length.should.equal(0);
        })
        .then(() => {
          chai.request(app)
            .post('/users/membre.nouveau/email')
            .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
            .type('form')
            .send({
              to_email: 'test@example.com',
            })
            .then(async () => {
              ovhEmailCreation.isDone().should.be.true;
              sendEmailStub.calledTwice.should.be.true;
              consoleSpy.firstCall.args[0].message.should.equal('Aucun·e marrain·e n\'est disponible pour le moment');
              const marrainage = await knex('marrainage').where({ username: 'membre.nouveau' }).select();
              marrainage.length.should.equal(0);
              done();
            })
            .catch(done)
            .finally(() => {
              consoleSpy.restore();
              sendEmailStub.restore();
            });
        });
    });

    it('should not allow email creation from delegate if email already exists', (done) => {
      // For this case we need to reset the basic nocks in order to return
      // a different response to indicate that membre.nouveau has an
      // existing email already created.
      utils.cleanMocks();
      utils.mockUsers();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();
      utils.mockOvhTime();
      utils.mockOvhRedirections();

      // We return an email for membre.nouveau to indicate he already has one
      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, {
          accountName: 'membre.nouveau',
          email: 'membre.nouveau@example.com',
        });

      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.nouveau/email')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });

    it('should not allow email creation from delegate if github file doesn\'t exist', (done) => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.sans.fiche/email')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });

    it('should not allow email creation from delegate if user has expired', (done) => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.expire/email')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });

    it('should not allow email creation from delegate if delegate has expired', (done) => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.nouveau/email')
        .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });
  });

  describe('POST /users/:username/redirections unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai.request(app)
        .post('/users/membre.parti/redirections')
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe('POST /users/:username/redirections authenticated', () => {
    it('should ask OVH to create a redirection', (done) => {
      const ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/redirections')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhRedirectionCreation.isDone().should.be.true;
          done();
        });
    });

    it('should not allow redirection creation from delegate', (done) => {
      const ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.nouveau/redirections')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhRedirectionCreation.isDone().should.be.false;
          done();
        });
    });

    it('should not allow redirection creation from expired users', (done) => {
      const ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.expire/redirections')
        .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhRedirectionCreation.isDone().should.be.false;
          done();
        });
    });
  });

  describe('POST /users/:username/redirections/:email/delete unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai.request(app)
        .post('/users/membre.parti/redirections/test@example.com/delete')
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe('POST /users/:username/redirections/:email/delete authenticated', () => {
    it('should ask OVH to delete a redirection', (done) => {
      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/redirections/test-2@example.com/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.true;
          done();
        });
    });

    it('should not allow redirection deletion from delegate', (done) => {
      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.nouveau/redirections/test-2@example.com/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.false;
          done();
        });
    });

    it('should not allow redirection deletion from expired users', (done) => {
      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.expire/redirections/test-2@example.com/delete')
        .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.false;
          done();
        });
    });
  });

  describe('POST /users/:username/password unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai.request(app)
        .post('/users/membre.actif/password')
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
    it('should not allow a password change', (done) => {
      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/password')
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
        .end((err, res) => {
          ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
  });

  describe('POST /users/:username/password unauthenticated', () => {
    it('should redirect to user page', (done) => {
      chai.request(app)
        .post('/users/membre.actif/password')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/community/membre.actif');
          done();
        });
    });
    it('should perform a password change if the email exists', (done) => {
      nock.cleanAll();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, { description: '' });

      utils.mockUsers();
      utils.mockOvhRedirections();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();

      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/password')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
        .end((err, res) => {
          ovhPasswordNock.isDone().should.be.true;
          done();
        });
    });
    it('should not allow a password change from delegate', (done) => {
      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.nouveau/password')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
        .end((err, res) => {
          ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
    it('should not allow a password change from expired user', (done) => {
      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.expire/password')
        .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
        .end((err, res) => {
          ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
    it('should not allow a password shorter than 9 characters', (done) => {
      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/password')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          new_password: '12345678',
        })
        .end((err, res) => {
          ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
    it('should not allow a password longer than 30 characters', (done) => {
      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/password')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          new_password: '1234567890123456789012345678901',
        })
        .end((err, res) => {
          ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
  });

  describe('POST /users/:username/email/delete unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai.request(app)
        .post('/users/membre.parti/email/delete')
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe('POST /user/:username/email/delete', () => {
    it('should keep the user in database secretariat', (done) => {
      const addRedirection = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      knex('users')
        .insert({
          username: 'membre.actif',
          secondary_email: 'membre.actif@example.com',
        })
        .then(() => knex('users')
          .select()
          .where({ username: 'membre.actif' }))
        .then((dbRes) => {
          dbRes.length.should.equal(1);
        })
        .then(() => {
          chai.request(app)
            .post('/users/membre.actif/email/delete')
            .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
            .then(() => knex('users')
              .select()
              .where({ username: 'membre.actif' }))
            .then((dbNewRes) => {
              dbNewRes.length.should.equal(1);
              (dbNewRes[0].secondary_email === null).should.be.true;
              addRedirection.isDone().should.be.true;
            })
            .then(done)
            .catch(done);
        })
        .catch(done);
    });
  });

  describe('POST /users/:username/secondary_email', () => {
    it('should return 200 to add secondary email', (done) => {
      chai.request(app)
        .post('/users/nouveau.membre/secondary_email')
        .set('Cookie', `token=${utils.getJWT('nouveau.membre')}`)
        .type('form')
        .send({
          username: 'nouveau.membre',
          secondaryEmail: 'nouveau.membre.perso@example.com',
        })
        .end((err, res) => {
          res.should.have.status(200);
        });
      done();
    });

    // fixme: this test test nothing since it fail silently on chai.request
    // because user.canChangeSecondaryEmail is false. It should be tested with
    // a valid BetaGouvUser
    it('should add secondary email', (done) => {
      const username = 'nouveau.membre';
      const secondaryEmail = 'nouveau.membre.perso@example.com';

      knex('users')
        .select()
        .where({ username: 'nouveau.membre' })
        .first()
        .then(() => {
          chai.request(app)
            .post(`/users/${username}/secondary_email`)
            .set('Cookie', `token=${utils.getJWT('nouveau.membre')}`)
            .type('form')
            .send({
              username,
              secondaryEmail,
            })
            .then(() => knex('users').select().where({ username: 'nouveau.membre' }))
            .then((dbNewRes) => {
              dbNewRes.length.should.equal(1);
              dbNewRes[0].secondary_email.should.equal(secondaryEmail);
            })
            .then(done)
            .catch(done);
          done();
        })
        .catch(done);
    });
  });

  describe('POST /users/:username/secondary_email/update', () => {
    it('should return 200 to update secondary email', (done) => {
      chai.request(app)
        .post('/users/nouveau.membre/secondary_email')
        .set('Cookie', `token=${utils.getJWT('nouveau.membre')}`)
        .type('form')
        .send({
          username: 'nouveau.membre',
          secondaryEmail: 'nouveau.membre.perso2@example.com',
        })
        .end((err, res) => {
          res.should.have.status(200);
        });
      done();
    });

    it('should update secondary email', (done) => {
      const username = 'membre.sansmail';
      const secondaryEmail = 'membre.sansmail.perso@example.com';
      const newSecondaryEmail = 'membre.sansmail.new@example.com';

      knex('users').insert({
        username,
        secondary_email: secondaryEmail,
      })
        .then(() => {
          knex('users').select()
            .where({ username: 'membre.sansmail' })
            .first()
            .then((dbRes) => {
              dbRes.secondary_email.should.equal(secondaryEmail);
            })
            .then(() => {
              chai.request(app)
                .post(`/users/${username}/secondary_email/update`)
                .set('Cookie', `token=${utils.getJWT('membre.sansmail')}`)
                .type('form')
                .send({
                  username,
                  newSecondaryEmail,
                })
                .then(() => knex('users').select().where({ username: 'membre.sansmail' }))
                .then((dbNewRes) => {
                  dbNewRes.length.should.equal(1);
                  dbNewRes[0].secondary_email.should.equal(newSecondaryEmail);
                })
                .then(done)
                .catch(done);
            })
            .catch(done);
        })
        .then(done)
        .catch(done);
    });
  });

  describe('POST /users/:username/redirections/:email/delete authenticated', () => {
    it('should ask OVH to delete all redirections', (done) => {
      nock.cleanAll();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection/)
        .query((x) => Boolean(x.from || x.to))
        .reply(200, ['123123'])
        .persist();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200, {
          id: '123123',
          from: `membre.expire@${config.domain}`,
          to: 'perso@example.ovh',
        }).persist();

      utils.mockUsers();
      utils.mockOvhTime();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();

      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.expire/email/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.true;
          done();
        });
    });

    it('should not allow email deletion for active users', (done) => {
      const ovhEmailDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/account\/membre.expire/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/email/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          ovhEmailDeletion.isDone().should.be.false;
          done();
        });
    });

    it('should not allow redirection deletion for another user if active', (done) => {
      nock.cleanAll();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection/)
        .query((x) => Boolean(x.from || x.to))
        .reply(200, ['123123'])
        .persist();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200, {
          id: '123123',
          from: `membre.actif@${config.domain}`,
          to: 'perso@example.ovh',
        }).persist();

      utils.mockUsers();
      utils.mockOvhTime();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();

      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/email/delete')
        .set('Cookie', `token=${utils.getJWT('membre.nouveau')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.false;
          done();
        });
    });

    it('should allow redirection deletion for requester even if active', (done) => {
      nock.cleanAll();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection/)
        .query((x) => Boolean(x.from || x.to))
        .reply(200, ['123123'])
        .persist();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200, {
          id: '123123',
          from: `membre.actif@${config.domain}`,
          to: 'perso@example.ovh',
        }).persist();

      utils.mockUsers();
      utils.mockOvhTime();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();

      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/email/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.true;
          done();
        });
    });
  });

  describe('cronjob', () => {
    before(async () => {
      await knex('users').truncate();
      await knex('marrainage').truncate();
    });
    let sendEmailStub;
    let betagouvCreateEmail;
    beforeEach((done) => {
      sendEmailStub = sinon.stub(controllerUtils, 'sendMail').returns(true);
      betagouvCreateEmail = sinon.spy(Betagouv, 'createEmail');
      done();
    });

    afterEach(async () => {
      await knex('users').truncate();
      await knex('marrainage').truncate();
      sendEmailStub.restore();
      betagouvCreateEmail.restore();
    });

    it('should create missing email accounts and marrainage request if start date < 2 months', async () => {
      utils.cleanMocks();
      const url = process.env.USERS_API || 'https://beta.gouv.fr';
      nock(url)
        .get((uri) => uri.includes('authors.json'))
        .reply(200, [
          {
            id: 'membre.actif',
            fullname: 'membre Actif',
            missions: [
              {
                start: '2016-11-03',
                status: 'independent',
                employer: 'octo',
              },
            ],
          },
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
      utils.mockOvhUserEmailInfos();

      const newMember = testUsers.find((user) => user.id === 'membre.nouveau');
      const allAccountsExceptANewMember = testUsers.filter((user) => user.id !== newMember.id);

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account/)
        .reply(200, allAccountsExceptANewMember.map((user) => user.id));

      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);
      let marrainage = await knex('marrainage').where({ username: newMember.id }).select();
      marrainage.length.should.equal(0);
      await knex('users').insert({
        username: newMember.id,
        secondary_email: 'membre.nouveau.perso@example.com',
      });
      await createEmailAddresses();
      ovhEmailCreation.isDone().should.be.true;
      betagouvCreateEmail.firstCall.args[0].should.equal(newMember.id);
      sendEmailStub.calledTwice.should.be.true;
      marrainage = await knex('marrainage').where({ username: newMember.id }).select();
      marrainage.length.should.equal(1);
      marrainage[0].username.should.equal(newMember.id);
      marrainage[0].last_onboarder.should.not.be.null;
    });

    it('should create missing email accounts but not marrainage request if start date > 2 months', async () => {
      utils.cleanMocks();
      const today = new Date();
      const startDate = new Date(today.setMonth(today.getMonth() + 3));
      const url = process.env.USERS_API || 'https://beta.gouv.fr'; // can't replace with config.usersApi ?
      nock(url)
        .get((uri) => uri.includes('authors.json'))
        .reply(200, [
          {
            id: 'membre.actif',
            fullname: 'membre Actif',
            missions: [
              {
                start: '2016-11-03',
                status: 'independent',
                employer: 'octo',
              },
            ],
          },
          {
            id: 'membre.nouveau',
            fullname: 'membre Nouveau',
            missions: [
              {
                start: startDate.toISOString().split('T')[0],
              },
            ],
          },
        ])
        .persist();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
      utils.mockOvhUserEmailInfos();

      const newMember = testUsers.find((user) => user.id === 'membre.nouveau');
      const allAccountsExceptANewMember = testUsers.filter((user) => user.id !== newMember.id);

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account/)
        .reply(200, allAccountsExceptANewMember.map((user) => user.id));

      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      let marrainage = await knex('marrainage').where({ username: newMember.id }).select();
      marrainage.length.should.equal(0);
      await knex('users').insert({
        username: newMember.id,
        secondary_email: 'membre.nouveau.perso@example.com',
      });
      await createEmailAddresses();
      betagouvCreateEmail.firstCall.args[0].should.equal(newMember.id);
      ovhEmailCreation.isDone().should.be.true;
      sendEmailStub.calledOnce.should.be.true;
      marrainage = await knex('marrainage').where({ username: newMember.id }).select();
      marrainage.length.should.equal(0);
    });

    it('should create missing email accounts and not send error even if no marrainage possible', async () => {
      utils.cleanMocks();
      const url = process.env.USERS_API || 'https://beta.gouv.fr'; // can't replace with config.usersApi ?
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
      utils.mockOvhUserEmailInfos();

      const newMember = testUsers.find((user) => user.id === 'membre.nouveau');
      const allAccountsExceptANewMember = testUsers.filter((user) => user.id !== newMember.id);

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account/)
        .reply(200, allAccountsExceptANewMember.map((user) => user.id));

      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);
      const consoleSpy = sinon.spy(console, 'warn');

      let marrainage = await knex('marrainage')
        .where({ username: newMember.id })
        .select();
      marrainage.length.should.equal(0);
      await knex('users').insert({
        username: newMember.id,
        secondary_email: 'membre.nouveau.perso@example.com',
      });
      await createEmailAddresses();
      ovhEmailCreation.isDone().should.be.true;
      betagouvCreateEmail.firstCall.args[0].should.equal(newMember.id);
      consoleSpy.firstCall.args[0].message.should.equal('Aucun·e marrain·e n\'est disponible pour le moment');
      sendEmailStub.calledTwice.should.be.true;
      marrainage = await knex('marrainage')
        .where({ username: newMember.id })
        .select();
      marrainage.length.should.equal(0);
      consoleSpy.restore();
    });

    it('should not create email accounts if already created', (done) => {
      // For this case we need to reset the basic nocks in order to return
      // a different response to indicate that newcomer.test has an
      // email address
      utils.cleanMocks();
      utils.mockUsers();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();
      utils.mockOvhTime();
      utils.mockOvhRedirections();

      // We return an email for membre.nouveau to indicate he already has one
      const newMember = testUsers.find((user) => user.id === 'membre.nouveau');

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account/)
        .reply(200, [newMember]);

      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      knex('users').insert({
        username: newMember.id,
        // fixme
        // secondary_email: newMember.email
      }).then(async () => {
        await createEmailAddresses();
        betagouvCreateEmail.notCalled.should.be.true;
        ovhEmailCreation.isDone().should.be.false;
        sendEmailStub.notCalled.should.be.true;
        done();
      });
    });

    it('should not create email accounts if we dont have the secondary email', (done) => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      knex('users').insert({
        username: 'membre.nouveau',
      }).then(async () => {
        await createEmailAddresses();
        betagouvCreateEmail.notCalled.should.be.true;
        ovhEmailCreation.isDone().should.be.false;
        sendEmailStub.notCalled.should.be.true;
        done();
      });
    });
  });
});
