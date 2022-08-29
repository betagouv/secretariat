import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import _ from 'lodash/array';
import * as controllerUtils from '@controllers/utils';
import knex from '@/db';
import testUsers from './users.json';
import { MarrainageService1v, MarrainageServiceWithGroup } from '@services/marrainageService';
import { Domaine, Member } from '@models/member';
import { MarrainageGroup, MarrainageGroupMember, MarrainageGroupStatus } from '@models/marrainage';


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

    describe('Test marrainage service v1', () => {
        it('should get an onboarder using selectRandomOnBoarderFunction v1', async () => {
            const marrainageService = new MarrainageService1v()
            const onboarder = await marrainageService.selectRandomOnboarder('lucas.charrier', Domaine.DEVELOPPEMENT)
            onboarder.should.not.be.equals(undefined)
        });
    });

    describe('Test marrainage service with group', () => {
      it('should get an onboarder using selectRandomOnBoarderFunction with group', async () => {
        const marrainageService = new MarrainageServiceWithGroup(testUsers as Member[], 2)
        const onboarder = await marrainageService.selectRandomOnboarder('lucas.charrier', Domaine.DEVELOPPEMENT)
        onboarder.should.not.equals(undefined)
      });

      it('should create marrainage', async () => {
        const marrainageService = new MarrainageServiceWithGroup(testUsers as Member[], 2)
        const onboarder : string = 'julien.dauphant'
        const newcomer : string = 'membre.nouveau'
        const newcomer2 : string = 'membre.actif'

        // marrainage does not exist yet
        let marrainageGroup: MarrainageGroup = await knex('marrainage_groups').where({
          onboarder
        }).first()
        chai.should().not.exist(marrainageGroup)

        // marrainage goup with onboader should be created
        await marrainageService.createMarrainage(newcomer, onboarder)
        marrainageGroup = await knex('marrainage_groups').where({
          onboarder
        }).first()
        marrainageGroup.count.should.equals(1)

        const marrainage_groups_members : MarrainageGroupMember = await knex('marrainage_groups_members').where({
          marrainage_group_id: marrainageGroup.id,
          username: newcomer
        }).first()
        chai.should().exist(marrainage_groups_members)

        // marrainage goup with onboarder should be increments by 1
        await marrainageService.createMarrainage(newcomer2, onboarder)
        marrainageGroup = await knex('marrainage_groups').where({
          onboarder
        }).first()  
        chai.should().equal(marrainageGroup.count, 2)
        chai.should().equal(marrainageGroup.status, MarrainageGroupStatus.PENDING)
        knex('marrainage_groups').truncate()
        knex('marrainage_groups_members').truncate()
    });

    it('should set pending marrainage to status DOING if count > 1', async () => {
      const marrainageService = new MarrainageServiceWithGroup(testUsers as Member[], 1)
      const onboarder : string = 'julien.dauphant'
      const newcomer : string = 'membre.nouveau'
      let marrainageGroup = await knex('marrainage_groups')
      .insert({
          onboarder,
          status: MarrainageGroupStatus.PENDING
      }).returning('*').then(res => res[0])
      await knex('marrainage_groups_members')
        .insert({
            username: newcomer,
            marrainage_group_id: marrainageGroup.id
        })
      await marrainageService.createMarrainage(newcomer, onboarder)

      marrainageGroup = await knex('marrainage_groups').where({
        onboarder
      }).first()  
      chai.should().equal(marrainageGroup.count, 1)
      chai.should().equal(marrainageGroup.status, MarrainageGroupStatus.PENDING)
      await marrainageService.checkAndUpdateMarrainagesStatus()
      chai.should().equal(marrainageGroup.status, MarrainageGroupStatus.DOING)
      knex('marrainage_groups').truncate()
      knex('marrainage_groups_members').truncate()
    });

    it('should set pending marrainage to status DOING if created_date was 2 weeks ago', async () => {
      const MARRAINAGE_GROUP_LIMIT = 10
      const MARRAINAGE_GROUP_WEEK_LIMIT = 2
      const marrainageService = new MarrainageServiceWithGroup(testUsers as Member[], MARRAINAGE_GROUP_LIMIT, MARRAINAGE_GROUP_WEEK_LIMIT)
      const onboarder : string = 'julien.dauphant'
      const newcomer : string = 'membre.actif'
      const todayLessXdays = new Date()
      todayLessXdays.setDate(todayLessXdays.getDate() - (MARRAINAGE_GROUP_WEEK_LIMIT + 1) * 7)
      const marrainageGroup = await knex('marrainage_groups')
        .insert({
            onboarder,
            status: MarrainageGroupStatus.PENDING,
            created_at: new Date()
        }).returning('*').then(res => res[0])
        await knex('marrainage_groups_members')
          .insert({
              username: newcomer,
              marrainage_group_id: marrainageGroup.id
          })

      
      chai.should().equal(marrainageGroup.count, 1)
      chai.should().equal(marrainageGroup.status, MarrainageGroupStatus.PENDING)
      await marrainageService.checkAndUpdateMarrainagesStatus()
      chai.should().equal(marrainageGroup.status, MarrainageGroupStatus.DOING)
      knex('marrainage_groups').truncate()
      knex('marrainage_groups_members').truncate()
    });
  })
});
