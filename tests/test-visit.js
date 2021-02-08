const chai = require('chai');
const sinon = require('sinon');
const _ = require('lodash');
const rewire = require('rewire');
const app = require('../index');
const utils = require('./utils.js');
const config = require('../config');
const controllerUtils = require('../controllers/utils');
const knex = require('../db');

const visitScheduler = rewire('../schedulers/visitScheduler');

describe('Visit', () => {
  beforeEach((done) => {
    this.sendEmailStub = sinon.stub(controllerUtils, 'sendMail').returns(true);
    this.clock = sinon.useFakeTimers(new Date('2020-01-01T09:59:59+01:00'));
    done();
  });

  afterEach((done) => {
    knex('visits').truncate()
      .then(() => this.sendEmailStub.restore())
      .then(() => this.clock.restore())
      .then(() => done())
      .catch(done);
  });

  describe('unauthenticated visit endpoint tests', () => {
    it('should return an Unauthorized error when trying to access visit page', (done) => {
      chai.request(app)
        .post('/visit')
        .type('form')
        .send({
          newcomerId: 'membre.actif',
        })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe('authenticated visit endpoint tests', () => {
    it('should add visit info in db when sollicited', (done) => {
      const date = new Date(new Date().setDate(new Date().getDate() + 1));
      date.setHours(0, 0, 0, 0);
      // use `send` function multiple times instead of json to be able to send visitorList array
      chai.request(app)
        .post('/visit')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send('visitorList=membre.nouveau')
        .send('visitorList=julien.dauphant')
        .send('referent=membre.actif')
        .send(`number=${encodeURIComponent('+33615415484')}`)
        .send(`date=${date.toISOString()}`)
        .redirects(0)
        .then(() => knex('visits').select().where({ date }))
        .then((dbRes) => {
          dbRes.length.should.equal(2);
          _.isEqual(dbRes[0], {
            username: 'membre.nouveau',
            referent: 'membre.actif',
            number: '+33615415484',
            date,
          });
          _.isEqual(dbRes[1], {
            username: 'julien.dauphant',
            referent: 'membre.actif',
            number: '+33615415484',
            date,
          });
        })
        .then(done)
        .catch(done);
    });

    it('should send error if date is missing in the visit params data', (done) => {
      const date = new Date(new Date().setDate(new Date().getDate() + 1));
      date.setHours(0, 0, 0, 0);
      // use `send` function multiple times instead of json to be able to send visitorList array
      chai.request(app)
          .post('/visit')
          .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
          .type('form')
          .send('visitorList=membre.nouveau')
          .send('visitorList=julien.dauphant')
          .send('referent=membre.actif')
          .send(`number=${encodeURIComponent('+33615415484')}`)
          .end((err, res) => {
            res.text.should.include('date : le champ n&#39;est pas renseigné');
            done();
          });
    });

    it('should send error if number is missing in the visit params data', (done) => {
      const date = new Date(new Date().setDate(new Date().getDate() + 1));
      date.setHours(0, 0, 0, 0);
      // use `send` function multiple times instead of json to be able to send visitorList array
      chai.request(app)
          .post('/visit')
          .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
          .type('form')
          .send('visitorList=membre.nouveau')
          .send('visitorList=julien.dauphant')
          .send('referent=membre.actif')
          .send(`date=${date.toISOString()}`)
          .end((err, res) => {
            res.text.should.include('numéro : le champ n&#39;est pas renseigné');
            done();
          });
    });

    it('should send error if referent is missing in the visit params data', (done) => {
      const date = new Date(new Date().setDate(new Date().getDate() + 1));
      date.setHours(0, 0, 0, 0);
      // use `send` function multiple times instead of json to be able to send visitorList array
      chai.request(app)
          .post('/visit')
          .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
          .type('form')
          .send('visitorList=membre.nouveau')
          .send('visitorList=julien.dauphant')
          .send(`number=${encodeURIComponent('+33615415484')}`)
          .send(`date=${date.toISOString()}`)
          .end((err, res) => {
            res.text.should.include('référent : le champ n&#39;est pas renseigné');
            done();
          });
    });

    it('should send error if some visitorList is missing in the visit params data', (done) => {
      const date = new Date(new Date().setDate(new Date().getDate() + 1));
      date.setHours(0, 0, 0, 0);
      // use `send` function multiple times instead of json to be able to send visitorList array
      chai.request(app)
          .post('/visit')
          .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
          .type('form')
          .send('referent=membre.actif')
          .send(`number=${encodeURIComponent('+33615415484')}`)
          .send(`date=${date.toISOString()}`)
          .end((err, res) => {
            res.text.should.include('visiteurs : le champ n&#39;est pas renseigné');
            done();
          });
    });
  });

  describe('Visit cronjob tests', () => {
    it('should send email if visit', async () => {
      const date = new Date(new Date().setDate(new Date().getDate() + 1));
      date.setHours(0, 0, 0, 0);
      const inviteRequest1 = {
        username: 'membre.nouveau',
        referent: 'membre.actif',
        number: '+33615415484',
        date,
      };
      const inviteRequest2 = {
        username: 'julien.dauphant',
        referent: 'membre.actif',
        number: '+33615415484',
        date,
      };
      await knex('visits').insert([inviteRequest1, inviteRequest2]);
      const sendVisitEmail = visitScheduler.__get__('sendVisitEmail');
      await sendVisitEmail();
      this.sendEmailStub.calledOnce.should.be.true;
      this.sendEmailStub.firstCall.args[1].should.be.equal('Visite à Ségur');
      this.sendEmailStub.firstCall.args[2].should.contains('Julien Dauphant');
      this.sendEmailStub.firstCall.args[2].should.contains('Membre Nouveau');
      this.sendEmailStub.firstCall.args[2].should.contains('Membre Actif');
      this.sendEmailStub.firstCall.args[3].cc.should.be.equal(`membre.actif@${config.domain}`);
    });
  });
});
