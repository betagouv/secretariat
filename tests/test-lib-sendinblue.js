const rewire = require('rewire');
const _ = require('lodash');
const nock = require('nock');
const testUsers = require('./users.json');
const config = require('../config');

const sib = rewire('../lib/sendInBlue');

describe('Test send in blue lib', () => {
  it('Test user info to send in blue format', () => {
    const user = testUsers.find((u) => u.id === 'membre.nouveau');
    const formatUserInfo = sib.__get__('formatUserInfo');
    const formatedData = formatUserInfo(user);
    _.isEqual({
      NOM_COMPLET: user.fullname,
      ROLE: user.missions[0].role,
      MISSION_START: user.missions[0].start,
      MISSION_END: user.missions[0].end,
      MISSION_STATUS: user.missions[0].status,
      MISSION_EMPLOYER: user.missions[0].employer,
    }, formatedData).should.be.true;
  });
  it('Test send it blue wrapper class call to send in blue api', () => {
    const sendInBlueCall = nock(/.*sendinblue.com/)
    .get(/^.*api\/v3/)
    .reply(200);
    const user = testUsers.find((u) => u.id === 'membre.nouveau');
    const formatUserInfo = sib.addContactToList(
      `${user.id}@${config.domain}`,
      user,
      [1],  // listIds
    );
    sendInBlueCall.isDone();
  });
});
