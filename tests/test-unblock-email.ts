import chai from 'chai';
import chaiHttp from 'chai-http';
import { unblockEmailsThatAreActive } from '@/schedulers/unblockEmailsThatAreActive';
import * as EmailConfig from '@config/email.config'
import Sinon from 'sinon';
import betagouv from '@/betagouv';

chai.use(chaiHttp);

describe('Unblock emails', () => {
  let getAllTransacBlockedContactsStub
  let smtpBlockedContactsEmailDeleteStub
  let getAllEmailInfosStub
  beforeEach(() => {
    getAllTransacBlockedContactsStub = Sinon.stub(EmailConfig, 'getAllTransacBlockedContacts')
    getAllTransacBlockedContactsStub.returns(Promise.resolve([{
      email: 'membre.actif@betagouv.ovh'
    }]))
    smtpBlockedContactsEmailDeleteStub = Sinon.stub(EmailConfig, 'smtpBlockedContactsEmailDelete')
    getAllEmailInfosStub = Sinon.stub(betagouv, 'getAllEmailInfos')
    getAllEmailInfosStub.returns(Promise.resolve([
      'membre.actif@betagouv.ovh',
      'jean.francois@betagouv.ovh'
    ]))
  })
  afterEach(() => {
    getAllTransacBlockedContactsStub.restore()
    getAllEmailInfosStub.restore()
    smtpBlockedContactsEmailDeleteStub.restore()
  })
  it('Should unblock emails that are active', async () => {

      await unblockEmailsThatAreActive()
      smtpBlockedContactsEmailDeleteStub.calledOnce.should.be.true
      smtpBlockedContactsEmailDeleteStub.calledWith({ email: 'membre.actif@betagouv.ovh' })
  });
})