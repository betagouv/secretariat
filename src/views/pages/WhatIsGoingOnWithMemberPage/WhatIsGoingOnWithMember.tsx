import React from 'react'

import DatepickerSelect from '../components/DatepickerSelect'
import { PageLayout } from '../components/PageLayout';
import MemberSelect from "../components/MemberSelect"
import { StartupInfo } from '@/models/startup';
import { Member, MemberWithPermission } from '@/models/member';
import { CommuneInfo } from '@/models/communeInfo';
import { Option } from '@/models/misc';
import { hydrateOnClient } from '../../hydrateOnClient';
import axios from 'axios';
import routes from '@/routes/routes';

enum STEP {
    whichMember = 'whichMember',
    updateEndDate = 'updateEndDate',
    createEmail = 'createEmail',
    showUserInfo = 'showUserInfo',
    waitingForDateToBeUpdated = "waitingForDateToBeUpdated",
    accountPendingCreation = "accountPendingCreation",
    everythingIsGood = "everythingIsGood",
    emailSuspended = "emailSuspended",
    showMember = "showMember"
}

type MemberAllInfo = MemberWithPermission & { secondaryEmail?: string, emailInfos,
    isExpired?: boolean,
    isEmailBlocked: boolean,
    hasEmailInfos: boolean,
    hasSecondaryEmail: boolean,
    primaryEmailStatus: string }

interface FormErrorResponse {
    errors?: Record<string,string[]>
    message: string
}

interface Props {
    title?: string,
    errors?: string[],
    messages?: string[],
    request: Request,
    formData: FormData,
    users: Member[],
    domaineOptions?: Option[],
    statusOptions?: Option[],
    genderOptions?: Option[],
    formValidationErrors?: any,
    communeInfo?: CommuneInfo,
    startups?: StartupInfo[],
    userInfos: Member,
    hasPublicServiceEmail?: boolean,
    startupOptions?: {
        value: string,
        label: string
    }[],
    userConfig: {
        statusOptions: Option[],
        minStartDate: string,
        badgeOptions: Option[],
        memberOptions: Option[]
    }
}

const ConnectedScreen = (props) => {
    const [connected, setConnected] = React.useState(false)
    const [seconds, setSeconds] = React.useState(30)
    const [loginSent, setLoginSent] = React.useState(false)
    const [email, setEmail] = React.useState('')
    const [calledOnce, setCalledOnce] = React.useState(false)
    const [wasAlreadyConnected, setWasAlreadyConnected] = React.useState(false)
    const pingConnection = async() => {
        console.log('Ping connection')
        const user = await axios.get(routes.ME).then(res => res.data.user)
        .catch(e => {
            console.log(`L'utilisateur n'est pas connecté`)
        })
        if (user) {
            if (!calledOnce) {
                setWasAlreadyConnected(true)
            }
            setConnected(true)
        }
        if (!calledOnce) {
            setCalledOnce(true)
        }
    }
    React.useEffect(() => {
        // exit early when we reach 0
        if (!seconds) return;
    
        // save intervalId to clear the interval when the
        // component re-renders
        const intervalId = setInterval(() => {
            const prev = seconds
            if (seconds === 30) {
                pingConnection().catch(console.error);
            }
            if (prev - 1 === 0) {
                setSeconds(30)
            } else {
                setSeconds(seconds - 1)
            }
        }, 1000);
    
        // clear interval on re-render to avoid memory leaks
        return () => clearInterval(intervalId);
        // add seconds as a dependency to re-rerun the effect
        // when we update it
      }, [seconds]);
    // React.useEffect(() => {
    //     pingConnection().catch(console.error);
    // }, [])
    const onSubmit = async (e) => {
        e.preventDefault()
        try {
            await axios.post(routes.LOGIN_API, {
                emailInput: email
            }).then(res => res.data)
            setLoginSent(true)
            await pingConnection()
        } catch(e) {
            console.log(e)
        }
    }

    return <>
        <h2>{props.title}</h2>
        {calledOnce && !wasAlreadyConnected && <div className="notification">
            <p><b>Pour effectuer cette action il faut être connecter, nous allons t'envoyer un lien de connexion</b></p>
            { !connected && !loginSent && <form action={`/login${props.next}`} method="POST" id="login_form" onSubmit={onSubmit}>
                <label htmlFor="emailInput"><b>Ton email (@beta.gouv.fr ou secondaire)</b></label>
                <div className="input__group">
                    <input
                        onChange={e => {
                            setEmail(e.currentTarget.value)
                        }}
                        name="emailInput"
                        type="email"
                        placeholder="prenom.nom@beta.gouv.fr"
                        autoComplete="username"/>
                </div>
                <button className="button" id="primary_email_button">Recevoir le lien de connexion</button>
                <span><a href="#forgot">J'ai oublié mon email</a></span>
            </form>}
            { loginSent && <p>
                Lien de connexion envoyé ! Clique sur le lien de connexion que tu as reçu par email, puis sur "Me connecter" et reviens sur cette page.<br/>
                Nouveau test de connexion dans {seconds}s.
            </p>}
            {connected && <p>Tu es connecté !</p>}
        </div>}
        {calledOnce && <div style={!connected ? { opacity: 0.5, pointerEvents: 'none'} : {}}>
            {props.children}
        </div>}
    </>
}

