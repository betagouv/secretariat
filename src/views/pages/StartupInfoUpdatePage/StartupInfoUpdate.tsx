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
    pitch?: string;
    stats_url?: string;
    website?: string,
    dashlord_url?: string,
    github?: string
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
    startup: StartupInfo,
    formValidationErrors: any,
    startupOptions: {
        value: string,
        label: string
    }[],
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
    const [phase, setPhase] = React.useState('')
    const [date, setDate] = React.useState((new Date()))
    const [text, setText] = React.useState('')
    const [website, setWebsite] = React.useState(props.formData.website)
    const [repository, setRepository] = React.useState(props.formData.github)
    const [pitch, setPitch] = React.useState(props.formData.pitch)
    const [stats_url, setStatsUrl] = React.useState(props.formData.stats_url)
     const [dashlord_url, setDashlord] = React.useState(props.formData.dashlord_url)

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
        axios.post(routes.STARTUP_POST_INFO_UPDATE_FORM.replace(':startup', props.startup.id), {
            phase,
            date,
            text,
            website,
            dashlord_url,
            pitch,
            stats_url,
            repository
        }).then(() => {
            window.location.replace(`/startups/${props.startup.id}`);
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

    function hasChanged() {
        return (((!phase || phase === getCurrentPhase(props.startup)) &&
            (!text || text === decodeURIComponent(props.startup.attributes.content_url_encoded_markdown)) &&
            website === props.formData.website &&
            dashlord_url === props.formData.dashlord_url &&
            stats_url === props.formData.stats_url &&
            pitch === props.formData.pitch &&
            repository === props.formData.github
        ))
    }
    let disabled = false
    if (hasChanged()) {
        disabled = true
    }
    return (
        <>
            <div className="module">
            <div>
                <small>
                    <a href="/startups">Produit</a> &gt; <a href={`/startups/${props.startup.id}`}>{props.startup.id}</a> &gt; <a href="">Mise à jour de la phase</a>
                </small>
            </div>
            <div className="margin-top-m"></div>
            <div className="panel">
                    <h3>Mise à jour des informations de {props.startup.attributes.name}</h3>
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
                        {props.startup && <>

                            <form className='no-margin' onSubmit={save}>
                                <h5>Phases : </h5>
                                <div style={{ borderTop: '1px solid #ccc', paddingBottom: 10, paddingTop: 10}}>
                                    <p>
                                        <b>Phase inscrite sur la fiche:</b> { PHASE_READABLE_NAME[getCurrentPhase(props.startup)]}
                                    </p>
                                {!showAddPhase  && <a onClick={() => toggleShowAddPhase(true)}>{`Changer la phase actuelle`}</a>}
                                {showAddPhase && <>
                                <div style={{ border: '1px solid #ccc', padding: 10, position: 'relative' }}><div className="form__group">
                                    <div style={{ position: 'absolute', top: -10, right: -5 }}>
                                        <a style={{ textDecoration: 'none' }} onClick={() => toggleShowAddPhase(false)}>❌</a>
                                    </div>
                                    <label htmlFor="startup">
                                        <strong>Dans quelle phase se trouve {props.startup.attributes.name} actuellement ?</strong><br />
                                    </label>
                                    <SEPhaseSelect
                                        onChange={(phase) => {
                                            setPhase(phase.value)
                                        }}
                                        defaultValue={getCurrentPhase(props.startup)}
                                        isMulti={false}
                                        placeholder={"Selectionne la phase"}
                                    />
                                    { phase && phase === getCurrentPhase(props.startup) && 
                                        <p className="text-small text-color-red">{props.startup.attributes.name} est déjà en {PHASE_READABLE_NAME[phase]}</p>
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
                                <h5>Url du site : </h5>
                                <div className="form__group">
                                    <input name="website"
                                    onChange={(e) => { setWebsite(e.currentTarget.value)}}
                                    value={website}/>
                                </div>
                                <h5>Lien du repo github : </h5>
                                <div className="form__group">
                                    <input name="github"
                                    onChange={(e) => { setRepository(e.currentTarget.value)}}
                                    value={repository}/>
                                </div>
                                <h5>Lien du dashlord : </h5>
                                <div className="form__group">
                                    <input name="dashlord"
                                    onChange={(e) => { setDashlord(e.currentTarget.value)}}
                                    value={dashlord_url}/>
                                </div>
                                <h5>Lien de la page stats : </h5>
                                <div className="form__group">
                                    <input name="stats_url"
                                    onChange={(e) => { setStatsUrl(e.currentTarget.value)}}
                                    value={stats_url}/>
                                </div>
                                <h5>Pitch : </h5>
                                <div className="form__group">
                                    <textarea name="pitch"
                                    onChange={(e) => { setPitch(e.currentTarget.value)}}
                                    value={pitch}/>
                                </div>                                
                                <h5>Description du produit : </h5>
                                <div className="form__group" style={{ borderTop: '1px solid #ccc', paddingBottom: 10, paddingTop: 10 }}>
                                    <ClientOnly>
                                        <MdEditor
                                            defaultValue={decodeURIComponent(props.startup.attributes.content_url_encoded_markdown)}
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
