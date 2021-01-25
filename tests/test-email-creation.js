const chai = require('chai');
const rewire = require('rewire');
const nock = require('nock');
const testUsers = require('./users.json');
const utils = require('./utils.js');

const emailCreationScheduler = rewire('../schedulers/emailCreationScheduler');

describe('emailCreationScheduler', () => {
  it('getUnregisteredOVHUsers', async (done) => {
    utils.cleanMocks();

    const newMember = "membre.nouveau"
    nock(/.*ovh.com/)
    .get(/^.*email\/domain\/.*\/account/)
    .reply(200, [newMember]);

    const getUnregisteredOVHUsers = emailCreationScheduler.__get__('getUnregisteredOVHUsers');
    const result = await getUnregisteredOVHUsers(testUsers);
    /**
     * [
        {
          id: 'membre.actif',
          fullname: 'Membre Actif',
          missions: [ [Object] ],
        }
      ]
     */
    console.log('mytest', result);

    result.should.be.equal([newMember]);

    done();
  });
});
