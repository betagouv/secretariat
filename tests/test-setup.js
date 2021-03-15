const chai = require('chai');
const chaiHttp = require('chai-http');
const nock = require('nock');
const utils = require('./utils.js');

chai.use(chaiHttp);
chai.should();

before(() => utils.setupTestDatabase());

beforeEach(() => {
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
  utils.mockUsers();
  utils.mockStartups();
  utils.mockSlackGeneral();
  utils.mockSlackSecretariat();
  utils.mockOvhTime();
  utils.mockOvhUserEmailInfos();
  utils.mockOvhAllEmailInfos();
  utils.mockOvhRedirectionWithQueries();
  utils.mockOvhRedirections();
});

afterEach(() => {
  utils.cleanMocks();
  nock.enableNetConnect();
});

after(() => utils.cleanUpTestDatabase());
