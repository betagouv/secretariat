import chai from 'chai'
import chaiHttp from 'chai-http'
import sinon from 'sinon'

import app from '@/index'
import config from '@config'
import utils from './utils'
import * as adminConfig from '@/config/admin.config'
import routes from '@/routes/routes'
import * as mattermostScheduler from '@schedulers/mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam'
import * as chat from "@/infra/chat"
import * as sendMattermostMessage from '@/controllers/adminController/sendMattermostMessage';
import * as session from '@/middlewares/session'

chai.use(chaiHttp);

describe('Admin', () => {
  describe('GET /admin unauthenticated', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .get('/admin')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.include('/login');
          res.header.location.should.equal('/login?next=/admin');
          done();
        });
    });
  });

  describe('GET /admin authenticated', () => {
    let getToken
    
    beforeEach(() => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
    })

    afterEach(() => {
      getToken.restore()
    })
    it('should return a valid page', (done) => {
      chai.request(app)
        .get('/admin')
        // .set('session', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });

  describe('GET /admin/mattermost authenticated', () => {
    let getToken
    
    beforeEach(() => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
    })

    afterEach(() => {
      getToken.restore()
    })
    it('should return a forbidden error if user not in admin', async() => {
      const res = await chai.request(app)
        .get(routes.ADMIN_MATTERMOST)
        // .set('session', `token=${utils.getJWT('membre.actif')}`)
      res.should.have.status(403);
    });
    it('should return a forbidden error if user not in admin', async() => {
      const res = await chai.request(app)
        .get(routes.ADMIN_MATTERMOST_MESSAGE_API)
        // .set('session', `token=${utils.getJWT('membre.actif')}`)
      res.should.have.status(403);
    });
    it('should return a forbidden error if user not in admin', async() => {
      const res = await chai.request(app)
        .post(routes.ADMIN_MATTERMOST_SEND_MESSAGE)
        // .set('session', `token=${utils.getJWT('membre.actif')}`)
      res.should.have.status(403);
    });
    it('should return /admin/mattermost page if user is admin', async () => {
      const getAdminStub = sinon.stub(adminConfig, 'getAdmin').returns(['membre.actif']);
      const getMattermostUsersWithStatus = sinon.stub(mattermostScheduler ,'getMattermostUsersWithStatus').returns(Promise.resolve([]))
      const res = await chai.request(app)
        .get(routes.ADMIN_MATTERMOST)
        // .set('session', `token=${utils.getJWT('membre.actif')}`)
      res.should.have.status(200);
      getAdminStub.restore()
      getMattermostUsersWithStatus.restore()
    });
    it('should return /admin/send-message page if user is admin', async () => {
      const getAdminStub = sinon.stub(adminConfig, 'getAdmin').returns(['membre.actif']);
      const getMattermostUsersWithStatus = sinon.stub(mattermostScheduler ,'getMattermostUsersWithStatus').returns(Promise.resolve([]))
      const getUserWithParams = sinon.stub(chat, 'getUserWithParams')
      const sendInfoToChat = sinon.stub(chat, 'sendInfoToChat')
      getUserWithParams.onCall(0).returns([{
        username: 'membre.actif',
        email: `membre.actif@${config.domain}`
      }]);
      getUserWithParams.onCall(1).returns([]);
      const res = await chai.request(app)
        .post(routes.ADMIN_MATTERMOST_SEND_MESSAGE)
        .send({
          fromBeta: true,
          excludeEmails: '',
          includeEmails: '',
          text: ''
        })
        // .set('session', `token=${utils.getJWT('membre.actif')}`)
      res.should.have.status(200);
      sendInfoToChat.calledOnce.should.be.true
      getUserWithParams.callCount.should.be.eq(0)
      getAdminStub.restore()
      getUserWithParams.restore()
      getMattermostUsersWithStatus.restore()
      sendInfoToChat.restore()
    });
    it('should send message to all users if prod is true and channel undefined', async () => {
      const getAdminStub = sinon.stub(adminConfig, 'getAdmin').returns(['membre.actif']);
      const getMattermostUsersWithStatus = sinon.stub(mattermostScheduler ,'getMattermostUsersWithStatus').returns(Promise.resolve([]))
      const getUserWithParams = sinon.stub(chat, 'getUserWithParams')
      const sendInfoToChat = sinon.stub(chat, 'sendInfoToChat')
      getUserWithParams.onCall(0).returns([{
        username: 'membre.actif',
        email: `membre.actif@${config.domain}`
      }]);
      getUserWithParams.onCall(1).returns([]);
      const res = await chai.request(app)
        .post(routes.ADMIN_MATTERMOST_SEND_MESSAGE)
        .send({
          fromBeta: true,
          excludeEmails: '',
          includeEmails: '',
          prod: true
        })
        // .set('session', `token=${utils.getJWT('membre.actif')}`)
      res.should.have.status(200);
      getUserWithParams.callCount.should.be.eq(1)
      getAdminStub.restore()
      getUserWithParams.restore()
      getMattermostUsersWithStatus.restore()
      sendInfoToChat.restore()
    });

    it('should take exclude in consideration', async () => {
      const getAdminStub = sinon.stub(adminConfig, 'getAdmin').returns(['membre.actif']);
      const getMattermostUsersWithStatus = sinon.stub(mattermostScheduler ,'getMattermostUsersWithStatus').returns(Promise.resolve([]))
      const getMattermostUsersSpy = sinon.spy(sendMattermostMessage, 'getMattermostUsers')
      const getUserWithParams = sinon.stub(chat, 'getUserWithParams')
      const sendInfoToChat = sinon.stub(chat, 'sendInfoToChat')
      getUserWithParams.onCall(0).returns([{
        username: 'membre.actif',
        email: `membre.actif@${config.domain}`
      }]);
      getUserWithParams.onCall(1).returns([]);
      const res = await chai.request(app)
        .post(routes.ADMIN_MATTERMOST_SEND_MESSAGE)
        .send({
          fromBeta: true,
          includeEmails: '',
          prod: true
        })
        // .set('session', `token=${utils.getJWT('membre.actif')}`)
      res.should.have.status(200);
      const resMatterUser = await getMattermostUsersSpy.returnValues[0]
      resMatterUser.length.should.be.eq(1)
      getUserWithParams.callCount.should.be.eq(1)
      getAdminStub.restore()
      getUserWithParams.restore()
      getMattermostUsersWithStatus.restore()
      sendInfoToChat.restore()
    });

    it('should send message to all users if prod is true and channel set', async () => {
      const getAdminStub = sinon.stub(adminConfig, 'getAdmin').returns(['membre.actif']);
      const getMattermostUsersWithStatus = sinon.stub(mattermostScheduler ,'getMattermostUsersWithStatus').returns(Promise.resolve([]))
      const getUserWithParams = sinon.stub(chat, 'getUserWithParams')
      const sendInfoToChat = sinon.stub(chat, 'sendInfoToChat')
      getUserWithParams.onCall(0).returns([{
        username: 'membre.actif',
        email: `membre.actif@${config.domain}`,
      }]);
      getUserWithParams.onCall(1).returns([]);
      const res = await chai.request(app)
        .post(routes.ADMIN_MATTERMOST_SEND_MESSAGE)
        .send({
          fromBeta: true,
          excludeEmails: '',
          prod: true,
          channel: 'general'
        })
        // .set('session', `token=${utils.getJWT('membre.actif')}`)
      res.should.have.status(200);
      getUserWithParams.callCount.should.be.eq(0)
      sendInfoToChat.getCall(0).args[0].channel.should.equal('general')
      sendInfoToChat.calledTwice.should.be.true
      getAdminStub.restore()
      getUserWithParams.restore()
      getMattermostUsersWithStatus.restore()
      sendInfoToChat.restore()
    });
  });
});
