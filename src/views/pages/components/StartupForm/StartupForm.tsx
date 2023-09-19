import React from 'react';
import { PHASES_ORDERED_LIST, Phase, StartupInfo, StartupPhase } from '@/models/startup';
import { ClientOnly } from '../ClientOnly';
import MdEditor from 'react-markdown-editor-lite';
import MarkdownIt from 'markdown-it';
import SEAsyncIncubateurSelect from '../SEAsyncIncubateurSelect';
import SponsorBlock from './SponsorBlock';
import PhaseItem from './PhaseItem';

// import style manually
const mdParser = new MarkdownIt(/* Markdown-it options */);

const DEFAULT_CONTENT = `Pour t'aider dans la rédaction de ta fiche produit, nous te recommandons de suivre ce plan: 

## Contexte

Quel est le contexte de ta Startup d'Etat ?

## Problème

Les problèmes que vous avez identifiés ou vos hypothèses de problèmes? Qui en souffre ? quels sont les conséquences de ces problèmes ?

## Solution

Décrit ta solution en quelques lignes? qui seront/sont les bénéficiaires ?

## Stratégie

Comment vous vous y prenez pour atteindre votre usagers ? quel impact chiffré visez-vous ?
`

interface StartupForm {
    sponsors?: string[];
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

const blobToBase64 = async blob => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise(resolve => {
    reader.onloadend = () => {
        resolve(reader.result);
    };
    });
};

