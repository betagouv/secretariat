import React from 'react'

import DatepickerSelect from '../components/DatepickerSelect'
import { InnerPageLayout } from '../components/InnerPageLayout';
import { hydrateOnClient } from '../../hydrateOnClient';
import axios from 'axios';
import routes from '@/routes/routes';

enum STEP {
    infoScreen = "infoScreen",
    welcomeScreen = "welcomeScreen",
    documentScreen = "documentScreen",
    finalScreen = "finalScreen"
}

interface FormErrorResponse {
    errors?: Record<string,string[]>
    message: string
}

interface Props {
    title: string,
    currentUserId: string,
    errors: string[],
    messages: string[],
    activeTab: string,
    request: Request,
    formData: FormData,
    formValidationErrors: any,
    startups: string[],
    isAdmin: boolean,
    firstName: string,
    lastName: string,
    attributaire: string,
    endDate: Date,
}

export const WelcomeScreen = function(props) {
    return <>
        <h2>Demande de badge</h2>
        <p>Tu t'apprêtes à faire une demande de badge.<br/>Pour demander un badge, il faut que tu viennes au minimum une fois par semaine.</p>
        <p>Sinon tu devras demander un badge invité à chacune des tes venues. Ce sont les régles du batiment Ségur nous n'y pouvont rien.</p>
        <button
            onClick={props.next}
            className="button no-margin">Ok, j'ai compris, je fais une demande de badge</button>
    </>
}

export const DocumentScreen = function(props) {
    return <>
        <h2>Demande de badge</h2>
        <p>Pour faire une demande de badge tu vas devoir envoyer un email à **** avec :</p>
        <ul>
            <li>une photo de ta piéce d'identité</li>
            <li>une photo</li>
            <li>le document généré par l'espace-membre dans l'étape suivante</li>
        </ul>
        <p>Nous t'invitons a t'assurer d'avoir les 2 premiers documents avant de poursuivre</p>
        <button
            onClick={props.next}
            className="button no-margin">Obtenir le document de demande de badge</button>
    </>
}

export const FinalScreen = function(props) {
    const [isSaving, setIsSaving] = React.useState(false)

    function setBadgeIsSent() {
        if (isSaving) {
            return
        }
        setIsSaving(true)
        axios.put(routes.API_UPDATE_BADGE_REQUEST_STATUS, {
            request_id: props.request_id
        }).then((resp) => {
            setIsSaving(false)
            props.setRequestId(resp.data.request_id)
            props.next()
        }).catch((resp) => {
            setIsSaving(false)
        })
    }

    return <>
        <h2>Demande de badge</h2>
        <p>Tu as maintenant le formulaire avec les bonnes infos, pour compléter ton inscription envoie l'email suivant:
        </p>
        <p><b>Destinataire :</b> logistique-dinum@pm.gouv.fr</p>
        <p><b>En copie :</b> adresse.florian@beta.gouv.fr, adresse.secdinum@gouv.fr, espace-membre-badge@beta.gouv.fr</p>
        <p><b>Object :</b> Demande de badge - Externe DINUM - {props.requestId}</p>
        <p><b>Piéces jointes :</b>
            <ul>
                <li>une photo de ta piéce d'identité</li>
                <li>une photo d'identité</li>
                <li>le document généré par l'espace-membre :</li>
            </ul>
        </p>
        <p><b>Message</b>: Bonjour,
            Je sollicite un badge d'accès à Segur dans les locaux 5.413, 5.416, 5.420, 5.425, 5.424, 5.428 ainsi qu'à la cantine.
            Je souhaite y travailler X fois par semaine.
            J'ai rejoins récemment beta.gouv au sein de la DINUM.
            Florian Delezenne, responsable de beta.gouv, est en copie de cet email.

            Bonne journée,

            Prénom Nom</p>
        <button
            onClick={setBadgeIsSent}
            className="button no-margin">C'est bon c'est envoyé</button>
    </>
}


