import chai from 'chai';
import chaiHttp from 'chai-http';
import { unblockEmailsThatAreActive } from '@/schedulers/unblockEmailsThatAreActive';
import * as EmailConfig from '@config/email.config'
import Sinon from 'sinon';
import betagouv from '@/betagouv';
import config from '@/config';

chai.use(chaiHttp);

describe('Unblock emails', () => {
  let getAllTransacBlockedContactsStub
  let unblacklistContactEmailStub
  let getAllEmailInfosStub
  let getAllContactsFromList
  beforeEach(() => {
    getAllTransacBlockedContactsStub = Sinon.stub(EmailConfig, 'getAllTransacBlockedContacts')
    getAllTransacBlockedContactsStub.returns(Promise.resolve([{
      email: `membre.actif@${config.domain}`
    }]))
    unblacklistContactEmailStub = Sinon.stub(EmailConfig, 'unblacklistContactEmail')
    getAllEmailInfosStub = Sinon.stub(betagouv, 'getAllEmailInfos')
    getAllEmailInfosStub.returns(Promise.resolve([
      'membre.actif',
      'jean.francois',
      'autremembre.actif'
    ]))
    getAllContactsFromList = Sinon.stub(EmailConfig, 'getAllContactsFromList')
    getAllContactsFromList.returns(Promise.resolve([{
      email: `autremembre.actif@${config.domain}`,
      emailBlacklisted: true
    }]))
  })
  afterEach(() => {
    getAllTransacBlockedContactsStub.restore()
    getAllEmailInfosStub.restore()
    unblacklistContactEmailStub.restore()
    getAllContactsFromList.restore()
  })
  it('Should unblock emails that are active', async () => {

      await unblockEmailsThatAreActive()
      unblacklistContactEmailStub.calledTwice.should.be.true
      unblacklistContactEmailStub.calledWith({ email: 'membre.actif@betagouv.ovh' })
  });
})