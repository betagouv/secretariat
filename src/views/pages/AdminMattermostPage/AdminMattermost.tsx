import React, { useEffect, useState } from 'react'
import { Request } from 'express'

import { Member } from '@models/member';
import { InnerPageLayout } from '../components/InnerPageLayout';
import { hydrateOnClient } from '../../hydrateOnClient'
import { ReactTabulator, ColumnDefinition } from 'react-tabulator';
import axios from 'axios';
import routes from '@/routes/routes';

interface CommunityProps {
    title: string,
    currentUserId: string,
    errors: string[],
    messages: string[],
    users: Member[],
    activeTab: string,
    request: Request,
}
  
const columns: ColumnDefinition[] = [
    { title: 'email', field: 'email'},
    { title: 'username', field: 'username' },
    { title: 'status', field: 'status' },
];
  
const css = ".panel { min-height: 400px; }" // to have enough space to display dropdown

var groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};
/* Pure component */
export const AdminMattermost = InnerPageLayout((props: CommunityProps) => {

    const [state, setState] = React.useState<any>({
        users: [],
        selectedName: '',
        fromBeta: true,
        excludeEmails: [],
        ...props,
    });

    const [usersForMessage, setUsersForMessage] = useState([]);
    const [prod, setProd] = useState(false);
    const [channel, setChannel] = useState(undefined);
    const [messageType, setMessageType] = useState(undefined)


    useEffect(() => {
        updateQuery()
    }, [state.fromBeta, state.excludeEmails])

    function exportToCsv(filename, rows) {

        const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
        const header = Object.keys(rows[0])
        const csv = [
        header.join(';'), // header row first
        ...rows.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(';'))
        ].join('\r\n')

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        if (navigator['msSaveBlob']) { // IE 10+
            navigator['msSaveBlob'](blob, filename);
        } else {
            const link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }

    const onClickDownload = async () => {
        exportToCsv('users.csv', state.users)
    }

    const countData = groupBy(state.users, 'status')

    const onChangeFromBeta = async (e) => {
        setState({
            ...state,
            fromBeta: !state.fromBeta
        })
    }

    const onChangeExcludeEmail = async (e) => {
        setState({
            ...state,
            excludeEmails: e.target.value
        })
    }

    const onChangeProd = async (e) => {
        setProd(!prod)
    }

    const handleMessageTypeChange = async(e) => {
        setMessageType(e.target.value)
    }

    const updateQuery = async () => {
        const params = {
            excludeEmails: state.excludeEmails,
            fromBeta: state.fromBeta
        }
        const queryParamsString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
        const usersForMessage = await axios.get(`${routes.ADMIN_MATTERMOST_MESSAGE_API}?${queryParamsString}`, ).then(resp => resp.data.users)
        setUsersForMessage(usersForMessage)
    }

    return (
    <>
        <div className="module">
            <div key={'filter-user'} className="panel panel-full-width" id="filter-user">
                <h3>
                    Membre mattermost et status
                </h3>
                { Object.keys(countData).map(key => {
                    return <div>{key} : {countData[key].length}</div>
                })}
                { Boolean(state.users.length) && <button onClick={onClickDownload}  className="button">Télécharger</button> }
                <br/>
                <br/>
                <ReactTabulator
                    data-instance={'user-table'}
                    columns={columns}
                    data={state.users}
                    options={{ pagination: 'local', paginationSize: 50 }}
                />
                <br/>
                <br/>
            </div>
            <div key={'mattermost-message'} className="panel panel-full-width" id="mattermost-message">
                <h3>
                    Envoyer un message aux utilisateurs mattermot
                </h3>
                <form action="/admin/mattermost/send-message" method="POST">
                    <div className="form__group">
                        <label htmlFor="messageType">
                            <strong>Envoyer le message sur un channel ou en direct message</strong><br />
                            <span key={'channel'}>
                                <input type="radio"
                                    value={'channel'}
                                    onChange={handleMessageTypeChange}
                                    checked={messageType === 'channel'}
                                    required/>Channel<br/>
                            </span>
                            <span key={'dm'}>
                                <input type="radio"
                                    value={'DM'}
                                    onChange={handleMessageTypeChange}
                                    checked={messageType === 'DM'}
                                    required/>Direct Message<br/>
                            </span>
                        </label>
                        { messageType === 'DM' && <div><label htmlFor="fromBeta">
                            <strong>Envoyer uniquement aux membres @beta (pas etalab, ...)</strong><br />
                            <input
                                onChange={onChangeFromBeta}
                                checked={state.fromBeta}
                                type="checkbox"
                                id="fromBeta"
                                value={`${state.fromBeta}`}
                                name="fromBeta"
                            />
                        </label>
                        <br/>
                        <label>Le message sera envoyé à : { usersForMessage.length }</label>
                        <br/>
                        <label htmlFor="excludeEmails">
                            <strong>Exclude les emails</strong><br />
                            <input
                                onChange={onChangeExcludeEmail}
                                value={state.excludeEmails}
                                id="excludeEmails"
                                name="excludeEmails"
                            />
                        </label></div>}
                        { messageType === 'channel' && <label htmlFor="channel">
                            <strong>Envoyer sur le channel</strong><br />
                            <input
                                onChange={(e) => setChannel(e.target.value)}
                                type="text"
                                id="channel"
                                name="channel"
                            />
                        </label>}
                    </div>
                    <label htmlFor="text">
                        <strong>Texte à envoyer au membre de la communauté</strong><br />
                        <textarea
                            defaultValue={''}
                            id="text"
                            name="text"
                            placeholder="Texte à envoyer"
                        />
                    </label>
                    <label htmlFor="prod">
                        <strong>/!\ Attention si tu coches ce message sera envoyé {channel ? ` au channel ${channel}` : `à ${state.users.length} membres`}</strong><br />
                        <input
                            onChange={onChangeProd}
                            checked={prod}
                            value={`${prod}`}
                            type="checkbox"
                            id="prod"
                            name="prod"
                        />
                    </label>
                    <button className="button" type="submit">Envoyer</button>
                </form>
                <br/>
            </div>
        </div>
        <style media="screen">
            {css}
        </style>
    </>)
})

hydrateOnClient(AdminMattermost)
