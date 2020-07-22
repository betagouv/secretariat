const chai = require('chai');
const chaiHttp = require('chai-http');
const utils = require('./utils.js');
const nock = require('nock')

chai.use(chaiHttp);
chai.should();

beforeEach(() => {
  nock.disableNetConnect()
  nock.enableNetConnect('127.0.0.1')
  utils.mockUsers()
  utils.mockSlack()
  utils.mockOvhTime()
  utils.mockOvhUserEmailInfos()
  utils.mockOvhAllEmailInfos()
  utils.mockOvhRedirectionWithQueries()
  utils.mockOvhRedirections()
})

afterEach(() => {
  utils.cleanMocks()
  nock.enableNetConnect()
})
