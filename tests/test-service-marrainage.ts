import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import _ from 'lodash/array';
import * as controllerUtils from '../src/controllers/utils';
import knex from '../src/db';
import testUsers from './users.json';
import { MarrainageService1v, MarrainageService2v } from '../src/services/marrainageService';
import { Domaine, Member } from '../src/models/member';


chai.use(chaiHttp);

describe('Marrainage Service test', () => {
  let clock;
  let sendEmailStub;
  let differenceLodashSpy;

  beforeEach((done) => {
    sendEmailStub = sinon
      .stub(controllerUtils, 'sendMail')
      .returns(Promise.resolve(true));
    differenceLodashSpy = sinon
      .spy(_,'differenceWith')
    
    clock = sinon.useFakeTimers(new Date('2020-01-01T09:59:59+01:00'));
    done();
  });

  afterEach((done) => {
    knex('marrainage')
      .truncate()
      .then(() => sendEmailStub.restore())
      .then(() => clock.restore())
      .then(() => done());
    differenceLodashSpy.restore();
    sendEmailStub.restore();
  });

    describe('unauthenticated', () => {
        it('Test marrainageService v1', async () => {
            const marrainageService = new MarrainageService1v()
            const onboarder = await marrainageService.selectRandomOnboarder('lucas.charrier', Domaine.DEVELOPPEMENT)
            onboarder.should.not.be.equals(undefined)
        });

        it('Test marrainageService v2', async () => {
            const marrainageService = new MarrainageService2v(testUsers as Member[])
            const onboarder = await marrainageService.selectRandomOnboarder('lucas.charrier', Domaine.DEVELOPPEMENT)
            onboarder.should.not.equals(undefined)
        });
    });
});
