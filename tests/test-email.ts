import chai from 'chai';
import chaiHttp from 'chai-http';
import _ from 'lodash/array';
import nock from 'nock';
import sinon from 'sinon';
import rewire from 'rewire';
import testUsers from './users.json';
import utilsTest from './utils';
import utils from '../src/controllers/utils';
import betagouv from '../src/betagouv';

chai.use(chaiHttp);

const emailScheduler = rewire('../src/schedulers/emailScheduler');

describe('getUnregisteredOVHUsers', () => {
  beforeEach(async () => {
    utilsTest.cleanMocks();
    utilsTest.mockOvhTime();
  });

  it('should return accounts not registered in OVH and registered in github ', async () => {
    const newMember = testUsers.find((user) => user.id === 'membre.nouveau');
    const allAccountsExceptANewMember = testUsers.filter((user) => user.id !== newMember.id);

    nock(/.*ovh.com/)
    .get(/^.*email\/domain\/.*\/account/)
    .reply(200, allAccountsExceptANewMember.map((user) => user.id));

    const getUnregisteredOVHUsers = emailScheduler.__get__('getUnregisteredOVHUsers');
    const result = await getUnregisteredOVHUsers(testUsers);

    result.length.should.be.equal(1);
    result[0].id.should.be.equal(newMember.id);
    result[0].fullname.should.be.equal(newMember.fullname);
  });

  it('should not use expired accounts', async () => {
    utilsTest.mockUsers();
    const expiredMember = testUsers.find((user) => user.id === 'membre.expire');
    const getValidUsers = emailScheduler.__get__('getValidUsers');
    const result = await getValidUsers(testUsers);

    chai.should().not.exist(result.find((x) => x.id === expiredMember.id));
  });

  it('should return no accounts if there is no new ones in github', async () => {
    nock(/.*ovh.com/)
    .get(/^.*email\/domain\/.*\/account/)
    .reply(200, testUsers.map((user) => user.id));

    const getUnregisteredOVHUsers = emailScheduler.__get__('getUnregisteredOVHUsers');
    const result = await getUnregisteredOVHUsers(testUsers);

    result.length.should.be.equal(0);
  });

  it('should return all github accounts if there is nothing inside OVH ', async () => {
    nock(/.*ovh.com/)
    .get(/^.*email\/domain\/.*\/account/)
    .reply(200, []);

    const getUnregisteredOVHUsers = emailScheduler.__get__('getUnregisteredOVHUsers');
    const result = await getUnregisteredOVHUsers(testUsers);

    _.difference(result, testUsers).length.should.equal(0);
  });
});

describe('Reinit password for expired users', () => {
  const datePassed = new Date();
  datePassed.setDate(datePassed.getDate() - 1);
  const formatedDate = utils.formatDateYearMonthDay(datePassed);
  const users =  [
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
      end: `${formatedDate}`,
      employer: 'admin/'
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

    const funcCalled = sinon.spy(betagouv, 'changePassword');
    utilsTest.mockOvhChangePassword();
    await emailScheduler.reinitPasswordEmail();
    funcCalled.calledOnce;
  });
});
