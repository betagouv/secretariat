const nock = require('nock');
const chai = require('chai');
const sinon = require('sinon');
const app = require('../index');
const knex = require('../db');
const controllerUtils = require('../controllers/utils');

describe('Password Reset', () => {
  beforeEach((done) => {
    this.sendEmailStub = sinon.stub(controllerUtils, 'sendMail').returns(true);
    this.ovhPasswordNock = nock(/.*ovh.com/)
      .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
      .reply(200);
    done();
  });

  afterEach((done) => {
    knex('users').truncate()
      .then(() => knex('password_reset_tokens').truncate())
      .then(() => this.sendEmailStub.restore())
      .then(() => done());
  });

  it('GET /passwordReset contains form', (done) => {
    chai.request(app)
      .get('/passwordReset')
      .end((err, res) => {
        res.text.should.include('<form action="/passwordReset"');
        done();
      });
  });

  it('POST /passwordReset redirects to email sent view', (done) => {
    nock.cleanAll();
    nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, { email: 'membre.actif.pro@example.com' })
        .persist();
    const user = {
      username: 'membre.actif',
      secondary_email: 'membre.actif@example.com',
    };
    knex('users').insert(user)
    .then(() => {
      chai.request(app)
        .post('/passwordReset')
        .type('form')
        .send({ email: 'membre.actif@example.com' })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/passwordReset/emailSent');
          done();
        });
    })
    .catch(done);
  });

  it('POST /passwordReset with valid user sends email', (done) => {
    nock.cleanAll();
    nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, { email: 'membre.actif.pro@example.com' })
        .persist();

    const user = {
      username: 'membre.actif',
      secondary_email: 'membre.actif@example.com',
    };
    knex('users').insert(user)
    .then(() => {
      chai.request(app)
        .post('/passwordReset')
        .type('form')
        .send({ email: 'membre.actif@example.com' })
        .end((err, res) => {
          this.sendEmailStub.calledOnce.should.be.true;
          done();
        });
    })
    .catch(done);
  });

  it('POST /passwordReset with non-existent user does not send email', (done) => {
    chai.request(app)
      .post('/passwordReset')
      .type('form')
      .send({ email: 'utilisateur.qui.n.existe.pas@example.com' })
      .end((err, res) => {
        this.sendEmailStub.called.should.be.false;
        done();
      });
  });

  it('Expired tokens are not taken into account', (done) => {
    const passwordResetToken = {
      token: 'token',
      username: 'membre.actif',
      email: 'membre.actif.pro@example.com',
      expires_at: new Date(),
    };

    knex('password_reset_tokens').insert(passwordResetToken)
    .then(() => {
      chai.request(app)
      .post('/passwordReset/form')
      .type('form')
      .send({
        password1: 'passwordTest',
        password2: 'passwordTest',
        token: 'token',
      })
      .redirects(0)
      .end((err, res) => {
        this.ovhPasswordNock.isDone().should.be.false;
        res.should.have.status(302);
        res.headers.location.should.includes('/passwordReset/form');
        done();
      });
    })
    .catch(done);
  });

  it('GET /passwordReset/form without token redirects to passwordReset', (done) => {
    chai.request(app)
      .get('/passwordReset/form')
      .redirects(0)
      .end((err, res) => {
        res.should.have.status(302);
        res.headers.location.should.equal('/passwordReset');
        done();
      });
  });

  it('GET /passwordReset/form with invalid token redirects to passwordReset', (done) => {
    chai.request(app)
      .get('/passwordReset/form?passwordResetToken=invalid_token')
      .redirects(0)
      .end((err, res) => {
        res.should.have.status(302);
        res.headers.location.should.equal('/passwordReset');
        done();
      });
  });

  it('GET /passwordReset/form with valid token contains a form', (done) => {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    const passwordResetToken = {
      token: 'token',
      username: 'membre.actif',
      email: 'membre.actif.pro@example.com',
      expires_at: expirationDate,
    };
    knex('password_reset_tokens').insert(passwordResetToken)
    .then(() => {
      chai.request(app)
      .get('/passwordReset/form?passwordResetToken=token')
      .end((err, res) => {
        res.text.should.include('<form action="/passwordReset/form"');
        done();
      });
    })
    .catch(done);
  });

  it('POST /passwordReset/form with valid token calls OVH', (done) => {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    const passwordResetToken = {
      token: 'token',
      username: 'membre.actif',
      email: 'membre.actif.pro@example.com',
      expires_at: expirationDate,
    };

    knex('password_reset_tokens').insert(passwordResetToken)
    .then(() => {
      chai.request(app)
      .post('/passwordReset/form')
      .type('form')
      .send({
        password1: 'passwordTest',
        password2: 'passwordTest',
        token: 'token',
      })
      .redirects(0)
      .end((err, res) => {
        this.ovhPasswordNock.isDone().should.be.true;
        res.should.have.status(302);
        res.headers.location.should.equal('/login');
        done();
      });
    })
    .catch(done);
  });

  it('POST /passwordReset/form with invalid token does not call OVH', (done) => {
    chai.request(app)
      .post('/passwordReset/form')
      .type('form')
      .send({
        password1: 'passwordTest',
        password2: 'passwordTest',
        token: 'invalid_token',
      })
      .redirects(0)
      .end((err, res) => {
        this.ovhPasswordNock.isDone().should.be.false;
        res.should.have.status(302);
        res.headers.location.should.include('/passwordReset/form');
        done();
      });
  });

  it('POST /passwordReset/form with missmatching passwords does not call OVH', (done) => {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    const passwordResetToken = {
      token: 'token',
      username: 'membre.actif',
      email: 'membre.actif.pro@example.com',
      expires_at: expirationDate,
    };

    knex('password_reset_tokens').insert(passwordResetToken)
    .then(() => {
      chai.request(app)
      .post('/passwordReset/form')
      .type('form')
      .send({
        password1: 'passwordTest1',
        password2: 'passwordTest2',
        token: 'token',
      })
      .redirects(0)
      .end((err, res) => {
        this.ovhPasswordNock.isDone().should.be.false;
        res.should.have.status(302);
        res.headers.location.should.includes('/passwordReset/form');
        done();
      });
    })
    .catch(done);
  });
});
