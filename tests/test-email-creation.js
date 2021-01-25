const chai = require('chai');
const rewire = require('rewire');
const nock = require('nock');
const testUsers = require('./users.json');
const utils = require('./utils.js');

const emailCreationScheduler = rewire('../schedulers/emailCreationScheduler');

describe('emailCreationScheduler', () => {
  it('getUnregisteredOVHUsers', async () => {
    utils.cleanMocks();
    const allAccountsExceptANewMember = testUsers.filter((x) => x.id === 'membre.nouveau');
    const newMember = testUsers.find((x) => x.id === 'membre.nouveau');

    nock(/.*ovh.com/)
    .get(/^.*email\/domain\/.*\/account/)
    .reply(200, testUsers.map((x) => x.id));

    const getUnregisteredOVHUsers = emailCreationScheduler.__get__('getUnregisteredOVHUsers');
    const result = await getUnregisteredOVHUsers(allAccountsExceptANewMember);

    result.length.should.be.equal(1);
    result[0].id.should.be.equal(newMember.id);
    result[0].fullname.should.be.equal(newMember.fullname);
  });
});
