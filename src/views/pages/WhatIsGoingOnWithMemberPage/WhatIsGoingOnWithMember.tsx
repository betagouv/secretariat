import React from 'react'
import DatepickerSelect from '../components/DatepickerSelect'
import { PageLayout } from '../components/PageLayout';

import MemberSelect from "../components/MemberSelect"
import { StartupInfo } from '@/models/startup';
import { Member } from '@/models/member';
import { CommuneInfo } from '@/models/communeInfo';
import { Option } from '@/models/misc';
import { hydrateOnClient } from '../../hydrateOnClient';
import axios from 'axios';
import routes from '@/routes/routes';

enum STEP {
    whichMember = 'whichMember',
    updateEndDate = 'updateEndDate',
    createEmail = 'createEmail',
    waitingForDateToBeUpdated = "waitingForDateToBeUpdated",
    accountPendingCreation = "accountPendingCreation",
    everythingIsGood = "everythingIsGood"
}

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
    isExpired,
    userInfos,
    primaryEmailStatus,
    startFix
}) {
    const steps = []
    const showSteps = (!!isExpired || !emailInfos || primaryEmailStatus === 'suspendu' || (!emailInfos && !!emailInfos.isBlocked))
    if (!!isExpired) {
        steps.push('changeDate')
    }
    if (!emailInfos) {
        steps.push('recreateEmail')
    }
    if (primaryEmailStatus === 'suspendu' || !!emailInfos && !!emailInfos.isBlocked) {
        steps.push('changePassword')
    }    
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
                {!emailInfos && <li>Re-créer son email beta</li>}
                {primaryEmailStatus === 'suspendu' && <li>changer son mot de passe pour réactiver son email</li>}
                {!!emailInfos && !!emailInfos.isBlocked && <li>L'email est bloqué pour cause de spam, il faut le réactiver en changeant le mot de passe</li>}
            </ol>
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
            <button className="button" onClick={startFix} role="button">Commencer la procédure - étape 1 : {steps[0]}</button>
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
    console.log(props.user)
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
        <button className="button" onClick={() => props.next(STEP.everythingIsGood)}>C'est bon l'email a été envoyé</button>
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
        console.log('CALL CHECK PR CHANGES ARE applied')
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
            <button className={'button'} onClick={() => props.next(STEP.createEmail)}>Passer à l'étape suivante</button>
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
            { !!memberInfo && <MemberComponent {...memberInfo} startFix={props.startFix}/>
            }
        </>
}

export const CreateEmailScreen = function(props) {
    const [emailValue, setEmailValue] = React.useState(props.secondaryEmail)
    const createEmail = async () => {
        try {
            const api = routes.USER_CREATE_EMAIL.replace(':username', props.user.userInfos.id)
            const res = await axios.post(api, {
                to_email: emailValue
            })
            if (res.status === 200) {
                props.next(STEP.accountPendingCreation)
            } else {
                throw new Error('Email was not created')
            }
        } catch(e) {
            console.error(e)
            alert('Un erreur est survenue')
        }
    }
    return <div><h2>Tu peux créer un compte mail pour {props.user.userInfos.fullname}.</h2>
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
    </div>
}

export const WhatIsGoingOnWithMember = PageLayout(function (props: Props) {
    const [step, setStep] = React.useState(STEP.whichMember)
    const [fixes, setFixes] = React.useState([])
    const [user, setUser] = React.useState(undefined)
    const noEmail = 'noEmail'

    function startFix(fixeItems) {
        setFixes(fixeItems)
        setStep(STEP.updateEndDate)
    }
    function next(step) {
        setStep(step)
    }
    let stepView
    if (step === STEP.whichMember) {
        stepView = <WhichMemberScreen
            users={props.users}
            startFix={startFix}
            setUser={setUser}
        />
    } else if (step === STEP.updateEndDate) {
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
            {stepView}
        </div>
    </div>
})

hydrateOnClient(WhatIsGoingOnWithMember) // force one hydration on client