export const InfoScreen = function(props) {
    const [date, setDate] = React.useState(new Date(props.endDate))
    const [firstName, setFirstName] = React.useState(props.firstName)
    const [lastName, setLastName] = React.useState(props.lastName)
    const [attributaire, seAttributaire] = React.useState(props.attributaire)

    const [isSaving, setIsSaving] = React.useState(false)
    const [formErrors, setFormErrors] = React.useState({});
    const [errorMessage, setErrorMessage] = React.useState('');

    function createFile() {
        if (isSaving) {
            return
        }
        setIsSaving(true)
        axios.post(routes.API_POST_BADGE_REQUEST, {
            endDate: date
        }).then((resp) => {
            console.log('LCS CREATE BADGE REQUEST', resp.data.request_id, resp.data)
            setIsSaving(false)
            props.setRequestId(resp.data.request_id)
            props.next()
        }).catch((resp) => {
            setIsSaving(false)
            const ErrorResponse : FormErrorResponse = resp.data
            if (ErrorResponse) {
                setErrorMessage(ErrorResponse.message)
                if (ErrorResponse.errors) {
                    setFormErrors(ErrorResponse.errors)
                }
            }
        })
    }

    const computeMaxDate = () => {
        const date = new Date()
        const maxDays = 365/2 // badge can be issue min 2 weeks after demande
        date.setDate(date.getDate() + maxDays)
        date.toISOString().split('T')[0]
    }

    const computeMinDate = () => {
        const date = new Date()
        const minimalDelay = 14 // badge can be issue min 2 weeks after demande
        date.setDate(date.getDate() + minimalDelay)
        date.toISOString().split('T')[0]
    }

    return <>
        <h2>Demande de badge</h2>
        <p>Ce formulaire va te permettre de produire le fichier a envoyer par email à l'adresse : accompagné de ta piéce d'identité et d'une photo de ta carte d'identité.</p>
        <div className="no-margin">
            { !!errorMessage && 
                <p className="text-small text-color-red">{errorMessage}</p>
            }
            <label htmlFor="firstName">
                <strong>Prénom (obligatoire)</strong>
            </label>
            <input name="firstName" 
                defaultValue={firstName}
                onChange={(e) => { setFirstName(e.currentTarget.value)}}
                required/>
            <label htmlFor="lastName">
                <strong>Nom de famille (obligatoire)</strong>
            </label>
            <input name="lastName" 
                defaultValue={lastName}
                onChange={(e) => { setLastName(e.currentTarget.value)}}
                required/>
            <label htmlFor="lastName">
                <strong>Entreprise qui te porte (obligatoire)</strong>
            </label>
            <input name="attributaire" 
                defaultValue={attributaire}
                onChange={(e) => { seAttributaire(e.currentTarget.value)}}
                required/>
            <br/>
            <br/>
            <div className="form__group">
                <label htmlFor="end">
                    <strong>Date de fin de badge</strong><br />
                    Pas plus d'un an, tu devras un renouvellement quand cette date arrive à la fin, nous t'enverrons un message de rappel<br />
                    <i>Au format JJ/MM/YYYY</i>
                </label>
                <DatepickerSelect
                    name="endDate"
                    min={computeMinDate()}
                    max={computeMaxDate()}
                    title="En format YYYY-MM-DD, par exemple : 2020-01-31" required
                    dateFormat='dd/MM/yyyy'
                    selected={date}
                    onChange={(date:Date) => setDate(date)} />
                { !!formErrors['nouvelle date de fin'] && 
                    <p className="text-small text-color-red">{formErrors['endDate']}</p>
                }
            </div>
            <div className="form__group">
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'}}>
                    <button
                        onClick={createFile}
                        disabled={isSaving}
                        className="button no-margin"
                        type="submit">Télécharger le fichier de demande de badge</button>
                </div>
            </div>
        </div>
    </>
}

export const Badge = InnerPageLayout(function (props: Props) {
    const [step, setStep] = React.useState(STEP.welcomeScreen)
    const [fixes] = React.useState([STEP.welcomeScreen, STEP.documentScreen, STEP.infoScreen, STEP.finalScreen])
    const [requestId, setRequestId] = React.useState()

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
    let stepView
    
    if (step === STEP.infoScreen) {
        stepView = <InfoScreen
            firstName={props.firstName}
            lastName={props.lastName}
            endDate={props.endDate}
            attributaire={props.attributaire}
            setRequestId={setRequestId}
            next={next} />
    } else if (step === STEP.welcomeScreen) {
        stepView = <WelcomeScreen next={next}></WelcomeScreen>
    } else if (step === STEP.documentScreen) {
        stepView = <DocumentScreen next={next}></DocumentScreen>
    } else if (step === STEP.finalScreen) {
        stepView = <FinalScreen requestId={requestId}></FinalScreen>
    }

    return <div className="container container-small">
        <div className="panel margin-top-m" style={{ minHeight: 500 }}>
            { step !== STEP.welcomeScreen && <a onClick={() => goBack()}>Retour</a>}
            {stepView}
        </div>
    </div>
})

hydrateOnClient(Badge) // force one hydration on client
