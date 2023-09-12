import React from 'react';
import { PHASES_ORDERED_LIST, PHASE_READABLE_NAME, Phase, StartupInfo, StartupPhase } from '@/models/startup';
import SEPhaseSelect from './SEPhaseSelect';
import DatepickerSelect from './DatepickerSelect';
import { ClientOnly } from './ClientOnly';
import MdEditor from 'react-markdown-editor-lite';
import MarkdownIt from 'markdown-it';
import SEAsyncIncubateurSelect from './SEAsyncIncubateurSelect';
import SESponsorSelect from './SESponsorSelect';

// import style manually
const mdParser = new MarkdownIt(/* Markdown-it options */);


interface StartupForm {
    sponsors?: {
        value: string,
        label: string
    }[];
    incubator?: string;
    mission?: string;
    stats_url?: string;
    link?: string,
    dashlord_url?: string,
    repository?: string,
    content: string,
    save: any,
    phases?: Phase[], 
    startup: StartupInfo
}

interface FormErrorResponse {
    errors?: Record<string,string[]>
    message: string
}

function getCurrentPhase(startup : StartupInfo) {
    if (!startup) {
        return
    }
    return startup.attributes.phases ? startup.attributes.phases[startup.attributes.phases.length - 1].name : undefined
}

/* Pure component */
export const StartupForm = (props: StartupForm) => {
    // const [phase, setPhase] = React.useState('')
    const [date, setDate] = React.useState((new Date()))
    const [text, setText] = React.useState('')
    const [startupName, setStartupName] = React.useState('')
    const [link, setLink] = React.useState(props.link)
    const [repository, setRepository] = React.useState(props.repository)
    const [mission, setMission] = React.useState(props.mission)
    const [sponsors, setSponsors] = React.useState(props.sponsors || [])
    const [incubator, setIncubator] = React.useState(props.incubator)
    const [stats_url, setStatsUrl] = React.useState(props.stats_url)
    const [dashlord_url, setDashlord] = React.useState(props.dashlord_url)
    const [phases, setPhases] = React.useState(props.phases || [])

    const [showAddPhase, setShowAddPhase] = React.useState(false)
    const [errorMessage, setErrorMessage] = React.useState('');
    const [formErrors, setFormErrors] = React.useState({});
    const [isSaving, setIsSaving] = React.useState(false)


    const save = async (event) => {
        if (isSaving) {
            return
        }
        event.preventDefault();
        setIsSaving(true)
        const data = {
            phases,
            date,
            text,
            link,
            dashlord_url,
            mission,
            startup: startupName,
            incubator,
            sponsors: sponsors.map(sponsor => sponsor.value),
            stats_url,
            repository
        }
        props.save(data).catch((error) => {
            console.log(error)
            // const ErrorResponse : FormErrorResponse = data
            // setErrorMessage(ErrorResponse.message)
            setIsSaving(false)
            // if (ErrorResponse.errors) {
            //     setFormErrors(ErrorResponse.errors)
            // }
        })
    }

    function addPhase() {
        const previousPhase : StartupPhase = phases[phases.length - 1].name
        const previousPhaseIndex = PHASES_ORDERED_LIST.findIndex((value) => value === previousPhase)
        const nextPhase = PHASES_ORDERED_LIST[previousPhaseIndex+1]

        const previousPhaseDate = phases[phases.length - 1].end || new Date()
        setPhases([...phases, { start: previousPhaseDate, name: nextPhase}])
    }

    function deletePhase(index) {
        const newPhases = [...phases];
        newPhases.splice(index, 1)
        setPhases([...newPhases])
    }

    function changePhase(index, phase) {
        const newPhases = [...phases]
        newPhases[index] = phase
        setPhases([...newPhases])
    }

    function handleEditorChange({ html, text }) {
        setText(text);
    }

    function hasChanged() {
        return ((props.startup && (!phases || phases === props.phases) &&
            (!text || text === decodeURIComponent(props.content)) &&
            link === props.link &&
            dashlord_url === props.dashlord_url &&
            stats_url === props.stats_url &&
            mission === props.mission &&
            repository === props.repository &&
            incubator === props.incubator &&
            sponsors === props.sponsors
        ))
    }
    let disabled = false
    
    if (hasChanged()) {
        disabled = true
    }
    return (
        <>
        <div>
            { !!errorMessage && 
                <p className="text-small text-color-red">{errorMessage}</p>
            }
            {<>

                <form className='no-margin' onSubmit={save}>
                    {!props.startup && <>
                        <h5>Nom du produit : </h5>
                        <div className="form__group">
                            <input name="startup"
                            onChange={(e) => { setStartupName(e.currentTarget.value)}}
                            value={startupName}/>
                        </div>
                    </>}
                    <h5>Mission : </h5>
                    <div className="form__group">
                        <textarea name="Mission"
                        onChange={(e) => { setMission(e.currentTarget.value)}}
                        value={mission}/>
                    </div>                                
                    <h5>Description du produit : </h5>
                    <div className="form__group" style={{ borderTop: '1px solid #ccc', paddingBottom: 10, paddingTop: 10 }}>
                        <ClientOnly>
                            <MdEditor
                                defaultValue={decodeURIComponent(props.content)}
                                style={{ height: '500px' }}
                                renderHTML={text => mdParser.render(text)} onChange={handleEditorChange} />
                        </ClientOnly>
                    </div>
                    <h5>Url du site : </h5>
                    <div className="form__group">
                        <input name="link"
                        onChange={(e) => { setLink(e.currentTarget.value)}}
                        value={link}/>
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
                    <h5>Incubateurs : </h5>
                    <div className="form__group">
                        <SEAsyncIncubateurSelect
                            value={incubator}
                            onChange={e => {
                                setIncubator(e.value)
                            }} />
                    </div>
                    <h5>Sponsors : </h5>
                    <div className="form__group">
                        <SESponsorSelect
                            value={sponsors}
                            onChange={sponsors => {
                                setSponsors(sponsors)}
                            } />
                    </div> 
                    <h5>Phases : </h5>
                    <div style={{ borderTop: '1px solid #ccc', paddingBottom: 10, paddingTop: 10}}>
                        <p>
                            Voici l'historique des phases dans lesquelles a été ce produit.
                        </p>
                    {phases.map((phase, index) => <PhaseItem
                        end={phase.end}
                        start={phase.start}
                        name={phase.name}
                        onChange={(phase) => changePhase(index, phase)}
                        deletePhase={() => deletePhase(index)}
                        key={index}/>
                    )}
                    {!showAddPhase  && <a onClick={() => addPhase()}>{`Ajouter une phase`}</a>}
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
    </>
    )
}

interface PhaseItemProps extends Phase {
    deletePhase(): void,
    onChange(phase: Phase): void
}

const PhaseItem = ({ name, start, end, deletePhase, onChange } : PhaseItemProps) => {
    const [startDate, setStartDate] : [Date, (Date) => void] = React.useState(start ? new Date(start) : undefined)
    const [endDate, setEndDate] : [Date, (Date) => void] = React.useState(end ? new Date(end) : undefined)
    const [phase, setPhase] = React.useState(name)
    React.useEffect(() => {
        onChange({
            name: phase,
            start: startDate,
            end: endDate
        })
    }, [phase, startDate, endDate])
    return <>
        <div style={{ border: '1px solid #ccc', padding: 10, position: 'relative', marginBottom: 10 }}><div className="form__group">
            <div style={{ position: 'absolute', top: -10, right: -5 }}>
                <a style={{ textDecoration: 'none' }}
                onClick={() => deletePhase()}
                >❌</a>
            </div>
            <label htmlFor="startup">
                <strong>Phase</strong><br />
            </label>
            <SEPhaseSelect
                onChange={(phase) => {
                    setPhase(phase.value)
                }}
                defaultValue={name}
                isMulti={false}
                placeholder={"Selectionne la phase"}
            />
            {/* { props.startup && phase && phase === getCurrentPhase(props.startup) && 
                <p className="text-small text-color-red">{props.startup.attributes.name} est déjà en {PHASE_READABLE_NAME[phase]}</p>
            } */}
        </div>
        <div className="form__group">
            <label htmlFor="end">
                <strong>Date de début de la phase</strong>
            </label>
            {start && <DatepickerSelect
                name="startDate"
                min={'2020-01-31'}
                title="En format YYYY-MM-DD, par exemple : 2020-01-31"
                required
                dateFormat='dd/MM/yyyy'
                selected={startDate}
                onChange={(dateInput:Date) => setStartDate(dateInput)} />}
            {/* { !!formErrors['nouvelle date de début'] && 
                <p className="text-small text-color-red">{formErrors['nouvelle date de début']}</p>
            } */}
        </div>
        {/* <div className="form__group">
            <label htmlFor="end">
                <strong>Date de fin </strong>
            </label>
            <DatepickerSelect
                name="endDate"
                min={'2020-01-31'}
                title="En format YYYY-MM-DD, par exemple : 2020-01-31"
                dateFormat='dd/MM/yyyy'
                selected={endDate}
                required={false}
                onChange={(dateInput:Date) => setEndDate(dateInput)} />
            { !!formErrors['nouvelle date de fin'] && 
                <p className="text-small text-color-red">{formErrors['nouvelle date de fin']}</p>
            }
        </div> */}
        </div></>
}


