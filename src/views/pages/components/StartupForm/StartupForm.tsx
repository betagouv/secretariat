import React from 'react';
import { PHASES_ORDERED_LIST, Phase, StartupInfo, StartupPhase } from '@/models/startup';
import { ClientOnly } from '../ClientOnly';
import MdEditor from 'react-markdown-editor-lite';
import MarkdownIt from 'markdown-it';
import SEAsyncIncubateurSelect from '../SEAsyncIncubateurSelect';
import SponsorBlock from './SponsorBlock';
import PhaseItem from './PhaseItem';
import FileUpload from '../FileUpload';
import SelectAccessibilityStatus from '../SelectAccessibilityStatus';

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
    title?: string,
    phases?: Phase[], 
    startup: StartupInfo,
    analyse_risques?: boolean,
    analyse_risques_url?: string,
    accessibility_status?: 'non conforme' | "partiellement conforme" | "totalement conforme"
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
    const [title, setTitle] = React.useState(props.title || '')
    const [link, setLink] = React.useState(props.link)
    const [repository, setRepository] = React.useState(props.repository)
    const [mission, setMission] = React.useState(props.mission)
    const [sponsors, setSponsors] = React.useState(props.sponsors || [])
    const [newSponsors, setNewSponsors] = React.useState([])
    const [incubator, setIncubator] = React.useState(props.incubator)
    const [stats_url, setStatsUrl] = React.useState(props.stats_url)
    const [dashlord_url, setDashlord] = React.useState(props.dashlord_url)
    const [selectedFile, setSelectedFile] : [undefined | File, (File) => void] = React.useState()
    const [analyse_risques, setAnalyseRisques] = React.useState(props.analyse_risques)
    const [analyse_risques_url, setAnalyseRisquesUrl] = React.useState(props.analyse_risques_url)
    const [accessibility_status, setAccessibilityStatus] = React.useState(props.accessibility_status)
    const [phases, setPhases] = React.useState(props.phases || [{
        name: StartupPhase.PHASE_INVESTIGATION,
        start: new Date()
    }])
    const [errorMessage, setErrorMessage] = React.useState('');
    const [formErrors, setFormErrors] = React.useState({});
    const [isSaving, setIsSaving] = React.useState(false)

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
            analyse_risques,
            analyse_risques_url,
            accessibility_status,
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
                            Ce nom sert d'identifiant pour la startup et ne doit pas dépasser 30 caractères.
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
                    <FileUpload selectedFile={selectedFile} setSelectedFile={setSelectedFile}/>
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
                    <div className="form__group">
                        <label htmlFor="accessibility_status">
                            <strong>Statut d'accessibilité :</strong><br />
                        </label>
                        <p>Le statut d'accessibilité de ton produit. Une valeur parmi "totalement conforme", "partiellement conforme", et "non conforme". Si tu ne sais pas remplir ce champ, indique "non conforme".</p>
                        <SelectAccessibilityStatus 
                            value={accessibility_status}
                            onChange={(option) => { setAccessibilityStatus(option.value)}}/>
                    </div>
                    <div className="form__group">
                        <label htmlFor="analyse_risques">
                            <strong>Analyse de risque :</strong><br />
                        </label>
                        <p>Indique si ta startup à déjà réalisé un atelier d'analyse de risque agile.</p>
                        <div className="radio">
                            <label>
                                <input
                                type="radio"
                                value={true}
                                checked={analyse_risques}
                                onChange={() => setAnalyseRisques(true)}
                                />
                                Oui
                            </label>
                            </div>
                            <div className="radio">
                            <label>
                                <input
                                type="radio"
                                value={false}
                                checked={!analyse_risques}
                                onChange={() => setAnalyseRisques(false)}
                                />
                                Non
                            </label>
                        </div>
                    </div>
                    <div className="form__group">
                        <label htmlFor="analyse_risques_url">
                            <strong>Url de l'analyse de risque :</strong><br />
                        </label>
                        <p>Si ta SE a rendu son analyse de risques publique, tu peux indiquer le lien vers ce document ici.</p>
                        <input name="analyse_risques_url"
                        onChange={(e) => { setAnalyseRisquesUrl(e.currentTarget.value)}}
                        value={analyse_risques_url}/>
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
