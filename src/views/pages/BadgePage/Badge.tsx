import React from 'react'

import { InnerPageLayout } from '../components/InnerPageLayout';
import { hydrateOnClient } from '../../hydrateOnClient';
import axios from 'axios';
import routes from '@/routes/routes';
import { BadgeDossier } from '@/models/badgeDemande';
import { BadgeRequest } from '@/models/badgeRequests';

enum STEP {
    infoScreen = "infoScreen",
    welcomeScreen = "welcomeScreen",
    documentScreen = "documentScreen",
    finalScreen = "finalScreen"
}

interface Props {
    title: string,
    currentUserId: string,
    dossier: BadgeDossier,
    errors: string[],
    messages: string[],
    activeTab: string,
    request: Request,
    formData: FormData,
    badgeRequest: BadgeRequest,
    formValidationErrors: any,
    startups: string[],
    isAdmin: boolean,
    firstName: string,
    lastName: string,
    attributaire: string,
    endDate: Date,
    primaryEmail: string
}

const STATUS = {
    'En attente de traitement': {
        status: `En attente de traitement`,
        description: `La demande est en attente de traitement. Tu recevras un email quand la demande sera traitée côté DINUM`
    },
    '': {
        status: `En attente de traitement`,
        description: `La demande est en attente de traitement. Tu recevras un email quand la demande sera traitée côté DINUM`
    },
    'En attente de validation par responsable incubateur': {
        status: `En attente de validation par le responsable d'incubateur`,
        description: `Ta demande a été traitée côté DINUM et en attente de validation par le responsable d'incubateur.`
    },
    'En attente de création par bureau des badges': {
        status: `En attente du bureau des badges`,
        description: `Ta demande a été validée par le responsable d'incubateur et commandé auprès du bureau des badges.`
    },
    'En attente de récupération': {
        status: `En attente de récupération`,
        description: `Tu peux aller chercher ton badge au bureau des badges qui est en attente de récupération.`
    },
    'Récupéré': {
        status: `Récupéré`,
        description: `Tu as récupéré ton badge.`
    },
    'Formulaire non valide': {
        status: `Formulaire non valide`,
        description: `Ton formulaire est non valide tu as du recevoir un message dans tes emails.`
    }
}

export const WelcomeScreen = function(props) {
    const [isSaving, setIsSaving] = React.useState(false)

    function askForBadge() {
        if (props.dossier || props.badgeRequest) {
            props.next()
        } else {
            if (isSaving) {
                return
            }
            setIsSaving(true)
            axios.post(routes.API_POST_BADGE_REQUEST).then((resp) => {
                setIsSaving(false)
                props.setDSToken(resp.data.dossier_token)
                props.next()
            }).catch((resp) => {
                setIsSaving(false)
            })
        }
    }

    return <>
        <h2>Demande de badge</h2>
        <p>Tu t'apprêtes à faire une demande de badge.<br/>Pour demander un badge, il faut que tu viennes au minimum une fois par semaine.</p>
        <p>Sinon tu devras demander un badge invité à chacune des tes venues. Ce sont les régles du batiment Ségur nous n'y pouvont rien.</p>

        <p>Pour faire une demande de badge il te faut les document suivants:</p>
        <ul>
            <li>une photo de ta piéce d'identité</li>
            <li>une photo d'identité</li>
        </ul>
        <button
            onClick={askForBadge}
            className="button no-margin">Faire la demande de badge</button>
    </>
}

export const Badge = InnerPageLayout(function (props: Props) {
    const [step, setStep] = React.useState((props.badgeRequest || props.dossier) ? STEP.documentScreen : STEP.welcomeScreen)
    const [fixes] = React.useState([STEP.welcomeScreen, STEP.documentScreen])
    const [dsToken, setDSToken] = React.useState(props.badgeRequest ? props.badgeRequest.ds_token : null)

    function goBack() {
        const currentStepIndex = fixes.findIndex(s => s === step)
        const previousStep = fixes[currentStepIndex - 1] || STEP.welcomeScreen
        setStep(previousStep)
    }

    function next() {
        const currentStepIndex = fixes.findIndex(s => s === step)
        const nextStep = fixes[currentStepIndex + 1]
        setStep(nextStep)
        const state = {
            step: nextStep
        }
        history.pushState(state, '')
    }

    function getStatus(dossier) {
        const status = dossier.annotations.find(annotation => annotation.label === 'Status').stringValue
        console.log(status)
        return <>
            <p><b>Statut du badge :</b>{STATUS[status].status}</p>
            <p>{STATUS[status].description}</p>
        </>
    }

    let stepView
    
    if (step === STEP.welcomeScreen) {
        stepView = <WelcomeScreen
            setDSToken={setDSToken}
            next={next}
            dossier={props.dossier}
            badgeRequest={props.badgeRequest}/>
    } else {
        stepView = <><h2>Demande de badge</h2>
        {(dsToken && !props.dossier) && <>
            <p>Votre démarche a été préremplie, vous pouvez maintenant cliquer sur le bouton ci-dessous pour la terminer.</p>
            <p>⚠️ Veillez à respecter les règles suivantes :</p>
            <ul>
                <li>Le compte à utiliser pour remplir la demande doit être lié à votre adresse : {props.primaryEmail}</li>
                <li>La date de fin de votre badge a été préremplie, si vous la changez, mettez maximum 1 an </li>
            </ul>
            <a
            className='button'
            target={'_blank'}
            href={`https://www.demarches-simplifiees.fr/commencer/demande-de-badge-segur?prefill_token=${dsToken}`}>
                J'ai compris. Poursuivre la démarche sur démarches-simplifiees.fr
            </a>    
        </>}
        {props.dossier && <>
            <p>{getStatus(props.dossier)}</p>
        </>}</>
    }
    return <div className="container">
        {(props.dossier && props.dossier.state === 'accepte') && <div className="panel margin-top-m" style={{ minHeight: 500 }}>
            <h2>Badge</h2>
            <p><b>Date de fin de validité du badge :</b> {props.dossier.champs.find(c => c.label === 'Date de fin de mission').stringValue}</p>
        </div>}
        {(!props.dossier || props.dossier.state !== 'accepte') && <div className="panel margin-top-m" style={{ minHeight: 500 }}>
            { step !== STEP.welcomeScreen && <a onClick={() => goBack()}>Retour</a>}
            {stepView}
        </div>}
    </div>
})

hydrateOnClient(Badge) // force one hydration on client
