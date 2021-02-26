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
        .send('visitorList=Membre Nouveau')
        .send('visitorList=Julien Dauphant')
        .send('referentUsername=membre.actif')
        .send('referent=Membre Actif')
        .send(`number=${encodeURIComponent('+33615415484')}`)
        .send(`date=${date.toISOString()}`)
        .redirects(0)
        .then(() => knex('visits').select().where({ date }))
        .then((dbRes) => {
          dbRes.length.should.equal(2);
          // compare all keys but createdAt, and id that we set to true
          _.isEqual({
            ...dbRes[0],
            created_at: true,
            id: true,
          }, {
            fullname: 'Membre Nouveau',
            referent: 'membre.actif',
            number: '+33615415484',
            requester: 'membre.actif',
            date,
            created_at: true,
            id: true,
          }).should.be.true;
          _.isEqual({
            ...dbRes[1],
            created_at: true,
            id: true,
          }, {
            ...dbRes[1],
            fullname: 'Julien Dauphant',
            referent: 'membre.actif',
            number: '+33615415484',
            requester: 'membre.actif',
            date,
            created_at: true,
            id: true,
          }).should.be.true;
        })
        .then(done)
        .catch(done);
    });

    it('should add visit info in db when one element in visitorList', (done) => {
      const date = new Date(new Date().setDate(new Date().getDate() + 1));
      date.setHours(0, 0, 0, 0);
      // use `send` function multiple times instead of json to be able to send visitorList array
      chai.request(app)
        .post('/visit')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send('visitorList=Membre Nouveau')
        .send('referentUsername=julien.dauphant')
        .send('referent=Julien Dauphant')
        .send(`number=${encodeURIComponent('+33615415484')}`)
        .send(`date=${date.toISOString()}`)
        .redirects(0)
        .then(() => knex('visits').select().where({ date }))
        .then((dbRes) => {
          dbRes.length.should.equal(1);
          // compare all keys but createdAt and id that we set to true
          _.isEqual({
            ...dbRes[0],
            created_at: true,
            id: true,
          }, {
            fullname: 'Membre Nouveau',
            referent: 'julien.dauphant',
            number: '+33615415484',
            requester: 'membre.actif',
            date,
            created_at: true,
            id: true,
          }).should.be.true;
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
          .send('visitorList=Membre Nouveau')
          .send('visitorList=Julien Dauphant')
          .send('referent=Membre Actif')
          .send('referentUsername=membre.actif')
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
          .send('visitorList=Membre Nouveau')
          .send('visitorList=Julien Dauphant')
          .send('referentUsername=membre.actif')
          .send('referent=Membre Actif')
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
          .send('visitorList=Membre Nouveau')
          .send('visitorList=Julien Dauphant')
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
          .send('referentUsername=membre.actif')
          .send('referent=Membre Actif')
          .send(`number=${encodeURIComponent('+33615415484')}`)
          .send(`date=${date.toISOString()}`)
          .end((err, res) => {
            res.text.should.include('visiteurs : le champ n&#39;est pas renseigné');
            done();
          });
    });
  });

  describe('authenticated visit endpoint get futur visits lists', () => {
    it('should show any visits if no visits in the future', async() => {
      const date = new Date(new Date().setDate(new Date().getDate() - 1 ));
      date.setHours(0, 0, 0, 0);
      const inviteRequest1 = {
        fullname: 'John Doe',
        referent: 'membre.actif',
        number: '+33615415484',
        date,
        requester: 'membre.actif',
      };
      await knex('visits').insert([inviteRequest1]);
      // use `send` function multiple times instead of json to be able to send visitorList array
      const res = await chai.request(app)
        .get('/visit')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
      res.text.should.not.include('<td>John Doe</td>');
    });
    
    it('should show visits if visits in the future', async () => {
      const date = new Date(new Date().setDate(new Date().getDate() + 1));
      date.setHours(0, 0, 0, 0);
      const inviteRequest1 = {
        fullname: 'John Doe',
        referent: 'membre.actif',
        number: '+33615415484',
        date,
        requester: 'membre.actif',
      };
      const inviteRequest2 = {
        fullname: 'Jean Dupont',
        referent: 'membre.actif',
        number: '+33615415484',
        date,
        requester: 'membre.actif',
      };
      await knex('visits').insert([inviteRequest1, inviteRequest2]);
      date.setHours(0, 0, 0, 0);
      // use `send` function multiple times instead of json to be able to send visitorList array
      const res = await chai.request(app)
        .get('/visit')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
      res.text.should.include('<td>John Doe</td>');
      res.text.should.include('<td>Membre Actif</td>');
      res.text.should.include('<td>Jean Dupont</td>');
      res.text.should.include(`<td>${controllerUtils.formatDateToReadableFormat(date)}</td>`);
    });
  });

  describe('Visit cronjob tests', () => {
    it('should send email if visit', async () => {
      const date = new Date(new Date().setDate(new Date().getDate() + 1));
      date.setHours(0, 0, 0, 0);
      const inviteRequest1 = {
        fullname: 'Membre Nouveau',
        referent: 'membre.actif',
        number: '+33615415484',
        date,
        requester: 'membre.actif',
      };
      const inviteRequest2 = {
        fullname: 'Julien Dauphant',
        referent: 'membre.actif',
        number: '+33615415484',
        date,
        requester: 'membre.actif',
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
