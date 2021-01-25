const chai = require('chai');
const testUsers = require('./users.json');
const app = require('../schedulers/emailCreationScheduler');

describe('emailCreationScheduler', () => {
  it('getUnregisteredOVHUsers', (done) => {
    const result = app.getUnregisteredOVHUsers(testUsers);
    console.log(result);

    result.should.be.equal(testUsers);
  });
});
