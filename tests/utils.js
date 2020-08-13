const jwt = require('jsonwebtoken');
const nock = require('nock')
const testUsers = require('./users.json')
const { Client } = require('pg')
const knex = require('../db/index')
const parse = require('pg-connection-string').parse

module.exports = {
  getJWT() {
    return jwt.sign({ id: 'utilisateur.actif' }, process.env.SESSION_SECRET, { expiresIn: '1 hours' });
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
  },
  setupTestDatabase() {
    const config = parse(process.env.DATABASE_URL)
    const testDbName = config.database
    if (!testDbName)
      return new Error('DATABASE_URL environment variable not set');

    // Postgres needs to have a connection to an existing database in order
    // to perform any request. Since our test database doesn't exist yet,
    // we need to connect to the default database to create it.
    console.log(`Creating test database ${testDbName}...`);
    const temporaryConnection = `postgres://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${encodeURIComponent(config.host)}:${encodeURIComponent(config.port)}/postgres`
    const client = new Client({ connectionString: temporaryConnection });
    return client.connect()
      .then(() => client.query(`DROP DATABASE IF EXISTS ${testDbName}`, []))
      .then(() => client.query(`CREATE DATABASE ${testDbName}`, []))
      .then(() => client.end())
      .then(() => knex.migrate.latest())
      .then(() => console.log(`Test database ${testDbName} created successfully`))
      .catch((err) => {
        console.log(err);
      });
  },
  cleanUpTestDatabase() {
    const config = parse(process.env.DATABASE_URL)
    const testDbName = config.database
    if (!testDbName)
      return new Error('DATABASE_URL environment variable not set');

    // Postgres can't remove a database in use, so we will have to
    // connect to the default database to clean up.
    console.log(`Cleaning up test database ${testDbName}...`);
    const temporaryConnection = `postgres://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${encodeURIComponent(config.host)}:${encodeURIComponent(config.port)}/postgres`
    const client = new Client({ connectionString: temporaryConnection });

    return knex.destroy()
      .then(() => client.connect())
      .then(() => client.query(`DROP DATABASE ${testDbName}`, []))
      .then(() => client.end())
      .then(() => console.log(`Test database ${testDbName} cleaned up successfully`));
  }
}