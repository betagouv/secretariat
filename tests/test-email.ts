import chai from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';
import sinon from 'sinon';
import rewire from 'rewire';
import testUsers from './users.json';
import utilsTest from './utils';
import * as utils from '@/controllers/utils';
import betagouv from '@/betagouv';
import knex from '@/db';
import * as email from '@/config/email.config'
import { EmailStatusCode } from '@/models/dbUser/dbUser';

chai.use(chaiHttp);

const emailScheduler = rewire('@/schedulers/emailScheduler');

describe('getUnregisteredOVHUsers', () => {
  beforeEach(async () => {
    utilsTest.cleanMocks();
    utilsTest.mockOvhTime();
  });

  it('should not use expired accounts', async () => {
    utilsTest.mockUsers();
    const expiredMember = testUsers.find((user) => user.id === 'membre.expire');
    const getValidUsers = emailScheduler.__get__('getValidUsers');
    const result = await getValidUsers(testUsers);

    chai.should().not.exist(result.find((x) => x.id === expiredMember.id));
  });
});

describe('Reinit password for expired users', () => {
  const datePassed = new Date();
  datePassed.setDate(datePassed.getDate() - 5);
  const formatedDate = utils.formatDateYearMonthDay(datePassed);
  const users = [
    {
      id: 'membre.actif',
      fullname: 'membre actif',
      role: 'Chargé de déploiement',
      start: '2020-09-01',
      end: '2090-01-30',
      employer: 'admin/',
    },
    {
      id: 'membre.expire',
      fullname: 'membre expire',
      role: 'Intrapreneur',
      start: '2018-01-01',
      end: `${formatedDate}`,
      employer: 'admin/',
    },
  ];

  beforeEach(async () => {
    utilsTest.cleanMocks();
    utilsTest.mockOvhTime();
  });

  it('should call once ovh api to change password', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr'; // can't replace with config.usersApi ?
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, users)
      .persist();
    utilsTest.mockUsers();
    utilsTest.mockOvhTime();
    utilsTest.mockOvhRedirections();
    utilsTest.mockOvhUserResponder();
    nock(/.*ovh.com/)
    .get(/^.*email\/domain\/.*\/account\/.*/)
    .reply(200, {
      accountName: 'membre.expire',
      email: `membre.expire@betagouv.ovh`,
    });
    await knex('users').where({ username: 'membre.expire' }).update({
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE
    })
    const funcCalled = sinon.spy(betagouv, 'changePassword');
    utilsTest.mockOvhChangePassword();
    await emailScheduler.reinitPasswordEmail();
    const dbUsers = await knex('users').where({ username: 'membre.expire'})
    dbUsers.length.should.be.equal(1)
    dbUsers[0].primary_email_status.should.be.equal(EmailStatusCode.EMAIL_SUSPENDED)
    funcCalled.calledOnce;
  });
});

describe('Set email active', () => {
 
  let sendEmailStub;
  let smtpBlockedContactsEmailDelete
  beforeEach((done) => {
    sendEmailStub = sinon.stub(email, 'sendEmail').returns(Promise.resolve(null));
    smtpBlockedContactsEmailDelete = sinon.stub(email, 'smtpBlockedContactsEmailDelete').returns(Promise.resolve(null))
    utilsTest.cleanMocks();
    utilsTest.mockOvhTime();
    done();
  });

  afterEach((done) => {
    sendEmailStub.restore()
    smtpBlockedContactsEmailDelete.restore()
    done()
  })

  it('should set status to EMAIL_ACTIVE and sendEmailCreatedEmail if status is EMAIL_CRATION_PENDING', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr'; // can't replace with config.usersApi ?
    nock(url)
    .get((uri) => uri.includes('authors.json'))
    .reply(200, [
      {
        id: 'membre.nouveau',
        fullname: 'membre.nouveau',
        role: 'Chargé de déploiement',
        start: '2020-09-01',
        end: '2090-01-30',
        employer: 'admin/',
      },
    ])
    .persist();
  
    const now = new Date()
    const nowLess10Minutes = now.getTime() - (11 * 60 * 1000) 
    await knex('users').where({
      username: 'membre.nouveau'
    }).update({
      primary_email_status: EmailStatusCode.EMAIL_UNSET,
      primary_email_status_updated_at: new Date(now)
    })
    await emailScheduler.setEmailAddressesActive();
    let users = await knex('users').where({
      username: 'membre.nouveau',
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE
    }).returning('*')
    users.length.should.be.equal(0)
    await knex('users').where({
      username: 'membre.nouveau'
    }).update({
      primary_email_status: EmailStatusCode.EMAIL_CREATION_PENDING,
      primary_email_status_updated_at: new Date(nowLess10Minutes)
    })
    await emailScheduler.setEmailAddressesActive();
    users = await knex('users').where({
      username: 'membre.nouveau',
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE
    }).returning('*')
    users[0].username.should.be.equal('membre.nouveau')
    sendEmailStub.calledOnce.should.be.true;
    smtpBlockedContactsEmailDelete.calledOnce.should.be.true;
    await knex('users').where({
      username: 'membre.nouveau'
    }).update({
      primary_email_status: EmailStatusCode.EMAIL_UNSET,
      primary_email_status_updated_at: new Date(now)
    })
  });

  it('should set status to EMAIL_ACTIVE and if status is EMAIL_RECREATION_PENDING', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr'; // can't replace with config.usersApi ?
    nock(url)
    .get((uri) => uri.includes('authors.json'))
    .reply(200, [
      {
        id: 'membre.nouveau',
        fullname: 'membre.nouveau',
        role: 'Chargé de déploiement',
        start: '2020-09-01',
        end: '2090-01-30',
        employer: 'admin/',
      },
    ])
    .persist();
  
    const now = new Date()
    const nowLess10Minutes = now.getTime() - (11 * 60 * 1000) 
    await knex('users').where({
      username: 'membre.nouveau'
    }).update({
      primary_email_status: EmailStatusCode.EMAIL_UNSET,
      primary_email_status_updated_at: new Date(now)
    })
    await emailScheduler.setEmailAddressesActive();
    let users = await knex('users').where({
      username: 'membre.nouveau',
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE
    }).returning('*')
    users.length.should.be.equal(0)
    await knex('users').where({
      username: 'membre.nouveau'
    }).update({
      primary_email_status: EmailStatusCode.EMAIL_RECREATION_PENDING,
      primary_email_status_updated_at: new Date(nowLess10Minutes)
    })
    await emailScheduler.setEmailAddressesActive();
    users = await knex('users').where({
      username: 'membre.nouveau',
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE
    }).returning('*')
    sendEmailStub.calledOnce.should.be.true;
    smtpBlockedContactsEmailDelete.calledOnce.should.be.true;
    users[0].username.should.be.equal('membre.nouveau')
    await knex('users').where({
      username: 'membre.nouveau'
    }).update({
      primary_email_status: EmailStatusCode.EMAIL_UNSET,
      primary_email_status_updated_at: new Date(now)
    })
  });
});
