import chai from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';
import utils from './utils';

chai.use(chaiHttp);
chai.should();

before(() => utils.setupTestDatabase());

beforeEach(() => {
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
  utils.mockUsers();
  utils.mockStartups();
  utils.mockStartupsDetails();
  utils.mockSlackGeneral();
  utils.mockSlackSecretariat();
  utils.mockOvhTime();
  utils.mockOvhUserResponder();
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