/* Pure component */
export const StartupForm = (props: StartupForm) => {
    const [text, setText] = React.useState(decodeURIComponent(props.content) || '')
    const [title, setTitle] = React.useState('')
    const [link, setLink] = React.useState(props.link)
    const [repository, setRepository] = React.useState(props.repository)
    const [mission, setMission] = React.useState(props.mission)
    const [sponsors, setSponsors] = React.useState(props.sponsors || [])
    const [newSponsors, setNewSponsors] = React.useState([])
    const [incubator, setIncubator] = React.useState(props.incubator)
    const [stats_url, setStatsUrl] = React.useState(props.stats_url)
    const [dashlord_url, setDashlord] = React.useState(props.dashlord_url)
    const [selectedFile, setSelectedFile] : [undefined | File, (File) => void] = React.useState()
    const [phases, setPhases] = React.useState(props.phases || [{
        name: StartupPhase.PHASE_INVESTIGATION,
        start: new Date()
    }])
    const [errorMessage, setErrorMessage] = React.useState('');
    const [formErrors, setFormErrors] = React.useState({});
    const [isSaving, setIsSaving] = React.useState(false)

    const onFileChange = event => {
        // Update the state
        setSelectedFile(event.target.files[0]);
 
    };

    // File content to be displayed after
    // file upload is complete
    const fileData = () => {
    
        if (selectedFile) {
    
            return (
                <div>
                    <h2>File Details:</h2>
                    <p>File Name: {selectedFile.name}</p>
    
                    <p>File Type: {selectedFile.type}</p>
    
                </div>
            );
        } else {
            return (
                <div>
                    <br />
                    <h4>Choose before Pressing the Upload button</h4>
                </div>
            );
        }
    };


    const save = async (event) => {
        if (isSaving) {
            return
        }
        event.preventDefault();
        setIsSaving(true)
        let data = {
            phases,
            text,
            link,
            dashlord_url,
            mission,
            title,
            incubator,
            newSponsors: newSponsors,
            sponsors: sponsors,
            stats_url,
            repository,
            image: ''
        }
        if (selectedFile) {
            const imageAsBase64 = await blobToBase64(selectedFile)
            data = {
                ...data,
                image: imageAsBase64 as string
            }
        }
        props.save(data).catch(({ response: { data }} : { response: { data: FormErrorResponse }}) => {
            const ErrorResponse : FormErrorResponse = data
            setErrorMessage(ErrorResponse.message)
            setIsSaving(false)
            if (ErrorResponse.errors) {
                setFormErrors(ErrorResponse.errors)
            }
        })
    }
 
    function addPhase() {
        let nextPhase = StartupPhase.PHASE_INVESTIGATION
        let nextDate = new Date()
        if (phases.length) {
            const previousPhase : StartupPhase = phases[phases.length - 1].name
            const previousPhaseIndex = PHASES_ORDERED_LIST.findIndex((value) => value === previousPhase)
            nextDate = phases[phases.length - 1].end || new Date()
            nextPhase = PHASES_ORDERED_LIST[previousPhaseIndex+1]

        }

        setPhases([...phases, { start: nextDate, name: nextPhase}])
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

                <div className='no-margin'>
                    <div className="form__group">
                        <label htmlFor="startup">
                            <strong>Nom du produit : </strong><br />
                            Ce nom sert d'identifiant pour la startup et ne doit pas dépasser 30 caractères
                        </label>
                        <input name="title"
                        onChange={(e) => { setTitle(e.currentTarget.value)}}
                        value={title}/>
                        { !!formErrors['startup'] && 
                            <p className="text-small text-color-red">{formErrors['startup']}</p>
                        }
                    </div>
                    <div className="form__group">
                        <label htmlFor="mission">
                            <strong>Quel est son objectif principal ?</strong><br />
                            Par exemple : "Faciliter la création d'une fiche produit". Pas besoin de faire plus long.
                        </label>
                        <textarea name="Mission"
                        onChange={(e) => { setMission(e.currentTarget.value)}}
                        value={mission}/>
                        { !!formErrors['mission'] && 
                            <p className="text-small text-color-red">{formErrors['mission']}</p>
                        }    
                    </div>                          
                    <div className="form__group">
                        <label htmlFor="description">
                            <strong>Description du produit :</strong><br />
                        </label>
                        <ClientOnly>
                            <MdEditor
                                defaultValue={decodeURIComponent(props.content || DEFAULT_CONTENT)}
                                style={{ height: '500px' }}
                                renderHTML={text => mdParser.render(text)} onChange={handleEditorChange} />
                        </ClientOnly>
                    </div>
                    <div className="form__group">
                        <label htmlFor="startup">
                            <strong>Incubateur : </strong><br />
                        </label>
                        <SEAsyncIncubateurSelect
                            value={incubator}
                            onChange={e => {
                                setIncubator(e.value)
                            }} />
                    </div>
                    <SponsorBlock
                        newSponsors={newSponsors}
                        setNewSponsors={setNewSponsors}
                        sponsors={sponsors}
                        setSponsors={(sponsors) => setSponsors(sponsors)} />
                    <h5>Phases : </h5>
                    <div style={{ borderTop: '1px solid #ccc', paddingBottom: 10, paddingTop: 10}}>
                        <p>
                            Voici l'historique des phases dans lesquelles a été ce produit.
                        </p>
                        <table style={{  padding: 10, position: 'relative',border: 'none' }}>
                            <tr>
                                <th>Phase</th>
                                <th>Date de début</th>
                                <th>Action</th>
                            </tr>
                            {phases.map((phase, index) => <PhaseItem
                                end={phase.end}
                                start={phase.start}
                                name={phase.name}
                                onChange={(phase) => changePhase(index, phase)}
                                deletePhase={() => deletePhase(index)}
                                key={index}/>
                            )}
                        </table>
                        {<a onClick={() => addPhase()}>{`Ajouter une phase`}</a>}
                    </div>
                    <input type="file" onChange={onFileChange} />
                    {fileData()}

                    <div className="form__group">
                        <label htmlFor="description">
                            <strong>URL du site :</strong><br />
                        </label>
                        <input name="link"
                        onChange={(e) => { setLink(e.currentTarget.value)}}
                        value={link}/>
                    </div>
                    <div className="form__group">
                        <label htmlFor="description">
                            <strong>Lien du repository github :</strong><br />
                        </label>
                        <input name="github"
                        onChange={(e) => { setRepository(e.currentTarget.value)}}
                        value={repository}/>
                    </div>
                    <div className="form__group">
                        <label htmlFor="description">
                            <strong>Lien du dashlord :</strong><br />
                        </label>
                        <input name="dashlord"
                        onChange={(e) => { setDashlord(e.currentTarget.value)}}
                        value={dashlord_url}/>
                    </div>
                    <div className="form__group">
                        <label htmlFor="description">
                            <strong>Lien de la page stats :</strong><br />
                        </label>
                        <input name="stats_url"
                        onChange={(e) => { setStatsUrl(e.currentTarget.value)}}
                        value={stats_url}/>
                    </div>
                    <input
                        type="submit"
                        disabled={isSaving || disabled}
                        onClick={save}
                        value={isSaving ? `Enregistrement en cours...` : `Enregistrer`}
                        className="button"
                    />
                </div>
            </>}
        </div>
    </>
    )
}