const EmailInfo = function({ emailInfos, primaryEmailStatus}) {
    return <><p><span className="font-weight-bold">Email principal</span> : {emailInfos.email}
        {emailInfos.isPro &&
            <span>(offre OVH Pro)</span>}
        {emailInfos.isExchange &&
            <span>(offre OVH Exchange)</span>
        }</p>
        <p><span className="font-weight-bold">Statut de l'email</span> : {primaryEmailStatus}</p>
        <p><span className="font-weight-bold">Compte bloqué pour cause de spam</span> : {emailInfos.isBlocked ? 'oui' : 'non'}</p>
    </>
}

const UserInfo = function(props) {
    return <>
        <p><span className="font-weight-bold">Nom</span>: {props.userInfos.fullname}</p>
        <p><span className="font-weight-bold">Rôle:</span> {props.userInfos.role}</p>
        {props.userInfos.startups && <p>
            <span className="font-weight-bold">Startups actuelles:</span><br/>
                {props.userInfos.startups.map(function(startup){
                    return <>- {startup}<br/></>
                })}
            </p>
        }
        {props.userInfos.end &&
            <p>
                <span className="font-weight-bold">Fin de mission :</span>
                {props.userInfos.end && new Date(props.userInfos.end).toLocaleDateString('fr-FR')}
            </p>    
        }
        {props.userInfos.employer && <p>
            <strong>Employeur : </strong>{ props.userInfos.employer.replace('admin/', '')}
        </p>}
        {props.userInfos.github &&
            <p>
                <strong>Compte Github :</strong>
                {props.userInfos.github &&
                    <a href={`https://github.com/${props.userInfos.github}`}>{props.userInfos.github}</a>}
                { !props.userInfos.github && <p>
                    Non renseigné
                </p>}
            </p>
        }
    </>
}

