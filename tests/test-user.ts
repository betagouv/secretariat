import chai from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';
import sinon from 'sinon';
import Betagouv from '../src/betagouv';
import config from '../src/config';
import * as controllerUtils from '../src/controllers/utils';
import knex from '../src/db';
import app from '../src/index';
import { createEmailAddresses } from '../src/schedulers/emailScheduler';
import testUsers from './users.json';
import utils from './utils';
import { EmailStatusCode } from '../src/models/dbUser'

chai.use(chaiHttp);

describe('User', () => {
  let ovhPasswordNock;

  describe('POST /users/:username/email unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai
        .request(app)
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
      sendEmailStub = sinon
        .stub(controllerUtils, 'sendMail')
        .returns(Promise.resolve(true));
      done();
    });

    afterEach(async () => {
      await knex('marrainage').truncate();
      sendEmailStub.restore();
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

      chai
        .request(app)
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

    it("should not allow email creation from delegate if github file doesn't exist", (done) => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai
        .request(app)
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

      chai
        .request(app)
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

      chai
        .request(app)
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
      chai
        .request(app)
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

      chai
        .request(app)
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

      chai
        .request(app)
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

      chai
        .request(app)
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
      chai
        .request(app)
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

      chai
        .request(app)
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

      chai
        .request(app)
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

      chai
        .request(app)
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
      chai
        .request(app)
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

      chai
        .request(app)
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

  describe('POST /users/:username/password authenticated', () => {
    it('should redirect to user page', (done) => {
      chai
        .request(app)
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
    it('should perform a password change if the email exists', async () => {
      utils.cleanMocks();
      utils.mockUsers();
      utils.mockOvhUserResponder();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
      const username = 'membre.nouveau'
      await knex('users')
        .where({ username })
        .update({ primary_email_status: EmailStatusCode.EMAIL_ACTIVE })
      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, {
          accountName: username,
          email: 'membre.nouveau@example.com',
        }).persist();

      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      await chai
        .request(app)
        .post(`/users/${username}/password`)
        .set('Cookie', `token=${utils.getJWT(`${username}`)}`)
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
      ovhPasswordNock.isDone().should.be.true;
      const user = await knex('users').where({ username }).first()

    });
    it('should perform a password change and pass status to active if status was suspended', async () => {
      utils.cleanMocks();
      utils.mockUsers();
      utils.mockOvhUserResponder();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
      const username = 'membre.nouveau'
      await knex('users')
        .where({ username })
        .update({ primary_email_status: EmailStatusCode.EMAIL_SUSPENDED })
      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, {
          accountName: username,
          email: 'membre.nouveau@example.com',
        }).persist();

      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);
      
      await chai
      .request(app)
      .post(`/users/${username}/password`)
      .set('Cookie', `token=${utils.getJWT(`${username}`)}`)
      .type('form')
      .send({
        new_password: 'Test_Password_1234',
      })
      ovhPasswordNock.isDone().should.be.true;
      const user = await knex('users').where({ username }).first()
      user.primary_email_status.should.be.equal(EmailStatusCode.EMAIL_ACTIVE)
    });

    it('should not allow a password change from delegate', (done) => {
      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai
        .request(app)
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

      chai
        .request(app)
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

      chai
        .request(app)
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

      chai
        .request(app)
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
      chai
        .request(app)
        .post('/users/membre.parti/email/delete')
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe('POST /user/:username/email/delete', () => {
    it('should keep the user in database secretariat', async() => {
      const addRedirection = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      const dbRes = await knex('users').select().where({ username: 'membre.actif' })
      dbRes.length.should.equal(1);
      await chai
        .request(app)
        .post('/users/membre.actif/email/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
      const dbNewRes = await knex('users').where({ username: 'membre.actif' })
      dbNewRes.length.should.equal(1);
      addRedirection.isDone().should.be.true;
    });

    it('should ask OVH to redirect to the departs email', (done) => {
      const expectedRedirectionBody = (body) => {
        return body.from === `membre.actif@${config.domain}` && body.to === config.leavesEmail;
      }
      
      const ovhRedirectionDepartureEmail = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/, expectedRedirectionBody)
        .reply(200);

      chai
        .request(app)
        .post('/users/membre.actif/email/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          ovhRedirectionDepartureEmail.isDone().should.be.true;
          done();
        });
    });
  });

  describe('POST /users/:username/secondary_email', () => {
    it('should return 200 to add secondary email', (done) => {
      chai
        .request(app)
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

    it('should add secondary email', async () => {
      const username = 'membre.nouveau';
      const secondaryEmail = 'membre.nouveau.perso@example.com';

      await knex('users')
        .select()
        .where({ username: 'membre.nouveau' })
        .first()
      await chai
            .request(app)
            .post(`/users/${username}/secondary_email`)
            .set('Cookie', `token=${utils.getJWT('membre.nouveau')}`)
            .type('form')
            .send({
              username,
              secondaryEmail,
            })
      const dbNewRes = await knex('users').select().where({ username: 'membre.nouveau' })
      dbNewRes.length.should.equal(1);
      dbNewRes[0].secondary_email.should.equal(secondaryEmail);
    });

    it('should update secondary email', async() => {
      const username = 'membre.nouveau';
      const secondaryEmail = 'membre.nouveau.perso@example.com';
      const newSecondaryEmail = 'membre.nouveau.new@example.com';

      await knex('users')
        .where({
          username,
        })
        .update({
          secondary_email: secondaryEmail,
        })
      await chai.request(app)
        .post(`/users/${username}/secondary_email/`)
        .set('Cookie', `token=${utils.getJWT('membre.nouveau')}`)
        .type('form')
        .send({
          username,
          secondaryEmail: newSecondaryEmail,
        });
      const dbNewRes = await knex('users').select().where({ username: 'membre.nouveau' })
      dbNewRes.length.should.equal(1);
      dbNewRes[0].secondary_email.should.equal(newSecondaryEmail);
      await knex('users').where({ username: 'membre.nouveau' }).update({
        secondary_email: null
      })
    });

    it('should not update primary email if user is not current user', async() => {
      const username = 'membre.nouveau';
      const primaryEmail = 'membre.nouveau.new@example.com';
      const isPublicServiceEmailStub = sinon
      .stub(controllerUtils, 'isPublicServiceEmail')
      .returns(Promise.resolve(false));

      await chai.request(app)
        .post(`/users/${username}/primary_email/`)
        .set('Cookie', `token=${utils.getJWT('julien.dauphant')}`)
        .type('form')
        .send({
          username,
          primaryEmail: primaryEmail,
        });
        isPublicServiceEmailStub.called.should.be.false;
        isPublicServiceEmailStub.restore();
    });

    it('should not update primary email if email is not public service email', async() => {
      const isPublicServiceEmailStub = sinon
      .stub(controllerUtils, 'isPublicServiceEmail')
      .returns(Promise.resolve(false));
      const username = 'membre.nouveau';
      const primaryEmail = 'membre.nouveau.new@example.com';

      await chai.request(app)
        .post(`/users/${username}/primary_email/`)
        .type('form')
        .set('Cookie', `token=${utils.getJWT('membre.nouveau')}`)
        .send({
          username,
          primaryEmail: primaryEmail,
        });
      const dbNewRes = await knex('users').select().where({ username: 'membre.nouveau' })
      dbNewRes.length.should.equal(1);
      dbNewRes[0].primary_email.should.not.equal(primaryEmail);
      isPublicServiceEmailStub.called.should.be.true;
      isPublicServiceEmailStub.restore()
    });

    it('should update primary email', async() => {
      const isPublicServiceEmailStub = sinon
      .stub(controllerUtils, 'isPublicServiceEmail')
      .returns(Promise.resolve(true));
      const username = 'membre.nouveau';
      const primaryEmail = 'membre.nouveau.new@example.com';

      await chai.request(app)
        .post(`/users/${username}/primary_email/`)
        .type('form')
        .set('Cookie', `token=${utils.getJWT('membre.nouveau')}`)
        .send({
          username,
          primaryEmail: primaryEmail,
        });
      const dbNewRes = await knex('users').select().where({ username: 'membre.nouveau' })
      dbNewRes.length.should.equal(1);
      dbNewRes[0].primary_email.should.equal(primaryEmail);
      await knex('users').where({ username: 'membre.nouveau' }).update({
        primary_email: `${username}@${config.domain}`
      })
      isPublicServiceEmailStub.called.should.be.true;
      isPublicServiceEmailStub.restore()
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
        })
        .persist();

      utils.mockUsers();
      utils.mockOvhTime();
      utils.mockOvhUserResponder();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();

      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200);

      chai
        .request(app)
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

      chai
        .request(app)
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
        })
        .persist();

      utils.mockUsers();
      utils.mockOvhTime();
      utils.mockOvhUserResponder();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();

      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200);

      chai
        .request(app)
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
        })
        .persist();

      utils.mockUsers();
      utils.mockOvhTime();
      utils.mockOvhUserResponder();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();

      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200);

      chai
        .request(app)
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
      await knex('marrainage').truncate();
    });
    let betagouvCreateEmail;
    beforeEach((done) => {
      betagouvCreateEmail = sinon.spy(Betagouv, 'createEmail');
      done();
    });

    afterEach(async () => {
      betagouvCreateEmail.restore();
    });

    it('should create missing email accounts', async () => {
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
      utils.mockOvhUserResponder();
      utils.mockOvhUserEmailInfos();

      const newMember = testUsers.find((user) => user.id === 'membre.nouveau');
      const allAccountsExceptANewMember = testUsers.filter(
        (user) => user.id !== newMember.id
      );

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account/)
        .reply(
          200,
          allAccountsExceptANewMember.map((user) => user.id)
        );
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);
      await knex('login_tokens').truncate()
      await knex('users').where({
        username: newMember.id,
      }).update({
        primary_email: null,
        primary_email_status: EmailStatusCode.EMAIL_CREATION_PENDING,
        secondary_email: 'membre.nouveau.perso@example.com',
      });
      const val = await knex('users').where({
        username: newMember.id,
      })
      await createEmailAddresses();
      ovhEmailCreation.isDone().should.be.true;
      betagouvCreateEmail.firstCall.args[0].should.equal(newMember.id);
      await knex('users').where({ username: newMember.id }).update({
        secondary_email: null,
        primary_email: `${newMember.id}@${config.domain}`,
      });
    });


    it('should not create email accounts if already created', async() => {
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

        await createEmailAddresses();
        betagouvCreateEmail.notCalled.should.be.true;
        ovhEmailCreation.isDone().should.be.false;
    });

    it('should not create email accounts if we dont have the secondary email', async () => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      await createEmailAddresses();
      betagouvCreateEmail.notCalled.should.be.true;
      ovhEmailCreation.isDone().should.be.false;
    });
  });
});
