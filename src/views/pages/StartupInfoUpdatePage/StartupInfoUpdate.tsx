import React from 'react';
import type { Request } from 'express';

import { hydrateOnClient } from '../../hydrateOnClient'
import { InnerPageLayout } from '../components/InnerPageLayout';
import axios from 'axios';
import { DBPullRequest } from '@/models/pullRequests';
import { PHASE_READABLE_NAME, StartupInfo } from '@/models/startup';
import SEPhaseSelect from '../components/SEPhaseSelect';
import routes from '@/routes/routes';
import DatepickerSelect from '../components/DatepickerSelect';
import { ClientOnly } from '../components/ClientOnly';
import MdEditor from 'react-markdown-editor-lite';
import MarkdownIt from 'markdown-it';

// import style manually
const mdParser = new MarkdownIt(/* Markdown-it options */);

interface StartupInfoFormData {
}

interface StartupInfoUpdateProps {
    title: string,
    currentUserId: string,
    errors: string[],
    messages: string[],
    activeTab: string,
    subActiveTab: string,
    request: Request,
    formData: StartupInfoFormData,
    startupsInfos: StartupInfo[]
    formValidationErrors: any,
    startupOptions: {
        value: string,
        label: string
    }[],
    startup?: string,
    username: string,
    updatePullRequest?: DBPullRequest,
    isAdmin: boolean
}

interface FormErrorResponse {
    errors?: Record<string,string[]>
    message: string
}

function getCurrentPhase(startup : StartupInfo) {
    return startup.attributes.phases ? startup.attributes.phases[startup.attributes.phases.length - 1].name : undefined
}

/* Pure component */
export const StartupInfoUpdate = InnerPageLayout((props: StartupInfoUpdateProps) => {
    const [startup] = React.useState(props.startup)
    const [phase, setPhase] = React.useState('')
    const [date, setDate] = React.useState((new Date()))
    const [text, setText] = React.useState('')
    const [showAddPhase, setShowAddPhase] = React.useState(false)

    const [formErrors, setFormErrors] = React.useState({});
    const [errorMessage, setErrorMessage] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false)
    const css = ".panel { overflow: hidden; width: auto; min-height: 100vh; }"

    const save = async (event) => {
        if (isSaving) {
            return
        }
        event.preventDefault();
        setIsSaving(true)
        axios.post(routes.STARTUP_POST_INFO_UPDATE_FORM.replace(':startup', startup), {
            phase,
            date,
            text
        }).then(() => {
            window.location.replace(`/startups/${startup}`);
        }).catch(({ response: { data }} : { response: { data: FormErrorResponse }}) => {
            const ErrorResponse : FormErrorResponse = data
            setErrorMessage(ErrorResponse.message)
            setIsSaving(false)
            if (ErrorResponse.errors) {
                setFormErrors(ErrorResponse.errors)
            }
        })
    }

    function toggleShowAddPhase(showPhase) {
        setShowAddPhase(showPhase)
        if (!showPhase) {
            setPhase('')
        }
    }

    function handleEditorChange({ html, text }) {
        setText(text);
    }
    let disabled = false
    const startupInfo : StartupInfo = startup ? props.startupsInfos.find(s => s.id === startup) : null
    if ((startupInfo && ((!phase || phase === getCurrentPhase(startupInfo)) && text === decodeURIComponent(startupInfo.attributes.content_url_encoded_markdown))) || (!phase && !text)) {
        disabled = true
    }
    return (
        <>
            <div className="module">
            <div>
                <small>
                    <a href="/startups">Produit</a> &gt; <a href={`/startups/${props.startup}`}>{props.startup}</a> &gt; <a href="">Mise à jour de la phase</a>
                </small>
            </div>
            <div className="margin-top-m"></div>
            <div className="panel">
                    <h3>Mise à jour des informations de {startupInfo.attributes.name}</h3>
                    { !!props.updatePullRequest && <div className="notification">
                            ⚠️ Une pull request existe déjà sur cette startup. Quelqu'un doit la merger pour que le changement soit pris en compte.
                            <a href={props.updatePullRequest.url} target="_blank">{props.updatePullRequest.url}</a>
                            <br/>(la prise en compte peut prendre 10 minutes.)
                        </div>
                    }
                    { !!errorMessage && 
                        <p className="text-small text-color-red">{errorMessage}</p>
                    }
                    <div className="beta-banner"></div>
                    <div>
                        {startupInfo && <>

                            <form className='no-margin' onSubmit={save}>
                                <h5>Phases : </h5>
                                <div style={{ borderTop: '1px solid #ccc', paddingBottom: 10, paddingTop: 10}}>
                                    <p>
                                        <b>Phase inscrite sur la fiche:</b> { PHASE_READABLE_NAME[getCurrentPhase(startupInfo)]}
                                    </p>
                                {!showAddPhase  && <a onClick={() => toggleShowAddPhase(true)}>{`Changer la phase actuelle`}</a>}
                                {showAddPhase && <>
                                <div style={{ border: '1px solid #ccc', padding: 10, position: 'relative' }}><div className="form__group">
                                    <div style={{ position: 'absolute', top: -10, right: -5 }}>
                                        <a style={{ textDecoration: 'none' }} onClick={() => toggleShowAddPhase(false)}>❌</a>
                                    </div>
                                    <label htmlFor="startup">
                                        <strong>Dans quelle phase se trouve {startupInfo.attributes.name} actuellement ?</strong><br />
                                    </label>
                                    <SEPhaseSelect
                                        onChange={(phase) => {
                                            setPhase(phase.value)
                                        }}
                                        defaultValue={getCurrentPhase(startupInfo)}
                                        isMulti={false}
                                        placeholder={"Selectionne la phase"}
                                    />
                                    { phase && phase === getCurrentPhase(startupInfo) && 
                                        <p className="text-small text-color-red">{startupInfo.attributes.name} est déjà en {PHASE_READABLE_NAME[phase]}</p>
                                    }
                                </div>
                                <div className="form__group">
                                    <label htmlFor="end">
                                        <strong>Depuis quand ?</strong>
                                        <i>Au format JJ/MM/YYYY</i>
                                    </label>
                                    <DatepickerSelect
                                        name="endDate"
                                        min={'2020-01-31'}
                                        title="En format YYYY-MM-DD, par exemple : 2020-01-31" required
                                        dateFormat='dd/MM/yyyy'
                                        selected={date}
                                        onChange={(dateInput:Date) => setDate(dateInput)} />
                                    { !!formErrors['nouvelle date de fin'] && 
                                        <p className="text-small text-color-red">{formErrors['nouvelle date de fin']}</p>
                                    }
                                </div></div></>}
                                </div>
                                <h5>Description du produit : </h5>
                                <div className="form__group" style={{ borderTop: '1px solid #ccc', paddingBottom: 10, paddingTop: 10 }}>
                                    <ClientOnly>
                                        <MdEditor
                                            defaultValue={decodeURIComponent(startupInfo.attributes.content_url_encoded_markdown)}
                                            style={{ height: '500px' }}
                                            renderHTML={text => mdParser.render(text)} onChange={handleEditorChange} />
                                    </ClientOnly>
                                </div>
                                <input
                                    type="submit"
                                    disabled={isSaving || disabled}
                                    value={isSaving ? `Enregistrement en cours...` : `Enregistrer`}
                                    className="button"
                                />
                            </form>
                        </>}
                    </div>
                </div>
            </div>
            <style media="screen">
                {css}
            </style>
        </>
    )
})

hydrateOnClient(StartupInfoUpdate)