const MemberComponent = function({
    emailInfos,
    isEmailBlocked,
    hasEmailInfos,
    hasSecondaryEmail,
    isExpired,
    userInfos,
    primaryEmailStatus,
    startFix
}) {
    const steps = [STEP.whichMember, STEP.showMember]
    const showSteps = (!!isExpired || !hasEmailInfos || primaryEmailStatus === 'suspendu' || !!isEmailBlocked)
    if (!!isExpired) {
        steps.push(STEP.updateEndDate)
        steps.push(STEP.waitingForDateToBeUpdated)
    }
    if (!hasEmailInfos) {
        steps.push(STEP.createEmail)
        steps.push(STEP.accountPendingCreation)
    }
    if (primaryEmailStatus === 'suspendu' || !!isEmailBlocked) {
        steps.push(STEP.emailSuspended)
    }
    steps.push(STEP.everythingIsGood)
    return <div>
    <h2>{userInfos.fullname}</h2>
    {!!userInfos && <UserInfo userInfos={userInfos}/>}
    {!!emailInfos && <EmailInfo emailInfos={emailInfos} primaryEmailStatus={primaryEmailStatus} />}
    {showSteps && <>
        <h3>Quels sont les problèmes ?</h3>
        <ul>
            {!!isExpired && 
                <li>Le contrat de {userInfos.fullname} est arrivé à terme le <strong>{userInfos.end}</strong>.</li>
            }
            {
                primaryEmailStatus === 'suspendu' && <li>
                    Son email @beta.gouv.fr est suspendu car sa date de fin a été mise à jour en retard
                </li>
            }
            {
                !emailInfos && <li>
                    Son email a été supprimé.
                </li>
            }
        </ul>
    </>}
    {showSteps && <>
        <div className="notification">
            <p>Pour réactiver son compte il faut :</p>
            <ol>
                {!!isExpired && <li>changer sa date de fin et merger la PR</li>}
                {!hasEmailInfos && <li>Re-créer son email beta</li>}
                {primaryEmailStatus === 'suspendu' && <li>changer son mot de passe pour réactiver son email</li>}
                {!!emailInfos && !!emailInfos.isBlocked && <li>L'email est bloqué pour cause de spam, il faut le réactiver en changeant le mot de passe</li>}
            </ol>
            {!hasEmailInfos && !!hasSecondaryEmail && <p>
                Si tu es un collègue de {userInfos.fullname} tu pourras recréer l'email pour lui/elle :).
            </p>}
            {!hasEmailInfos && !!hasSecondaryEmail && <p>Si tu es {userInfos.fullname} tu pourras recréer l'email toi même une fois ta date de fin à jour.</p>}
            {!hasEmailInfos && !hasSecondaryEmail && <p>
                {userInfos.fullname} n'a pas d'email secondaire, si tu es toi même {userInfos.fullname} il va falloir qu'un collègue le fasse à ta place.
            </p>}
        </div>
    </>}{
        !showSteps && <div className="notification">
            <p>Il n'y a pas de soucis avec cet utilisateur</p>
        </div>
    }
    {showSteps && <>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'}}>
            <button className="button" onClick={() => startFix(steps)} role="button">Commencer la procédure</button>
        </div>
    </>}
</div>
}

export const UpdateEndDateScreen = function(props) {
    const [date, setDate] = React.useState(props.date)
    const [dateStep, setDateStep] = React.useState('changeDate')
    const [isSaving, setIsSaving] = React.useState(false)
    const [formErrors, setFormErrors] = React.useState({});
    const [errorMessage, setErrorMessage] = React.useState('');
    const [pullRequestURL, setPullRequestURL] = React.useState();
    function changeFormData(value) {
        setDate(value)
    }

    function updateDate() {
        if (isSaving) {
            return
        }
        setIsSaving(true)
        axios.post(routes.ACCOUNT_POST_BASE_INFO_FORM.replace(':username', props.user.userInfos.id), {
            end: date,
            role: props.user.userInfos.role,
            startups: props.user.userInfos.startups
        }).then((resp) => {
            setPullRequestURL(resp.data.pr_url)
            setDateStep('waitingForPR')
        }).catch(({ response: { data }} : { response: { data: FormErrorResponse }}) => {
            const ErrorResponse : FormErrorResponse = data
            setErrorMessage(ErrorResponse.message)
            setIsSaving(false)
            if (ErrorResponse.errors) {
                setFormErrors(ErrorResponse.errors)
            }
        })
    }

    return <>
        <h2>Mise à jour de la date de fin pour {props.user.userInfos.fullname}</h2>
        { dateStep === 'changeDate' && <div className="no-margin">
            { !!errorMessage && 
                <p className="text-small text-color-red">{errorMessage}</p>
            }
            <div className="form__group">
                <label htmlFor="end">
                    <strong>Fin de la mission (obligatoire)</strong><br />
                    Si tu n'as pas la date exacte, mets une date dans 6 mois, c'est possible de la corriger plus tard.<br />
                    <i>Au format JJ/MM/YYYY</i>
                </label>
                <DatepickerSelect
                    name="endDate"
                    min={'2020-01-31'}
                    title="En format YYYY-MM-DD, par exemple : 2020-01-31" required
                    dateFormat='dd/MM/yyyy'
                    selected={date}
                    onChange={(date:Date) => changeFormData(date)} />
                { !!formErrors['nouvelle date de fin'] && 
                    <p className="text-small text-color-red">{formErrors['nouvelle date de fin']}</p>
                }
            </div>
            <div className="form__group">
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'}}>
                    <button
                        onClick={updateDate}
                        className="button no-margin"
                        type="submit">Valider le changement de date</button>
                </div>
            </div>
        </div>}
        { dateStep === 'waitingForPR' && <UpdateEndDatePendingScreen
            user={props.user}
            next={props.next}
            pullRequestURL={pullRequestURL}/>}
    </>
}

const AccountPendingCreationScreen = function(props) {
    return <div><h2>Création du compte en cours ...</h2>
        <p>Cela peut prendre jusqu'a 10 minutes</p>
        <button className="button" onClick={() => props.next()}>C'est bon l'email a été envoyé</button>
    </div>
}

export const UpdateEndDatePendingScreen = function(props) {
    const DEFAULT_TIME = 60
    const [seconds, setSeconds] = React.useState(DEFAULT_TIME)
    const [prStatus, setPRStatus] = React.useState('notMerged')
    const { pullRequestURL } = props
    const checkPR = async () => {
        try {
            const pullRequests = await axios.get(routes.PULL_REQUEST_GET_PRS).then(resp => resp.data.pullRequests)
            const pullRequestURLs = pullRequests.map(pr => pr.html_url)
            if (!pullRequestURLs.includes(props.pullRequestURL)) {
                setPRStatus('merged')
                setSeconds(DEFAULT_TIME)
            }
        } catch (e) {

        }
    }

    const checkPRChangesAreApplied = async () => {
        try {
            const data = await axios.get(routes.API_GET_USER_INFO.replace(':username', props.user.userInfos.id)).then(resp => resp.data)
            const isDateInTheFuture = new Date(data.userInfos.end) > new Date()
            if (isDateInTheFuture) {
                setPRStatus('validated')
                setSeconds(DEFAULT_TIME)
                // user date is now in the future
            }
        } catch (e) {
            console.error(e)
        }
    }

    React.useEffect(() => {
        // exit early when we reach 0
        if (!seconds) return;
    
        // save intervalId to clear the interval when the
        // component re-renders
        const intervalId = setInterval(() => {
            const prev = seconds
            if (seconds === DEFAULT_TIME && prStatus === 'notMerged') {
                checkPR()
            }
            if (seconds === DEFAULT_TIME && prStatus === 'merged') {
                checkPRChangesAreApplied()
            }
            if (prev - 1 === 0) {
                setSeconds(DEFAULT_TIME)
            } else {
                setSeconds(seconds - 1)
            }
        }, 1000);
    
        // clear interval on re-render to avoid memory leaks
        return () => clearInterval(intervalId);
        // add seconds as a dependency to re-rerun the effect
        // when we update it
      }, [seconds, prStatus]);

    return <>
        {prStatus === 'notMerged' && <><div className="notification">
            <p>Une pull request en attente : </p>
            <a href={pullRequestURL} target="_blank">{pullRequestURL}</a>
        </div>
        <p>Il faut la merger pour que le changement de date de fin soit prise en compte :)</p>
        <p>Suite au merge la prise en compte peut prendre 10 minutes</p></>}
        {prStatus === 'merged' && <>
            <p>La PR a probablement été mergé. Le changement sera pris en compte d'ici quelques minutes, il faut encore attendre :)</p>
        </>}
        {prStatus === 'validated' && <>
            <p>La PR est à jour c'est bon on peut passé à l'étape suivante :)</p>
            <button className={'button'} onClick={() => props.next()}>Passer à l'étape suivante</button>
        </>}
        {prStatus !== 'validated' && <p>Recheck dans {seconds} secondes</p>}
    </>
}

