const sinon = require('sinon');
const chai = require('chai');
const crypto = require('crypto');
const controllerUtils = require('../controllers/utils');
const app = require('../index');
const knex = require('../db');

describe('Login token', () => {
  const domain = `${process.env.SECRETARIAT_DOMAIN || 'beta.gouv.fr'}`;

  beforeEach((done) => {
    this.sendEmailStub = sinon.stub(controllerUtils, 'sendMail').returns(true);
    done();
  });

  afterEach((done) => {
    this.sendEmailStub.restore();
    done();
  });

  it('should be stored after login request', (done) => {
    const userEmail = `utilisateur.nouveau@${domain}`;

    // Make a login request to generate a token
    chai.request(app)
      .post('/login')
      .type('form')
      .send({
        id: 'utilisateur.nouveau',
      })

      // Verify the token has been stored in the database
      .then(() => knex('login_tokens').select().where({ email: userEmail }))
      .then((dbRes) => {
        dbRes.length.should.equal(1);
        dbRes[0].email.should.equal(userEmail);
        dbRes[0].username.should.equal('utilisateur.nouveau');
      })
      .then(done)
      .catch(done);
  });

  it('should be deleted after use', (done) => {
    const userEmail = `utilisateur.actif@${domain}`;

    // Make a login request to generate a token
    chai.request(app)
      .post('/login')
      .type('form')
      .send({
        id: 'utilisateur.actif',
      })

      // Extract token from the DB
      .then(() => knex('login_tokens').select().where({ email: userEmail }))
      .then((dbRes) => dbRes[0].token)

      // Use the token making a GET request
      .then((token) => chai.request(app).get(`/users?token=${encodeURIComponent(token)}`))

      // Ensure no tokens for this user remain
      .then(() => knex('login_tokens').select().where({ email: userEmail }))
      .then((dbRes) => {
        dbRes.length.should.equal(0);
      })
      .then(done)
      .catch(done);
  });

  it('should only be usable once', (done) => {
    const userEmail = `utilisateur.actif@${domain}`;

    // Make a login request to generate a token
    chai.request(app)
      .post('/login')
      .type('form')
      .send({
        id: 'utilisateur.actif',
      })

      // Extract token from the DB
      .then(() => knex('login_tokens').select().where({ email: userEmail }))
      .then((dbRes) => dbRes[0].token)

      // Use the token to make a first GET request
      .then((token) => chai.request(app).get(`/users?token=${encodeURIComponent(token)}`).redirects(0))

      // Ensure the response sets the token auth cookie
      .then((res) => {
        res.should.have.cookie('token');
      })

      // Make the same GET request again (second time)
      .then((token) => chai.request(app).get(`/users?token=${encodeURIComponent(token)}`).redirects(0))

      // Ensure the response did NOT set an auth cookie
      .then((res) => {
        res.should.not.have.cookie('token');
      })
      .then(done)
      .catch(done);
  });

  it('should not be used if expired', (done) => {
    // Create expired token
    const userEmail = `utilisateur.actif@${domain}`;
    const token = crypto.randomBytes(256).toString('base64');
    const expirationDate = new Date();

    knex('login_tokens').insert({
      token,
      username: 'utilisateur.actif',
      email: userEmail,
      expires_at: expirationDate,
    })

    // Try to login using this expired token
      .then(() => chai.request(app).get(`/users?token=${encodeURIComponent(token)}`).redirects(0))

    // Ensure the response did NOT set an auth cookie
      .then((res) => {
        res.should.not.have.cookie('token');
      })
      .then(done)
      .catch(done);
  });
});
