import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { Request } from 'express'
import Select from 'react-select'

import { Member } from '@models/member';
import { InnerPageLayout } from '../components/InnerPageLayout';
import { hydrateOnClient } from '../../hydrateOnClient'
import routes from '@/routes/routes';
import { AdminMattermostUser } from './AdminMattermostUser'

interface Option {
    value: string,
    label: string
}

interface CommunityProps {
    title: string,
    currentUserId: string,
    errors: string[],
    messages: string[],
    users: Member[],
    activeTab: string,
    request: Request,
    isAdmin: boolean
    channelOptions: Option[]
}
  
const css = ".panel { min-height: 400px; }" // to have enough space to display dropdown

/* Pure component */
export const AdminMattermost = InnerPageLayout((props: CommunityProps) => {
    const [usersForMessage, setUsersForMessage] = useState([]);
    const [channel, setChannel] = useState('town-square');
    const [messageType, setMessageType] = useState('channel')
    const [includeEmails, setIncludeEmails] = useState('')
    const [excludeEmails, setExcludeEmails] = useState('')
    const [text, setText] = useState('')
    const [fromBeta, setFromBeta] = useState(true)

    useEffect(() => {
        updateQuery()
    }, [fromBeta, excludeEmails, includeEmails, messageType])

    const onChangeFromBeta = async (e) => {
        setFromBeta(!fromBeta)
    }

    const onChangeExcludeEmail = async (e) => {
        setExcludeEmails(e.target.value)
    }

    const onChangeIncludeEmail = async (e) => {
        setIncludeEmails(e.target.value)
    }

    const handleMessageTypeChange = async(e) => {
        setMessageType(e.target.value)
    }

    const updateQuery = async () => {
        const params = {
            excludeEmails,
            includeEmails,
            fromBeta
        }
        const queryParamsString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
        try {
            const usersForMessage = await axios.get(`${routes.ADMIN_MATTERMOST_MESSAGE_API}?${queryParamsString}`, ).then(resp => resp.data.users)
            setUsersForMessage(usersForMessage)
        } catch(e) {

        }
    }

    const buildParams = (prod) => {
        return {
            fromBeta,
            prod,
            includeEmails,
            excludeEmails,
            text,
            channel: messageType === 'channel' ? channel : undefined
        }
    }

    const send = async() => {
        if (confirm(`Est-tu sur de vouloir envoyer cette email à ${messageType === 'channel' ? 'au canal ' + props.channelOptions.find(c => c.value === channel).label : 'à ' + usersForMessage.length + ' membres ?'}`) === true) {
            const res = await axios.post(routes.ADMIN_MATTERMOST_SEND_MESSAGE, buildParams(true))
            alert(`${res.data.message}`)
        } else {
            alert(`Le message n'a pas été envoyé`)    
        }

    }
    const sendTest = async() => {
        try {
            const res = await axios.post(routes.ADMIN_MATTERMOST_SEND_MESSAGE, buildParams(false))
            alert(`${res.data.message}`)
            console.log('Done')
        } catch(e) {
            console.log('Erreur')
        }
    }

    return (
    <>
        <div className="module">
            <div key={'mattermost-message'} className="panel panel-full-width" id="mattermost-message">
                <h3>
                    Envoyer un message aux utilisateurs mattermost
                </h3>
                <div>
                    <div className="form__group">
                        <label htmlFor="messageType">
                            <strong>Envoyer le message sur un canal ou en message direct à chaque personne ?</strong><br />
                            <span key={'channel'}>
                                <input type="radio"
                                    value={'channel'}
                                    onChange={handleMessageTypeChange}
                                    checked={messageType === 'channel'}
                                    required/>Sur un canal<br/>
                            </span>
                            <span key={'dm'}>
                                <input type="radio"
                                    value={'DM'}
                                    onChange={handleMessageTypeChange}
                                    checked={messageType === 'DM'}
                                    required/>En message direct<br/>
                            </span>
                        </label>
                        <br/>
                        { messageType === 'DM' && <><label htmlFor="fromBeta">
                            <strong>Envoyer uniquement aux membres @beta (pas etalab, ...) ?</strong><br />
                            <input
                                onChange={onChangeFromBeta}
                                checked={fromBeta}
                                type="checkbox"
                                id="fromBeta"
                                name="fromBeta"
                            /> Oui
                        </label>
                        <br/>
                        <label htmlFor="excludeEmails">
                            <strong>Souhaites-tu exclure des emails ? :</strong><br />
                            <p>Renseigne une liste d'email séparés par une virgule</p>
                            <input
                                onChange={onChangeExcludeEmail}
                                value={excludeEmails}
                                id="excludeEmails"
                                name="excludeEmails"
                            />
                        </label>
                        <br/>
                        <label htmlFor="includeEmails">
                            <strong>Souhaites-tu uniquement envoyer à une liste d'utilisateur précis ? :</strong><br />
                            <p>Renseigne une liste d'email séparés par une virgule</p>
                            <input
                                onChange={onChangeIncludeEmail}
                                value={includeEmails}
                                id="includeEmails"
                                name="includeEmails"
                            />
                        </label>
                        <br/>
                        </>}
                        { messageType === 'channel' && <><label htmlFor="channel">
                            <strong>Sur quel canal envoyé le message ?</strong><br />
                            <Select
                                options={props.channelOptions}
                                isMulti={false}
                                onChange={(e) => setChannel(e.value)}
                                placeholder={'Sélectionne le canal sur lequel envoyé le message'} />
                        </label>
                        <br/>
                        </>}
                    </div>
                    <label htmlFor="text">
                        <strong>Quel texte envoyé aux membres de la communauté ?</strong><br />
                        <p>Tu peux utiliser du markdown et tester le rendu du texte en cliquand sur "envoyer un test"</p>
                        <textarea
                            onChange={e => setText(e.target.value)}
                            id="text"
                            name="text"
                            placeholder="Texte à envoyer"
                        />
                    </label>
                    <br/>
                    <label htmlFor="prod">
                        <strong>⚠️ Attention ce message sera envoyé { messageType === 'channel' ? ` au canal ${props.channelOptions.find(c => c.value === channel).label}` : `à ${usersForMessage.length} membres`}</strong><br />
                    </label>
                    <br/>
                    <button
                        className="button-outline primary"
                        type="submit"
                        onClick={sendTest}>Envoyer un test</button>
                    <button
                        onClick={send}
                        className="button"
                        type="submit">Envoyer</button>
                </div>
                <br/>
            </div>
        </div>
        <AdminMattermostUser {...props} />
        <style media="screen">
            {css}
        </style>
    </>)
})

hydrateOnClient(AdminMattermost)
