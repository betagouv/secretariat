import { EmailMarrainageNewcomer, EmailMarrainageOnboarder, EmailUserShouldUpdateInfo, EMAIL_TYPES } from "@/modules/email"
import htmlBuilder from "./htmlbuilder"
import testUsers from "../../../tests/users.json"
import { Domaine, Member } from "@/models/member"
import * as mdtohtml from '@/lib/mdtohtml';
import sinon from "sinon";
import { Job } from "@/models/job";

describe('Test MARRAINAGE_REQUEST_EMAIL', async () => {
    it('should build MARRAINAGE_REQUEST_EMAIL', async () => {
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

describe('Test MARRAINAGE_REQUEST_FAILED', () => {
    it('email MARRAINAGE_REQUEST_FAILED', async () => {
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_REQUEST_FAILED,
            variables: {
                errorMessage: `Pas de parrain dispo`,
                userId: 'mathilde.dupont'
            }
        })
        emailBody.should.include(
            'Pas de parrain dispo'
        );
    })
})

describe('Test ONBOARDING_REFERENT_EMAIL', () => {
    it('email ONBOARDING_REFERENT_EMAIL', async () => {
        const prUrl = 'http://github.com/uneurl'
        const name = 'Paul'
        const isEmailBetaAsked = false
        const referent = 'Lucas'
        const renderHtmlFromMd = sinon
            .spy(mdtohtml, 'renderHtmlFromMd') 
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.ONBOARDING_REFERENT_EMAIL,
            variables: {
                referent,
                prUrl,
                name,
                isEmailBetaAsked
            }
        })
        const emailSubject : string = await htmlBuilder.renderSubjectForType({
            type: EMAIL_TYPES.ONBOARDING_REFERENT_EMAIL,
            variables: {
                referent,
                prUrl,
                name,
                isEmailBetaAsked
            }
        })
  
        emailBody.should.include(prUrl)
        emailBody.should.include(name)
        emailSubject.should.equal(`${name} vient de créer sa fiche Github`)
        renderHtmlFromMd.called.should.be.true
        renderHtmlFromMd.restore()
    })
})

describe('Test EMAIL_PR_PENDING', () => {
    it('email EMAIL_PR_PENDING', async () => {
        const pr_link = 'http://github.com/uneurl'
        const username = 'Paul'
        const renderHtmlFromMd = sinon
            .spy(mdtohtml, 'renderHtmlFromMd') 
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_PR_PENDING,
            variables: {
                username,
                pr_link
            }
        })
  
        emailBody.should.include(username)
        emailBody.should.include(pr_link)
        renderHtmlFromMd.called.should.be.true
        renderHtmlFromMd.restore()
    })
})

describe('Test EMAIL_MATTERMOST_ACCOUNT_CREATED', () => {
    it('email EMAIL_MATTERMOST_ACCOUNT_CREATED', async () => {
        const resetPasswordLink = 'https://mattermost-reset-link'
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_MATTERMOST_ACCOUNT_CREATED,
            variables: {
                resetPasswordLink
            }
        })
  
        emailBody.should.include(resetPasswordLink)
    })
})

describe('Test EMAIL_ENDING_CONTRACT', () => {
    it('email EMAIL_ENDING_CONTRACT_2_DAYS', async () => {
        const job : Job = {
            id: 'test',
            url: 'http://urldejob',
            domaine: Domaine.ANIMATION,
            title: 'Un job'
        } as unknown as Job
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_2_DAYS,
            variables: {
                user: testUsers.find(user => user.id === 'julien.dauphant') as Member,
                jobs: [job]
            }
        })
        emailBody.should.include(job.url)
        emailBody.should.include('prévu pour dans 2 jours')
    })

    it('email EMAIL_ENDING_CONTRACT_15_DAYS', async () => {
        const job : Job = {
            id: 'test',
            url: 'http://urldejob',
            domaine: Domaine.ANIMATION,
            title: 'Un job'
        } as unknown as Job
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_15_DAYS,
            variables: {
                user: testUsers.find(user => user.id === 'julien.dauphant') as Member,
                jobs: [job]
            }
        })
        emailBody.should.include(job.url)
        emailBody.should.include('Un petit mot pour te rappeler')
    })

    it('email EMAIL_ENDING_CONTRACT_30_DAYS', async () => {
        const job : Job = {
            id: 'test',
            url: 'http://urldejob',
            domaine: Domaine.ANIMATION,
            title: 'Un job'
        } as unknown as Job
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_30_DAYS,
            variables: {
                user: testUsers.find(user => user.id === 'julien.dauphant') as Member,
                jobs: [job]
            }
        })
  
        emailBody.should.include('Un petit mot pour te rappeler')
        emailBody.should.include(job.url)
    })
})

