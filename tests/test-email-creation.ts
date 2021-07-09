import chai from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';
import _ from 'lodash/array';
import testUsers from './users.json';
import rewire from 'rewire';
import utils from './utils.js';

chai.use(chaiHttp);

const emailCreationScheduler = rewire('../src/schedulers/emailCreationScheduler');

describe('getUnregisteredOVHUsers', () => {
  beforeEach(async () => {
    utils.cleanMocks();
    utils.mockOvhTime();
  });

  it('should return accounts not registered in OVH and registered in github ', async () => {
    const newMember = testUsers.find((user) => user.id === 'membre.nouveau');
    const allAccountsExceptANewMember = testUsers.filter((user) => user.id !== newMember.id);

    nock(/.*ovh.com/)
    .get(/^.*email\/domain\/.*\/account/)
    .reply(200, allAccountsExceptANewMember.map((user) => user.id));

    const getUnregisteredOVHUsers = emailCreationScheduler.__get__('getUnregisteredOVHUsers');
    const result = await getUnregisteredOVHUsers(testUsers);

    result.length.should.be.equal(1);
    result[0].id.should.be.equal(newMember.id);
    result[0].fullname.should.be.equal(newMember.fullname);
  });

  it('should not use expired accounts', async () => {
    utils.mockUsers();
    const expiredMember = testUsers.find((user) => user.id === 'membre.expire');
    const getValidUsers = emailCreationScheduler.__get__('getValidUsers');
    const result = await getValidUsers(testUsers);

    chai.should().not.exist(result.find((x) => x.id === expiredMember.id));
  });

  it('should return no accounts if there is no new ones in github', async () => {
    nock(/.*ovh.com/)
    .get(/^.*email\/domain\/.*\/account/)
    .reply(200, testUsers.map((user) => user.id));

    const getUnregisteredOVHUsers = emailCreationScheduler.__get__('getUnregisteredOVHUsers');
    const result = await getUnregisteredOVHUsers(testUsers);

    result.length.should.be.equal(0);
  });

  it('should return all github accounts if there is nothing inside OVH ', async () => {
    nock(/.*ovh.com/)
    .get(/^.*email\/domain\/.*\/account/)
    .reply(200, []);

    const getUnregisteredOVHUsers = emailCreationScheduler.__get__('getUnregisteredOVHUsers');
    const result = await getUnregisteredOVHUsers(testUsers);

    _.difference(result, testUsers).length.should.equal(0);
  });
});
