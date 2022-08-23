import { EMAIL_TYPES } from "@/modules/email"
import htmlBuilder from "./htmlbuilder"
import testUsers from "../../../tests/users.json"
import { Member } from "@/models/member"

describe('Test MARRAINAGE_REQUEST_EMAIL', async () => {
    it('should build ARRAINAGE_REQUEST_EMAIL', async () => {
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL,
            variables: {
                newcomer: testUsers.find(user => user.id === 'membre.actif') as Member,
                onboarder: testUsers.find(user => user.id === 'julien.dauphant') as Member,
                marrainageAcceptUrl: 'http://adresse/marrainage/accept',
                marrainageDeclineUrl: 'http://adresse/marrainage/decline',
                startup: '',
            }
        })
        const subject = htmlBuilder.subjects[EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL]
        emailBody.should.include('marrainage/accept');
        emailBody.should.include('marrainage/decline');
        subject.should.equal('Tu as été sélectionné·e comme marrain·e 🙌')
    }) 

    it('email MARRAINAGE_REQUEST_EMAIL should include position and startup when available', async () => {
        const newcomer = testUsers.find(user => user.id === 'membre.actif') as Member
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL,
            variables: {
                newcomer: newcomer,
                onboarder: testUsers.find(user => user.id === 'julien.dauphant') as Member,
                marrainageAcceptUrl: 'http://adresse/marrainage/accept',
                marrainageDeclineUrl: 'http://adresse/marrainage/decline',
                startup: 'test-startup',
            }
        })
        console.log(emailBody)
        emailBody.should.include('(Chargé de déploiement chez <a href="https://beta.gouv.fr/startups/test-startup.html" target="_blank">test-startup</a>)');

    }) 

    it('email MARRAINAGE_REQUEST_EMAIL should include role only when startup not available', async () => {
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL,
            variables: {
                newcomer: testUsers.find(user => user.id === 'membre.plusieurs.missions') as Member,
                onboarder: testUsers.find(user => user.id === 'julien.dauphant') as Member,
                marrainageAcceptUrl: 'http://adresse/marrainage/accept',
                marrainageDeclineUrl: 'http://adresse/marrainage/decline',
                startup: '',
            }
        })
        emailBody.should.include('(Chargé de déploiement)');
    })


    it('email MARRAINAGE_REQUEST_EMAIL should include startup only when role not available', async () => {
        const newcomer = testUsers.find(user => user.id === 'membre.nouveau') as Member
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL,
            variables: {
                newcomer: {
                    "id": "membre.nouveau",
                    "fullname": "Membre Nouveau",
                    "domaine": "Animation",
                    "startups": ["test-startup"]
                } as Member,
                onboarder: testUsers.find(user => user.id === 'julien.dauphant') as Member,
                marrainageAcceptUrl: 'http://adresse/marrainage/accept',
                marrainageDeclineUrl: 'http://adresse/marrainage/decline',
                startup: 'test-startup',
            }
        })
        emailBody.should.include('(récemment arrivé·e chez <a href="https://beta.gouv.fr/startups/test-startup.html" target="_blank">test-startup</a>)');
    });
})

describe('Test MARRAINAGE_ACCEPT_ONBOARDER_EMAIL', async () => {
    it('email MARRAINAGE_ACCEPT_ONBOARDER_EMAIL', async () => {
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_ACCEPT_ONBOARDER_EMAIL,
            variables: {
                newcomer: testUsers.find(user => user.id === 'membre.nouveau') as Member,
                onboarder: testUsers.find(user => user.id === 'julien.dauphant') as Member,
            }
        })
        htmlBuilder.subjects[EMAIL_TYPES.MARRAINAGE_ACCEPT_ONBOARDER_EMAIL].should.equal('Mise en contact 👋');
        emailBody.should.include(
            'Tu as accepté de marrainer Membre Nouveau'
        );
    })
})


describe('Test MARRAINAGE_ACCEPT_NEWCOMER_EMAIL', () => {
    it('email MARRAINAGE_ACCEPT_NEWCOMER_EMAIL', async () => {
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_ACCEPT_NEWCOMER_EMAIL,
            variables: {
                newcomer: testUsers.find(user => user.id === 'membre.nouveau') as Member,
                onboarder: testUsers.find(user => user.id === 'membre.actif') as Member,
            }
        })
        htmlBuilder.subjects[EMAIL_TYPES.MARRAINAGE_ACCEPT_NEWCOMER_EMAIL].should.equal('Mise en contact 👋');
        emailBody.should.include(
            'Membre Actif a accepté de te marrainer'
        );
    })
})

