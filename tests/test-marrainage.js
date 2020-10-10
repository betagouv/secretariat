const chai = require('chai');
const app = require('../index');
const utils = require('./utils.js');
const sinon = require('sinon');
const controllerUtils = require('../controllers/utils');
const jwt = require('jsonwebtoken');
const config = require('../config');
const testUsers = require('./users.json');
const knex = require('../db');

describe("Marrainage", () => {

  beforeEach((done) => {
    this.sendEmailStub = sinon.stub(controllerUtils, 'sendMail').returns(true);
    done();
  });

  afterEach((done) => {
    knex('marrainage').truncate()
    .then(() => this.sendEmailStub.restore())
    .then(() => done())
  });

  describe("unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .post("/marrainage")
        .type("form")
        .send({
          'newcomerId': 'utilisateur.actif'
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal("/login");
          done();
        });
    });

    it("should email newcomer and onboarder if accepted", (done) => {

      const newcomerId = 'utilisateur.nouveau';
      const onboarderId = 'utilisateur.actif';

      knex('marrainage').insert({
        username: newcomerId,
        last_onboarder: onboarderId
      }).then(() => {
        const token = jwt.sign({
          newcomer: testUsers.find(x => x.id === newcomerId),
          onboarder: testUsers.find(x => x.id === onboarderId)
        }, config.secret);

        chai.request(app)
          .get(`/marrainage/accept?details=${encodeURIComponent(token)}`)
          .redirects(0)
          .end((err, res) => {
            res.should.have.status(200);
            res.text.should.include('Votre décision a été prise en compte')
            this.sendEmailStub.calledOnce.should.be.true;

            const toEmail = this.sendEmailStub.args[0][0];
            const subject = this.sendEmailStub.args[0][1];
            const emailBody = this.sendEmailStub.args[0][2];

            subject.should.equal("Mise en contact pour marrainage");
            emailBody.should.include("Utilisateur Actif a accepté d'être marrain·e de Utilisateur Nouveau");
            done();
          });
      })

    });


    it("should email newcomer if declined", (done) => {

      const newcomerId = 'utilisateur.nouveau';
      const onboarderId = 'utilisateur.actif';

      knex('marrainage').insert({
        username: newcomerId,
        last_onboarder: onboarderId
      }).then(() => {
        const token = jwt.sign({
          newcomer: testUsers.find(x => x.id === newcomerId),
          onboarder: testUsers.find(x => x.id === onboarderId)
        }, config.secret);
  
        chai.request(app)
          .get(`/marrainage/decline?details=${encodeURIComponent(token)}`)
          .redirects(0)
          .end((err, res) => {
            res.should.have.status(200);
            res.text.should.include('Votre décision a été prise en compte')
            this.sendEmailStub.calledTwice.should.be.true;
  
            const newcomerEmailArgs = this.sendEmailStub.args[1]
  
            const toEmail = newcomerEmailArgs[0][0];
            const subject = newcomerEmailArgs[1];
            const emailBody = newcomerEmailArgs[2];
  
            toEmail.should.include("utilisateur.nouveau@")
            subject.should.equal("La recherche de marrain·e se poursuit !");
            emailBody.should.include("Malheureusement, Utilisateur Actif n'est pas disponible en ce moment.");
            done();
          });
      })
    });


    it("should select a new onboarder if declined", (done) => {

      const newcomerId = 'utilisateur.nouveau';
      const onboarderId = 'utilisateur.actif';

      knex('marrainage').insert({
        username: newcomerId,
        last_onboarder: onboarderId
      }).then(() => {
        const token = jwt.sign({
          newcomer: testUsers.find(x => x.id === newcomerId),
          onboarder: testUsers.find(x => x.id === onboarderId)
        }, config.secret);
  
        chai.request(app)
          .get(`/marrainage/decline?details=${encodeURIComponent(token)}`)
          .redirects(0)
          .end((err, res) => {
            res.should.have.status(200);
            res.text.should.include('Votre décision a été prise en compte')
            this.sendEmailStub.calledTwice.should.be.true;
  
            const newOnboarderEmailArgs = this.sendEmailStub.args[0]
  
            const subject = newOnboarderEmailArgs[1];
            const emailBody = newOnboarderEmailArgs[2];
  
            subject.should.equal("Tu as été sélectionné·e comme marrain·e 🙌");
            emailBody.should.include('marrainage/accept');
            emailBody.should.include('marrainage/decline');
            done();
          });
      })
    });
  });

  describe("authenticated", () => {

    it("should generate an email when sollicited", (done) => {
      chai.request(app)
        .post("/marrainage")
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type("form")
        .send({
          'newcomerId': 'utilisateur.actif'
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal("/community/utilisateur.actif");
          this.sendEmailStub.calledOnce.should.be.true;

          const subject = this.sendEmailStub.args[0][1];
          const emailBody = this.sendEmailStub.args[0][2];

          subject.should.equal("Tu as été sélectionné·e comme marrain·e 🙌");
          emailBody.should.include('marrainage/accept');
          emailBody.should.include('marrainage/decline');
          done();
        });
    });

    it("should add info in db when sollicited", (done) => {
      chai.request(app)
        .post("/marrainage")
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type("form")
        .send({
          'newcomerId': 'utilisateur.actif'
        })
        .redirects(0)
        .then(() => knex('marrainage').select().where({ username: 'utilisateur.actif' }))
        .then(dbRes => {
          dbRes.length.should.equal(1);
          dbRes[0].username.should.equal('utilisateur.actif');
        })
        .then(done)
        .catch(done)
        ;
    });

    it("should not allow expired users to create a request", (done) => {
      chai.request(app)
        .post("/marrainage")
        .set('Cookie', `token=${utils.getJWT('utilisateur.expire')}`)
        .type("form")
        .send({
          'newcomerId': 'utilisateur.actif'
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal("/community/utilisateur.actif");
          this.sendEmailStub.notCalled.should.be.true;
          done();
        });
    });
  });
});