describe('Test EMAIL_NO_MORE_CONTRACT', () => {
    it('email EMAIL_NO_MORE_CONTRACT_1_DAY', async () => {
        const user : Member = {
            username: 'jean.paul',
            fullname: 'Jean Paul'
        } as unknown as Member
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_1_DAY,
            variables: {
                user
            }
        })
        emailBody.should.include(user.fullname)
        emailBody.should.include('Un petit mot pour te rappeler')
    })

    it('email EMAIL_NO_MORE_CONTRACT_30_DAY', async () => {
        const user : Member = {
            username: 'jean.paul',
            fullname: 'Jean Paul'
        } as unknown as Member
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_30_DAY,
            variables: {
                user
            }
        })
        emailBody.should.include(user.fullname)
        emailBody.should.include('Un petit mot pour te rappeler')
    })
})

describe('Test EMAIL_USER_SHOULD_UPDATE_INFO', () => {
    it('email EMAIL_USER_SHOULD_UPDATE_INFO', async () => {
        const renderHtmlFromMd = sinon
            .spy(mdtohtml, 'renderHtmlFromMd') 
        const user: EmailUserShouldUpdateInfo['variables']['user'] = {
            fullname: 'jean.paul',
            secondary_email: "paul@beta.gouv.fr",
            workplace_insee_code: "75012",
            tjm: '125 euros',
            gender: 'Ne se prononce pas',
            startups: ['aide-jaune'],
            legal_status: 'Auto-entreprise',
        } as EmailUserShouldUpdateInfo['variables']['user']
        const secretariatUrl : string = 'http://secretariat-url'
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_USER_SHOULD_UPDATE_INFO,
            variables: {
                user,
                secretariatUrl
            }
        })
        emailBody.should.include(user.fullname)
        emailBody.should.include(user.tjm)
        emailBody.should.include(user.gender)
        emailBody.should.include(user.legal_status)
        emailBody.should.include(user.startups[0])
        emailBody.should.include(secretariatUrl)
        renderHtmlFromMd.called.should.be.true
        renderHtmlFromMd.restore()
    })
})

describe(`Test MARRAINAGE_NEWCOMER_EMAIL`, () => {
    it(`email MARRAINAGE_NEWCOMER_EMAIL`, async () => {
        const renderHtmlFromMd = sinon
            .spy(mdtohtml, 'renderHtmlFromMd') 
        const onboarder: EmailMarrainageNewcomer['variables']['onboarder'] = {
            fullname: 'Jean Paul',
        } as EmailMarrainageNewcomer['variables']['onboarder']
        const member: EmailMarrainageNewcomer['variables']['member'] = {
            fullname: 'Paul-Erick Tarantule',
        } as EmailMarrainageNewcomer['variables']['member']
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_NEWCOMER_EMAIL,
            variables: {
                member,
                onboarder
            }
        })
        emailBody.should.include('Bonjour Paul-Erick')
        emailBody.should.include(`Jean Paul`)
        renderHtmlFromMd.called.should.be.true
        renderHtmlFromMd.restore()
    })
})

describe(`Test MARRAINAGE_ONBOARDER_EMAIL`, () => {
    it(`email MARRAINAGE_ONBOARDER_EMAIL`, async () => {
        const renderHtmlFromMd = sinon
            .spy(mdtohtml, 'renderHtmlFromMd') 
        const member: EmailMarrainageOnboarder['variables']['member'] = {
            fullname: 'Paul-Erick Tarantule',
        } as EmailMarrainageOnboarder['variables']['member']
        const newcomers: EmailMarrainageOnboarder['variables']['newcomers'] = [{
            fullname: 'Jean Paul',
            email: 'jean.paul@beta.gouv.fr'
        }, {
            fullname: 'Arnaud Lagarde',
            email: 'arnaud.lagarde@gmail.com'
        }] as EmailMarrainageOnboarder['variables']['newcomers']
        const emailBody : string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_ONBOARDER_EMAIL,
            variables: {
                member,
                newcomers
            }
        })
        console.log(emailBody)
        emailBody.should.include(`Jean Paul`)
        emailBody.should.include(`Arnaud Lagarde`)
        renderHtmlFromMd.called.should.be.true
        renderHtmlFromMd.restore()
    })
})


