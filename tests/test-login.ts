import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';

import Betagouv from '@/betagouv';
import * as Email from '@config/email.config'
import config from '@config';
import knex from '@/db';
import app from '@/index';
import { Domaine } from '@/models/member';
import { SendEmailProps } from '@/modules/email';

chai.use(chaiHttp);

describe('Login', () => {
  let sendEmailStub;
  beforeEach((done) => {
    sendEmailStub = sinon.stub(Email, 'sendEmail').returns(Promise.resolve(null));
    done();
  });

  afterEach(async () => {
    sendEmailStub.restore();
  });

  describe('POST /login with next query param and anchor', () => {
    it('should keep the next query param', async () => {
      const res = await chai.request(app)
        .post('/login?next=/users')
        .type('form')
        .send({
          emailInput: 'test@',
        })
        .redirects(0)
      console.log(res)
      res.should.have.status(302);
      res.header.location.should.equal('/login?next=/users');
    });

    it('should keep the anchor query param', async () => {
      const res = await chai.request(app)
        .post('/login?next=/users&anchor=password')
        .type('form')
        .send({
          emailInput: '',
        })
        .redirects(0)

      res.should.have.status(302);
      res.header.location.should.equal('/login?next=/users&anchor=password');
    });
  });

  describe('POST /login without email', () => {
    it('should redirect to login', async () => {
      const res = await chai.request(app)
        .post('/login')
        .type('form')
        .send({
          emailInput: '',
        })
        .redirects(0)
      res.should.have.status(302);
      res.header.location.should.equal('/login');
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
    it('should redirect to login', async () => {
      const res = await chai.request(app)
        .post('/login')
        .type('form')
        .send({
          emailInput: 'prénom.nom@beta.gouv.fr',
        })
        .redirects(0)

      res.should.have.status(302);
      res.header.location.should.equal('/login');
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

  describe('POST /login with user expired for less than 5 days', () => {
    it('should email to secondary email', async () => {
      const today = new Date();
      const todayLess4days = new Date()
      todayLess4days.setDate(today.getDate() - 4)
      const userInfosByIdStub = sinon.stub(Betagouv, 'userInfosById').returns(
        Promise.resolve({
          id: 'membre.expiredfourdays',
          fullname: '',
          github: '',
          employer: '',
          domaine: Domaine.ANIMATION,
          missions: [],
          start: '',
          startups: [],
          end: todayLess4days.toUTCString()
        }
      ))
      await knex('users').insert({
        username: 'membre.expiredfourdays',
        primary_email: 'membre.expiredfourdays@beta.gouv.fr',
        secondary_email: 'membre.expiredfourdays@gmail.com'
      })
      await chai.request(app)
        .post('/login')
        .type('form')
        .send({
          emailInput: 'membre.expiredfourdays@beta.gouv.fr',
        })
      const destinationEmail : SendEmailProps = sendEmailStub.args[0][0];
      destinationEmail.toEmail[0].should.equal('membre.expiredfourdays@beta.gouv.fr');
      sendEmailStub.calledOnce.should.be.true;
      await knex('users').where({
        username: 'membre.expiredfourdays',
      }).delete()
      userInfosByIdStub.restore()
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
      const destinationEmail : SendEmailProps = sendEmailStub.args[0][0];
      destinationEmail.toEmail[0].should.equal('membre.actif.perso@example.com');
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
      const destinationEmail : SendEmailProps = sendEmailStub.args[0][0];
      destinationEmail.toEmail[0].should.equal('membre.actif.perso@example.com');
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
      const destinationEmail : SendEmailProps = sendEmailStub.args[0][0];
      destinationEmail.toEmail[0].should.equal('membre.actif.perso@example.com');
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
      const destinationEmail : SendEmailProps = sendEmailStub.args[0][0];
      destinationEmail.toEmail[0].should.equal(`membre.actif@${config.domain}`);
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
      const emailArg : SendEmailProps = sendEmailStub.args[0][0]
      emailArg.variables.loginUrlWithToken.should.include('account')
      emailArg.variables.loginUrlWithToken.should.include('anchor=password')
      emailArg.toEmail[0].should.equal(`membre.actif@${config.domain}`);
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

describe('Login With API', () => {
  let sendEmailStub;
  beforeEach((done) => {
    sendEmailStub = sinon.stub(Email, 'sendEmail').returns(Promise.resolve(null));
    done();
  });

  afterEach(async () => {
    sendEmailStub.restore();
  });

  describe('POST /api/login with correct email', () => {
    it('should email to primary address', async() => {
      await knex('users').where({
        username: 'membre.actif'
      }).update({
        secondary_email: 'membre.actif.perso@example.com',
      })

      await chai.request(app)
          .post('/api/login')
          .type('form')
          .send({
            emailInput: `membre.actif@${config.domain}`,
          })
    
      sendEmailStub.calledOnce.should.be.true;
      const destinationEmail : SendEmailProps = sendEmailStub.args[0][0];
      destinationEmail.toEmail[0].should.equal(`membre.actif@${config.domain}`);
      await knex('users').where({
        username: 'membre.actif'
      }).update({
        secondary_email: null,
      })
    });
  })
  describe('POST /api/login with incorrect email', () => {
    it('should not email', async() => {
      await chai.request(app)
          .post('/api/login')
          .type('form')
          .send({
            emailInput: `membre.actif@totototo.com`,
          })
    
      sendEmailStub.calledOnce.should.be.false;
    });
  })

  describe('POST /api/login with empty email', () => {
    it('should not email', async() => {
      await chai.request(app)
          .post('/api/login')
          .type('form')
          .send({
            emailInput: ``,
          })
    
      sendEmailStub.calledOnce.should.be.false;
    });
  })
})
