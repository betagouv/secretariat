import chai from 'chai';
import chaiHttp from 'chai-http';
import { unblockEmailsThatAreActive } from '@/schedulers/unblockEmailsThatAreActive';
import * as EmailConfig from '@config/email.config'
import Sinon from 'sinon';
import betagouv from '@/betagouv';

chai.use(chaiHttp);

describe('Startup page', () => {
  describe('GET /startups unauthenticated', () => {
    it('should redirect to login', async () => {
        const getAllTransacBlockedContactsStub = Sinon.stub(EmailConfig, 'getAllTransacBlockedContacts')
        getAllTransacBlockedContactsStub.returns(Promise.resolve([{
          email: 'membre.actif@betagouv.ovh'
        }]))
        const smtpBlockedContactsEmailDeleteStub = Sinon.stub(EmailConfig, 'smtpBlockedContactsEmailDelete')
        const getAllEmailInfos = Sinon.stub(betagouv, 'getAllEmailInfos')
        getAllEmailInfos.returns(Promise.resolve([
          'membre.actif@betagouv.ovh',
          'jean.francois@betagouv.ovh'
        ]))
        await unblockEmailsThatAreActive()
        smtpBlockedContactsEmailDeleteStub.calledOnce.should.be.true
        smtpBlockedContactsEmailDeleteStub.calledWith({ email: 'membre.actif@betagouv.ovh' })
        getAllTransacBlockedContactsStub.restore()
        getAllEmailInfos.restore()
        smtpBlockedContactsEmailDeleteStub.restore()
    });
  });
})