export const WhichMemberScreen = function(props) {
    // const [member, setMember] = React.useState(undefined)
    const [isSearching, setIsSearching] = React.useState(false)
    const [memberInfo, setMemberInfo] = React.useState(undefined)

    const search = async (member: string) => {
        setIsSearching(true)
        try {
            const data = await axios.get(routes.API_GET_USER_INFO.replace(':username', member)).then(resp => resp.data)
            setMemberInfo(data)
            props.setUser(data)
        } catch {
            alert(`Aucune info sur l'utilisateur`)
        }
        setIsSearching(false)
    }

    return <>
            {!memberInfo && <form className="no-margin">
                <h2>Qu'est-ce qu'il se passe ?</h2>
                <p>Sélectionne le membre que tu veux aider :</p>
                <div className="form__group">
                    <label><strong>Nom ou prénom du membre</strong></label>
                    <MemberSelect
                        name="username"
                        placeholder="Sélectionner un membre"
                        onChange={(e) => search(e.value)}
                        members={props.users.map(u => ({
                            value: u.id,
                            label: u.fullname
                        }))}
                        defaultValue={undefined}/>
                </div>
                <div className="form__group">
                    <button className="button no-margin" type="submit" disabled={isSearching}>
                        {!isSearching ? `Voir la fiche` : `Récupération des informations...`}
                    </button>
                </div>
            </form>}
        </>
}


