import chai from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';
import sinon from 'sinon';
import Betagouv from '@/betagouv';
import config from '@config';
import * as controllerUtils from '@controllers/utils';
import * as mattermost from '@/lib/mattermost';
import knex from '@/db';
import app from '@/index';
import { createEmailAddresses, subscribeEmailAddresses, unsubscribeEmailAddresses } from '@/schedulers/emailScheduler';
import testUsers from './users.json';
import utils from './utils';
import { EmailStatusCode } from '@/models/dbUser/dbUser'
import * as session from '@/helpers/session';

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
    let getToken
        let sendEmailStub;
    beforeEach((done) => {
      sendEmailStub = sinon
        .stub(controllerUtils, 'sendMail')
        .returns(Promise.resolve(true))
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
      done()
    });

    afterEach((done) => {
      sendEmailStub.restore()
      getToken.restore()
      done()
    });

    it('should ask OVH to create an email', async () => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);
          await knex('users').where({ username: 'membre.nouveau'}).update({
            primary_email: null
          })
          await chai
            .request(app)
            .post('/users/membre.nouveau/email')
            .type('form')
            .send({
              to_email: 'test@example.com',
            })
          
          const res = await knex('users').where({ username: 'membre.nouveau'}).first()
          res.primary_email.should.equal(`membre.nouveau@${config.domain}`)
          ovhEmailCreation.isDone().should.be.true;
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
      getToken.returns(utils.getJWT('membre.expire'))

      chai
        .request(app)
        .post('/users/membre.nouveau/email')
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });

    it('should allow email creation from delegate if user is active', async () => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);
      await knex('users').where({ username: 'membre.actif'}).update({
        primary_email: null
      })
      getToken.returns(utils.getJWT('julien.dauphant'))
      await chai
        .request(app)
        .post('/users/membre.actif/email')
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        ovhEmailCreation.isDone().should.be.true;
        const user = await knex('users').where({ username: 'membre.actif' }).first()
        user.secondary_email.should.equal('test@example.com')
    });

    it('should create email and insert user in database if user on github', async () => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);
      await knex('users').where({ username: 'membre.actif'}).delete()
      getToken.returns(utils.getJWT('julien.dauphant'))
      await chai
        .request(app)
        .post('/users/membre.actif/email')
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        ovhEmailCreation.isDone().should.be.true;
        const user = await knex('users').where({ username: 'membre.actif' }).first()
        user.secondary_email.should.equal('test@example.com')
    });8

  });

  describe('POST /api/users/:username/create-email unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai
        .request(app)
        .post('/api/users/membre.parti/create-email')
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
  describe('POST /api/users/:username/create-email authenticated', () => {
    let getToken
    let sendEmailStub;
    beforeEach((done) => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
      sendEmailStub = sinon
        .stub(controllerUtils, 'sendMail')
        .returns(Promise.resolve(true))
      done()
    });

    afterEach((done) => {
      sendEmailStub.restore()
      getToken.restore()
      done()
    });

    it('should ask OVH to create an email', async () => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);
          await knex('users').where({ username: 'membre.nouveau'}).update({
            primary_email: null
          })
          await chai
            .request(app)
            .post('/api/users/membre.nouveau/create-email')
            .send({
              to_email: 'test@example.com',
            })
          
          const res = await knex('users').where({ username: 'membre.nouveau'}).first()
          res.primary_email.should.equal(`membre.nouveau@${config.domain}`)
          ovhEmailCreation.isDone().should.be.true;
    });
  });

  describe('GET /api/public/users/:username unauthenticated', () => {
    let sendEmailStub;
    let mattermostSearchUserStub;
    let mattermostGetUserStub;
    beforeEach((done) => {
      sendEmailStub = sinon
        .stub(controllerUtils, 'sendMail')
        .returns(Promise.resolve(true))
        mattermostSearchUserStub = sinon.stub(mattermost, 'searchUsers').returns(Promise.resolve([{
        email: 'adresse.email@beta.gouv.fr'
      }]))
      mattermostGetUserStub = sinon.stub(mattermost, 'getUserByEmail').returns(Promise.resolve({
        email: 'adresse.email@beta.gouv.fr'
      } as mattermost.MattermostUser))
      done()
    });

    afterEach((done) => {
      sendEmailStub.restore()
      mattermostGetUserStub.restore()
      mattermostSearchUserStub.restore()
      done()
    });

    it('should get user public info', async () => {
        const res = await chai
          .request(app)
          .get('/api/public/users/membre.nouveau')
        res.should.have.status(200);
        res.body.username.should.equal('membre.nouveau')
        mattermostSearchUserStub.calledOnce.should.be.true
        mattermostGetUserStub.calledOnce.should.be.true
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
    let getToken
    
    beforeEach(() => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
    })

    afterEach(() => {
      getToken.restore()
    })

    it('should ask OVH to create a redirection', (done) => {
      const ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      chai
        .request(app)
        .post('/users/membre.actif/redirections')
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
      getToken.returns(utils.getJWT('membre.expire'))
      chai
        .request(app)
        .post('/users/membre.expire/redirections')
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
    let getToken
    
    beforeEach(() => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
    })

    afterEach(() => {
      getToken.restore()
    })

    it('should ask OVH to delete a redirection', (done) => {
      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);

      chai
        .request(app)
        .post('/users/membre.actif/redirections/test-2@example.com/delete')
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
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.false;
          done();
        });
    });

    it('should not allow redirection deletion from expired users', (done) => {
      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);
      getToken.returns(utils.getJWT('membre.expire'))

      chai
        .request(app)
        .post('/users/membre.expire/redirections/test-2@example.com/delete')
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
    let getToken
    
    beforeEach(() => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
    })

    afterEach(() => {
      getToken.restore()
    })

    it('should redirect to user page', (done) => {
      chai
        .request(app)
        .post('/users/membre.actif/password')
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
      getToken.returns(utils.getJWT(`${username}`))
      await chai
        .request(app)
        .post(`/users/${username}/password`)
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
      getToken.returns(utils.getJWT(`${username}`))
      await chai
      .request(app)
      .post(`/users/${username}/password`)
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
      getToken.returns(utils.getJWT('membre.expire'))

      chai
        .request(app)
        .post('/users/membre.expire/password')
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
    let getToken
    
    beforeEach(() => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
    })

    afterEach(() => {
      getToken.restore()
    })
    it('should keep the user in database secretariat', async() => {
      const addRedirection = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      const dbRes = await knex('users').select().where({ username: 'membre.actif' })
      dbRes.length.should.equal(1);
      await chai
        .request(app)
        .post('/users/membre.actif/email/delete')
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
        .end((err, res) => {
          ovhRedirectionDepartureEmail.isDone().should.be.true;
          done();
        });
    });
  });

  describe('POST /users/:username/secondary_email', () => {
    let getToken
    
    beforeEach((done) => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.nouveau'))
      done()
    })

    afterEach((done) => {
      getToken.restore()
      done()
    })
    it('should return 200 to add secondary email', async () => {
      const username = 'membre.nouveau';
      const secondaryEmail = 'membre.nouveau.perso@example.com';
      const res = await chai
        .request(app)
        .post('/users/membre.nouveau/secondary_email')
        .type('form')
        .send({
          username,
          secondaryEmail,
        })
      res.should.have.status(200);
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
  });

  describe('POST /users/:username/primary_email', () => {
    let mattermostGetUserByEmailStub
    let isPublicServiceEmailStub
    let getToken

    beforeEach(() => {
      mattermostGetUserByEmailStub = sinon
        .stub(mattermost, 'getUserByEmail')
        .returns(Promise.resolve(true));
      isPublicServiceEmailStub = sinon
        .stub(controllerUtils, 'isPublicServiceEmail')
        .returns(Promise.resolve(true));
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.nouveau'))
    })
    afterEach(() => {
      mattermostGetUserByEmailStub.restore();
      isPublicServiceEmailStub.restore();
      getToken.restore()
    })

    it('should not update primary email if user is not current user', async() => {
      const username = 'membre.nouveau';
      const primaryEmail = 'membre.nouveau.new@example.com';
      getToken.returns(utils.getJWT('julien.dauphant'))

      await chai.request(app)
        .post(`/users/${username}/primary_email/`)
        .type('form')
        .send({
          username,
          primaryEmail: primaryEmail,
        });
        isPublicServiceEmailStub.called.should.be.false;
        mattermostGetUserByEmailStub.called.should.be.false;
      });

    it('should not update primary email if email is not public service email', async() => {
      const username = 'membre.nouveau';
      const primaryEmail = 'membre.nouveau.new@example.com';
      isPublicServiceEmailStub.returns(Promise.resolve(false));
      getToken.returns(utils.getJWT('membre.nouveau'))

      await chai.request(app)
        .post(`/users/${username}/primary_email/`)
        .type('form')
        .send({
          username,
          primaryEmail: primaryEmail,
        });
      const dbNewRes = await knex('users').select().where({ username: 'membre.nouveau' })
      dbNewRes.length.should.equal(1);
      dbNewRes[0].primary_email.should.not.equal(primaryEmail);
      isPublicServiceEmailStub.called.should.be.true;
      mattermostGetUserByEmailStub.called.should.be.false;
    });

    it('should not update primary email if email does not exist on mattermost', async() => {
      isPublicServiceEmailStub.returns(Promise.resolve(true));
      mattermostGetUserByEmailStub.returns(Promise.reject('404 error'));
      const username = 'membre.nouveau';
      const primaryEmail = 'membre.nouveau.new@example.com';
      getToken.returns(utils.getJWT('membre.nouveau'))

      await chai.request(app)
        .post(`/users/${username}/primary_email/`)
        .type('form')
        .send({
          username,
          primaryEmail: primaryEmail,
        });
      const dbNewRes = await knex('users').select().where({ username: 'membre.nouveau' })
      dbNewRes.length.should.equal(1);
      dbNewRes[0].primary_email.should.not.equal(primaryEmail);
      mattermostGetUserByEmailStub.called.should.be.true;
    });

    it('should update primary email', async() => {
      isPublicServiceEmailStub.returns(Promise.resolve(true));
      mattermostGetUserByEmailStub.returns(Promise.resolve(true));
      const username = 'membre.nouveau';
      const primaryEmail = 'membre.nouveau.new@example.com';
      getToken.returns(utils.getJWT('membre.nouveau'))

      await chai.request(app)
        .post(`/users/${username}/primary_email/`)
        .type('form')
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
      mattermostGetUserByEmailStub.called.should.be.true;
    });
  });

  describe('POST /users/:username/redirections/:email/delete authenticated', () => {
    let getToken
    
    beforeEach(() => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
    })

    afterEach(() => {
      getToken.restore()
    })

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
      getToken.returns(utils.getJWT('membre.nouveau'))
      chai
        .request(app)
        .post('/users/membre.actif/email/delete')
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
        primary_email_status: EmailStatusCode.EMAIL_UNSET,
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

    it('should subscribe user to incubateur mailing list', async () => {
      const url = process.env.USERS_API || 'https://beta.gouv.fr';
      utils.cleanMocks();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
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
        const subscribeSpy = sinon
            .spy(Betagouv, 'subscribeToMailingList')
      const newMember = testUsers.find((user) => user.id === 'membre.nouveau');
      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account/)
        .reply(200, [newMember]);
      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/mailingList\/.*\/subscriber/)
        .reply(200, []);
      const ovhMailingListSubscription = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/mailingList\/.*\/subscriber/)
        .reply(200).persist();

      await subscribeEmailAddresses();
      ovhMailingListSubscription.isDone().should.be.true;
      subscribeSpy.firstCall.args[0].should.equal(config.incubateurMailingListName)
      subscribeSpy.firstCall.args[1].should.equal(`membre.nouveau@${config.domain}`)
      subscribeSpy.restore()
    });

    it('should unsubscribe user from incubateur mailing list', async () => {
      const url = process.env.USERS_API || 'https://beta.gouv.fr';
      utils.cleanMocks();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
      nock(url)
        .get((uri) => uri.includes('authors.json'))
        .reply(200, [
          {
            id: 'membre.nouveau',
            fullname: 'membre Nouveau',
            missions: [
              {
                end: new Date('12/01/1991').toISOString().split('T')[0],
              },
            ],
          },
        ])
      const unsubscribeSpy = sinon
          .spy(Betagouv, 'unsubscribeFromMailingList')
      const newMember = testUsers.find((user) => user.id === 'membre.nouveau');
      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account/)
        .reply(200, [newMember]);
      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/mailingList\/.*\/subscriber/)
        .reply(200, [`membre.nouveau@${config.domain}`]);
      const ovhMailingListUnsubscription = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/mailingList\/.*\/subscriber.*/)
        .reply(200).persist();

      await unsubscribeEmailAddresses();
      ovhMailingListUnsubscription.isDone().should.be.true;
      unsubscribeSpy.firstCall.args[0].should.equal(config.incubateurMailingListName)
      unsubscribeSpy.firstCall.args[1].should.equal(`membre.nouveau@${config.domain}`)
      unsubscribeSpy.restore()
    });
  });
});
