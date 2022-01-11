import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import config from '../src/config';
import * as controllerUtils from '../src/controllers/utils';
import knex from '../src/db';
import app from '../src/index';

chai.use(chaiHttp);

describe('Login', () => {
  let sendEmailStub;
  beforeEach((done) => {
    sendEmailStub = sinon.stub(controllerUtils, 'sendMail').returns(Promise.resolve(true));
    done();
  });

  afterEach(async () => {
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

  describe('POST /login with next query param and anchor', () => {
    it('should keep the next query param', (done) => {
      chai.request(app)
        .post('/login?next=/users')
        .type('form')
        .send({
          emailInput: 'test@',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/login?next=/users');
          done();
        });
    });

    it('should keep the anchor query param', (done) => {
      chai.request(app)
        .post('/login?next=/users&anchor=password')
        .type('form')
        .send({
          emailInput: '',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/login?next=/users&anchor=password');
          done();
        });
    });
  });

  describe('POST /login without email', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          emailInput: '',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/login');
          done();
        });
    });
  });

  describe('POST /login with incorrect input', () => {
    it('should redirect to /login', async () => {
      await knex('users').where({
        username: 'membre.actif',
      }).update({
        secondary_email: 'membre.actif.perso@example.com',
      })
      
      const res = await chai.request(app)
          .post('/login')
          .type('form')
          .send({
            emailInput: 'membre.actif',
          })
          .redirects(0)
      res.should.have.status(302);
      res.header.location.should.equal('/login');
      await knex('users').where({ username: 'membre.actif'}).update({
        secondary_email: null,
      })
    });
  });

  describe('POST /login with email with accent in username beta', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          emailInput: 'prénom.nom@beta.gouv.fr',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/login');
          done();
        });
    });
  });

  describe('POST /login with user expired', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          emailInput: 'membre.expire@beta.gouv.fr',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/login');
          done();
        });
    });
  });


  describe('POST /login with non existent secondary email', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          emailInput: 'membre.actif@example.com',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/login');
          done();
        });
    });
  });

  describe('POST /login with uppercase input email', () => {
    it('should email to secondary email', async () => {
      await knex('users').where({
        username: 'membre.actif',
      }).update({
        secondary_email: 'membre.actif.perso@example.com',
      })
      await chai.request(app)
        .post('/login')
        .type('form')
        .send({
          emailInput: 'membre.ACTIF.perso@example.com',
        })
      const destinationEmail = sendEmailStub.args[0][0];
      destinationEmail.should.equal('membre.actif.perso@example.com');
      sendEmailStub.calledOnce.should.be.true;
      await knex('users').where({
        username: 'membre.actif',
      }).update({
        secondary_email: null,
      })
    });
  });

  describe('POST /login with uppercase in email store in db', () => {
    it('should email to secondary email', async () => {
      await knex('users').where({
        username: 'membre.actif',
      }).update({
        secondary_email: 'membre.ACTIF.perso@example.com',
        primary_email: `membre.ACTIF@${config.domain}`
      })
      await chai.request(app)
          .post('/login')
          .type('form')
          .send({
            emailInput: 'membre.actif.perso@example.com',
          })
      const destinationEmail = sendEmailStub.args[0][0];
      destinationEmail.should.equal('membre.actif.perso@example.com');
      sendEmailStub.calledOnce.should.be.true;
      await knex('users').where({
        username: 'membre.actif',
      }).update({
        secondary_email: null,
        primary_email: `membre.actif@${config.domain}`
      })
    });
  });

  describe('POST /login with SecondaryEmail', () => {
    it('should email to secondary address', async() => {
      await knex('users').where({
        username: 'membre.actif'
      }).update({
        secondary_email: 'membre.actif.perso@example.com',
      })

      await chai.request(app)
          .post('/login')
          .type('form')
          .send({
            emailInput: 'membre.actif.perso@example.com',
          })
      sendEmailStub.calledOnce.should.be.true;
      const destinationEmail = sendEmailStub.args[0][0];
      destinationEmail.should.equal('membre.actif.perso@example.com');
      await knex('users').where({
        username: 'membre.actif'
      }).update({
        secondary_email: null,
      })
     
      });
    });

    it('should email to primary address', async () => {
      await knex('users').where({
        username: 'membre.actif'
      }).update({
        secondary_email: 'membre.actif.perso@example.com',
      })

      await chai.request(app)
          .post('/login')
          .type('form')
          .send({
            emailInput: `membre.actif@${config.domain}`,
          })
    
      sendEmailStub.calledOnce.should.be.true;
      const destinationEmail = sendEmailStub.args[0][0];
      destinationEmail.should.equal(`membre.actif@${config.domain}`);
      await knex('users').where({
        username: 'membre.actif'
      }).update({
        secondary_email: null,
      })
    });

    it('should email with anchor query params has a hash element in url', async () => {
      await knex('users').where({
        username: 'membre.actif'
      }).update({
        secondary_email: 'membre.actif.perso@example.com',
      })

      await chai.request(app)
          .post('/login?next=/account&anchor=password')
          .type('form')
          .send({
            emailInput: `membre.actif@${config.domain}`,
          })
    
      sendEmailStub.calledOnce.should.be.true;
      sendEmailStub.args[0][2].should.include('/account')
      sendEmailStub.args[0][2].should.include('#password')
      const destinationEmail = sendEmailStub.args[0][0];
      destinationEmail.should.equal(`membre.actif@${config.domain}`);
      await knex('users').where({
        username: 'membre.actif'
      }).update({
        secondary_email: null,
      })
    });

    it('should show error if user is not in the database', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          emailInput: `membre.unknown@${config.domain}`
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/login');
          sendEmailStub.notCalled.should.be.true;
          done();
        });
    });

    it('should show error if user does not have a secondary email', async() => {
      const res = await chai.request(app)
          .post('/login')
          .type('form')
          .send({
            emailInput: 'membre.actif@secondaryadress.com',
          })
          .redirects(0)
        res.should.have.status(302);
        res.header.location.should.equal('/login');
        sendEmailStub.notCalled.should.be.true;
  });
});
