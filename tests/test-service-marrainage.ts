import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import _ from 'lodash/array';
import * as controllerUtils from '../src/controllers/utils';
import knex from '../src/db';
import testUsers from './users.json';
import { MarrainageService1v, MarrainageServiceWithGroup } from '../src/services/marrainageService';
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
        it('should get an onboarder using selectRandomOnBoarderFunction v1', async () => {
            const marrainageService = new MarrainageService1v()
            const onboarder = await marrainageService.selectRandomOnboarder('lucas.charrier', Domaine.DEVELOPPEMENT)
            onboarder.should.not.be.equals(undefined)
        });

        it('should get an onboarder using selectRandomOnBoarderFunction with group', async () => {
            const marrainageService = new MarrainageServiceWithGroup(testUsers as Member[])
            const onboarder = await marrainageService.selectRandomOnboarder('lucas.charrier', Domaine.DEVELOPPEMENT)
            onboarder.should.not.equals(undefined)
        });

        it('should create marrainage', async () => {
          const marrainageService = new MarrainageServiceWithGroup(testUsers as Member[])
          const onboarder : string = 'julien.dauphant'
          const newcomer : string = 'lucas.charrier'
          await marrainageService.createMarrainage(newcomer, onboarder)
          const marrainageGroup = await knex('marrainage_groups').where({
            onboarder: 'julien.dauphant'
          }).first()
          marrainageGroup.count.should.equals(1)
          const marrainage_groups_members = await knex('marrainage_groups_members').where({
            id: marrainageGroup.id,
            username: newcomer
          })
          chai.should().not.exist(marrainage_groups_members)
      });
    });
});