export const CreateEmailScreen = function(props) {
    const [emailValue, setEmailValue] = React.useState(props.secondaryEmail)
    const createEmail = async () => {
        try {
            const api = routes.USER_CREATE_EMAIL_API.replace(':username', props.user.userInfos.id)
            const res = await axios.post(api, {
                to_email: emailValue
            })
            if (res.status === 200) {
                props.next()
            } else {
                throw new Error('Email was not created')
            }
        } catch(e) {
            console.error(e)
            alert('Un erreur est survenue')
        }
    }

    return <ConnectedScreen title={`Tu peux créer un compte mail pour ${props.user.userInfos.fullname}.`}><div>
        {!!props.hasPublicServiceEmail && <p>
            Attention s'iel a une adresse de service public en adresse primaire. L'adresse @beta.gouv.fr deviendra son adresse primaire :
            celle à utiliser pour mattermost, et d'autres outils.
        </p>}
        <div className="no-margin">
            <div className="form__group  margin-10-0">
                <label>
                    <span className="text-color-almost-black">Email personnel ou professionnel</span><br />
                    Le mot de passe et les informations de connexion seront envoyées à cet email
                </label>
            <input
                defaultValue={props.secondaryEmail}
                onChange={(event) => {
                    setEmailValue(event.target.value)
                }}
                type="email" required />
            </div>
            <button className="button no-margin" type="submit" onClick={createEmail}>Créer un compte</button>
        </div>
    </div></ConnectedScreen>
}

export const WhatIsGoingOnWithMember = PageLayout(function (props: Props) {
    const [step, setStep] = React.useState(STEP.whichMember)
    const [fixes, setFixes] = React.useState([STEP.whichMember, STEP.showMember])
    const [user, setUser] : [MemberAllInfo, (user: MemberAllInfo) => void] = React.useState(undefined)
    const noEmail = 'noEmail'

    React.useEffect(() => {
        const state : {
            step: STEP,
            memberId: string,
            user: MemberAllInfo
        } = JSON.parse(localStorage.getItem('state'))
        if (state) {
            history.pushState({
                step: state.step || STEP.whichMember
            }, '')
            if (state.step) {
                setStep(state.step)
            }
            if (state.user) {
                setUser(state.user)
            }
        }
        window.onpopstate = e => {
            setStep(e.state.step)
            //your code...
        }
    }, [])

    function startFix(fixeItems) {
        setFixes(fixeItems)
        next(fixeItems)
    }
    function goBack() {
        setStep(STEP.whichMember)
    }
    function next(steps?: STEP[], paramUser?: MemberWithPermission) {
        const currentStepIndex = (steps || fixes).findIndex(s => s === step)
        const nextStep = (steps || fixes)[currentStepIndex + 1]
        setStep(nextStep)
        const state = {
            step: nextStep,
            memberId: (paramUser || user).userInfos.id,
            user: paramUser || user
        }
        history.pushState(state, '')
        localStorage.setItem('state', JSON.stringify(state))
    }
    let stepView
    if (step === STEP.whichMember) {
        stepView = <WhichMemberScreen
            users={props.users}
            setUser={(user) => {
                setUser(user)
                next([STEP.whichMember, STEP.showMember], user)
            }}
        />
    } else if (step === STEP.showMember) {
        stepView = <MemberComponent
            {...user}
            startFix={startFix}/>
    }
    
    else if (step === STEP.updateEndDate) {
        stepView = <UpdateEndDateScreen
            user={user}
            next={next} />
    } else if (step === STEP.waitingForDateToBeUpdated) {
        stepView = <><p>La date est en cours d'update, elle devrait être mise à jour d'ici 15 minutes</p>
        {noEmail &&
            <p>Une fois qu'elle sera a jour tu pourras recréer un email pour {user.userInfos.fullname}</p>
        }</>
    } else if (step === STEP.createEmail) {
        stepView = <CreateEmailScreen
            secondaryEmail={user.secondaryEmail}
            next={next}
            user={user} />
    } else if (step === STEP.accountPendingCreation) {
        stepView = <AccountPendingCreationScreen next={next} user={user} />
    } else if (step === STEP.everythingIsGood) {
        stepView = <p>Tout semble régler pour {user.userInfos.fullname} :)</p>
    }
    return <div className="container container-small">
        <div className="panel margin-top-m" style={{ minHeight: 500 }}>
            { step !== STEP.whichMember && <a onClick={() => goBack()}>Retour</a>}
            {stepView}
        </div>
    </div>
})

hydrateOnClient(WhatIsGoingOnWithMember) // force one hydration on client
