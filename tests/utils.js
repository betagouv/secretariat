const jwt = require('jsonwebtoken');
const nock = require('nock');
const { Client } = require('pg');
const { parse } = require('pg-connection-string');
const { v4: uuidv4 } = require('uuid');

const config = require('../config');
const testUsers = require('./users.json');
const testStartups = require('./startups.json');
const knex = require('../db/index');

module.exports = {
  getJWT(id) {
    return jwt.sign({ id }, config.secret, { expiresIn: '1 hours' });
  },
  mockUsers() {
    const url = process.env.USERS_API || 'https://beta.gouv.fr'; // can't replace with config.usersApi ?
    return nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, testUsers)
      .persist();
  },
  mockStartups() {
    const url = process.env.STARTUPS_API || 'https://beta.gouv.fr'; // can't replace with config.startupsApi ?
    return nock(url)
      .get((uri) => uri.includes('startups.json'))
      .reply(200, testStartups)
      .persist();
  },
  mockSlackSecretariat() {
    if (config.slackWebhookURLSecretariat) {
      return nock(config.slackWebhookURLSecretariat)
        .post(/.*/)
        .reply(200)
        .persist();
    }
    throw new Error('config.slackWebhookURLSecretariat not defined');
  },
  mockSlackGeneral() {
    if (config.slackWebhookURLGeneral) {
      return nock(config.slackWebhookURLGeneral)
        .post(/.*/)
        .reply(200)
        .persist();
    }
    throw new Error('config.slackWebhookURLGeneral not defined');
  },
  mockOvhUserEmailInfos() {
    return nock(/.*ovh.com/)
      .get(/^.*email\/domain\/.*\/account\/+.+/) // <-> /email/domain/betagouv.ovh/account/membre.actif
      .reply(404)
      .persist();
  },
  mockOvhAllEmailInfos() {
    return nock(/.*ovh.com/)
      .get(/^.*email\/domain\/.*\/account/)
      .reply(200, testUsers.map((x) => x.id))
      .persist();
  },
  mockOvhRedirectionWithQueries() {
    return nock(/.*ovh.com/)
      .get(/^.*email\/domain\/.*\/redirection/)
      .query((x) => x.from && x.to)
      .reply(200, ['398284990'])
      .persist();
  },
  mockOvhRedirections() {
    return nock(/.*ovh.com/)
      .get(/^.*email\/domain\/.*\/redirection/)
      .reply(200, [])
      .persist();
  },
  mockOvhTime() {
    return nock(/.*ovh.com/)
      .get(/^.*auth\/time/)
      .reply(200, (new Date()).getTime() / 1000)
      .persist();
  },
  cleanMocks() {
    nock.cleanAll();
    nock.enableNetConnect();
  },
  setupTestDatabase() {
    const dbConfig = parse(process.env.DATABASE_URL);
    const testDbName = dbConfig.database;
    if (!testDbName) return new Error('DATABASE_URL environment variable not set');

    // Postgres needs to have a connection to an existing database in order
    // to perform any request. Since our test database doesn't exist yet,
    // we need to connect to the default database to create it.
    console.log(`Creating test database ${testDbName}...`);
    const temporaryConnection = `postgres://${encodeURIComponent(dbConfig.user)}:${encodeURIComponent(dbConfig.password)}@${encodeURIComponent(dbConfig.host)}:${encodeURIComponent(dbConfig.port)}/postgres`;
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
    const dbConfig = parse(process.env.DATABASE_URL);
    const testDbName = dbConfig.database;
    if (!testDbName) return new Error('DATABASE_URL environment variable not set');

    // Postgres can't remove a database in use, so we will have to
    // connect to the default database to clean up.
    console.log(`Cleaning up test database ${testDbName}...`);
    const temporaryConnection = `postgres://${encodeURIComponent(dbConfig.user)}:${encodeURIComponent(dbConfig.password)}@${encodeURIComponent(dbConfig.host)}:${encodeURIComponent(dbConfig.port)}/postgres`;
    const client = new Client({ connectionString: temporaryConnection });

    return knex.destroy()
      .then(() => client.connect())
      .then(() => client.query(`DROP DATABASE ${testDbName}`, []))
      .then(() => client.end())
      .then(() => console.log(`Test database ${testDbName} cleaned up successfully`));
  },
  randomUuid: function randomUuid() {
    return uuidv4();
  },
};
