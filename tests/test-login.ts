import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import config from '../src/config';
import controllerUtils from '../src/controllers/utils';
import knex from '../src/db';
import app from '../src/index';

chai.use(chaiHttp);

describe('Login', () => {
  let sendEmailStub;
  beforeEach((done) => {
    sendEmailStub = sinon.stub(controllerUtils, 'sendMail').returns(true);
    done();
  });

  afterEach(async () => {
    await knex('users').truncate();
    sendEmailStub.restore();
  });

  // describe("POST /login with user actif", () => {
  //   it("should render login with message", (done) => {
  //     utils.mockUsers();

  //     chai.request(app)
  //       .post('/login')
  //       .type('form')
  //       .send({
  //         id: 'membre.actif'
  //       })
  //       .end((err, res) => {
  //         res.should.have.status(200);
  //         res.text.should.include('Email de connexion envoyé pour membre.actif');
  //         done();
  //       });
  //   });
  // });

  describe('POST /login with next query param', () => {
    it('should keep the next query param', (done) => {
      chai.request(app)
        .post('/login?next=/users')
        .type('form')
        .send({
          username: undefined,
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/login?next=/users');
          done();
        });
    });
  });

  describe('POST /login with user undefined', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          username: undefined,
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/login');
          done();
        });
    });
  });

  describe('POST /login with user with accent', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          username: 'prénom.nom',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/login');
          done();
        });
    });
  });

  describe('POST /login with user expiré', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          username: 'membre.expire',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/login');
          done();
        });
    });
  });

  describe('POST /login without secondaryEmail parameter', () => {
    it('should email to primary address', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          username: 'membre.actif',
        })
        .then(() => {
          sendEmailStub.calledOnce.should.be.true;
          const destinationEmail = sendEmailStub.args[0][0];
          destinationEmail.should.equal(`membre.actif@${config.domain}`);
          done();
        })
        .catch(done);
    });
  });

  describe('POST /login with useSecondaryEmail parameter', () => {
    it('should email to primary address', (done) => {
      knex('users').insert({
        username: 'membre.actif',
        secondary_email: 'membre.actif.perso@example.com',
      })
      .then(() => {
        chai.request(app)
          .post('/login')
          .type('form')
          .send({
            username: 'membre.actif',
            useSecondaryEmail: 'true',
          })
          .then(() => {
            sendEmailStub.calledOnce.should.be.true;
            const destinationEmail = sendEmailStub.args[0][0];
            destinationEmail.should.equal('membre.actif.perso@example.com');
            done();
          })
          .catch(done);
      });
    });

    it('should show error if user is not in the database', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          username: 'membre.actif',
          useSecondaryEmail: 'true',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/login');
          sendEmailStub.notCalled.should.be.true;
          done();
        });
    });

    it('should show error if user does not have a secondary email', (done) => {
      knex('users').insert({
        username: 'membre.actif',
      })
      .then(() => {
        chai.request(app)
          .post('/login')
          .type('form')
          .send({
            username: 'membre.actif',
            useSecondaryEmail: 'true',
          })
          .redirects(0)
          .end((err, res) => {
            res.should.have.status(302);
            res.header.location.should.equal('/login');
            sendEmailStub.notCalled.should.be.true;
            done();
          });
      });
    });
  });
});
