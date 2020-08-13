const jwt = require('jsonwebtoken');
const nock = require('nock')
const testUsers = require('./users.json')

module.exports = {
  getJWT(id='utilisateur.actif') {
    return jwt.sign({ id: id }, process.env.SESSION_SECRET, { expiresIn: '1 hours' });
  },
  mockUsers() {
    const url = process.env.USERS_API || 'https://beta.gouv.fr'
    return nock(url)
      .get('/api/v1.6/authors.json')
      .reply(200, testUsers)
      .persist()
  },
  mockSlack() {
    const url = process.env.SLACK_WEBHOOK_URL
    if (url) {
      return nock(url)
        .post(/.*/)
        .reply(200)
        .persist()
    }
  },
  mockOvhUserEmailInfos() {
    return nock(/.*ovh.com/)
      .get(/^.*email\/domain\/.*\/account\/.*/)
      .reply(404)
      .persist()
  },
  mockOvhAllEmailInfos() {
    return nock(/.*ovh.com/)
      .get(/^.*email\/domain\/.*\/account/)
      .reply(200, testUsers.map(x => x.id))
      .persist()
  },
  mockOvhRedirectionWithQueries() {
    return nock(/.*ovh.com/)
      .get(/^.*email\/domain\/.*\/redirection/)
      .query(x => x.from && x.to)
      .reply(200, ['398284990'])
      .persist()
  },
  mockOvhRedirections() {
    return nock(/.*ovh.com/)
      .get(/^.*email\/domain\/.*\/redirection/)
      .reply(200, [])
      .persist()
  },
  mockOvhTime() {
    return nock(/.*ovh.com/)
      .get(/^.*auth\/time/)
      .reply(200, (new Date()).getTime() / 1000)
      .persist()
  },
  cleanMocks() {
    nock.cleanAll()
    nock.enableNetConnect()
  }
}