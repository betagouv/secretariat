import chai from 'chai';
import chaiHttp from 'chai-http';
import crypto from 'crypto';
import sinon from 'sinon';
import config from '@config';
import * as controllerUtils from '@/controllers/utils';
import knex from '@/db';
import app from '@/index';
import db from '@/db';
import { EmailStatusCode } from '@/models/dbUser';

chai.use(chaiHttp);

describe('Login token', () => {
  let sendEmailStub;

  beforeEach((done) => {
    sendEmailStub = sinon.stub(controllerUtils, 'sendMail').returns(Promise.resolve(true));
    done();
  });

  afterEach((done) => {
    sendEmailStub.restore();
    done();
  });

  it('should be stored after login request', async () => {
    const userEmail = `membre.nouveau@${config.domain}`;
    await db('users').insert({
      primary_email: userEmail,
      username: 'membre.nouveau',
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE
    }).onConflict('username').merge()
    
    // Make a login request to generate a token
    await chai.request(app)
      .post('/login')
      .type('form')
      .send({
        emailInput: userEmail,
      })
    
    const dbRes = await knex('login_tokens').select().where({ email: userEmail })
    dbRes.length.should.equal(1);
    dbRes[0].email.should.equal(userEmail);
    dbRes[0].username.should.equal('membre.nouveau');
  });

  it('should be deleted after use', async () => {
    const userEmail = `membre.actif@${config.domain}`;
    // Make a login request to generate a token
    await chai.request(app)
      .post('/login')
      .type('form')
      .send({
        emailInput: userEmail,
      })

      // Extract token from the DB
    const token = await knex('login_tokens').select().where({ email: userEmail }).then((dbRes) => dbRes[0].token)
      // Use the token making a GET request
    await chai.request(app).get(`/signin?next=users&token=${encodeURIComponent(token)}`)
    await chai.request(app).post(`/signin`)
    .type('form')
    .send({
      next: '/community',
      token: encodeURIComponent(token)
    })
    const dbRes = await knex('login_tokens').select().where({ email: userEmail })
    dbRes.length.should.equal(0);
  });

  it('should only be usable once', async () => {
    const userEmail = `membre.actif@${config.domain}`;
    let token = null

    // Make a login request to generate a token
    await chai.request(app)
      .post('/login')
      .type('form')
      .send({
        emailInput: userEmail,
      })

      // Extract token from the DB
    token = await knex('login_tokens').select().where({ email: userEmail })
      .then((dbRes) => token = dbRes[0].token)

      // Use the token to make a first GET request
    await chai.request(app).get(`/signin?next=${'/community'}&token=${encodeURIComponent(token)}`)
    const res1 = await chai.request(app).post(`/signin`)
    .type('form')
    .send({
      next: '/community',
      token: encodeURIComponent(token)
    })
    .redirects(0)
    res1.should.have.cookie('token');

    // Make the same GET request again (second time)
    const res2 = await chai.request(app).post(`/signin`)
    .type('form')
    .send({
      next: '/community',
      token: encodeURIComponent(token)
    })
    .redirects(0)

    // Ensure the response did NOT set an auth cookie
    res2.should.not.have.cookie('token');
  });

  it('should work if user has no primary_email', async () => {

    const userEmail = `membre.actif@email.toto`;

    await db('users').insert({
      primary_email: null,
      secondary_email: userEmail,
      username: 'membre.nouveau',
      primary_email_status: EmailStatusCode.EMAIL_CREATION_PENDING
    }).onConflict('username').merge()
    
    // Make a login request to generate a token
    await chai.request(app)
      .post('/login')
      .type('form')
      .send({
        emailInput: userEmail,
      })

      // Extract token from the DB
    const token = await knex('login_tokens').select().where({ email: userEmail }).then((dbRes) => dbRes[0].token)
      // Use the token making a GET request
    await chai.request(app).get(`/signin?next=users&token=${encodeURIComponent(token)}`)
    await chai.request(app).post(`/signin`)
    .type('form')
    .send({
      next: '/community',
      token: encodeURIComponent(token)
    })
    const dbRes = await knex('login_tokens').select().where({ email: userEmail })
    dbRes.length.should.equal(0);

    await db('users').update({
      primary_email: `membre.nouveau@${config.domain}`,
      secondary_email: null,
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE
    }).where({
      username: 'membre.nouveau'
    })
  });


  it('should not be used if expired', async () => {
    // Create expired token
    const userEmail = `membre.actif@${config.domain}`;
    const token = crypto.randomBytes(256).toString('base64');
    const expirationDate = new Date();

    await knex('login_tokens').insert({
      token,
      username: 'membre.actif',
      email: userEmail,
      expires_at: expirationDate,
    })
    // Try to login using this expired token
    const res = await chai.request(app).get(`/community?token=${encodeURIComponent(token)}`).redirects(0)
    // Ensure the response did NOT set an auth cookie
    res.should.not.have.cookie('token');
  });
});
