import React from 'react'
import type { Request } from 'express'
import axios from 'axios'

import { Member } from '@models/member';
import { InnerPageLayout } from '../components/InnerPageLayout';
import { hydrateOnClient } from '../../hydrateOnClient'
import MemberSelect from '../components/MemberSelect';
import { ReactTabulator, ColumnDefinition, reactFormatter } from 'react-tabulator';
import SEIncubateurSelect from '../components/SEIncubateurSelect';
import SESelect from '../components/SESelect';
import DomaineSelect from '../components/DomaineSelect';
import MemberStatusSelect from '../components/MemberStatusSelect';
import SEPhaseSelect from '../components/SEPhaseSelect';

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
    incubatorOptions: Option[],
    startupOptions: Option[],
    domaineOptions: Option[],
}

function Link(props: any) {
    // props.cell._cell.row.data;
    const cellValue = props.cell._cell.value || 'Edit | Show';
    return <a href={`/community/${cellValue}`}>{cellValue}@beta.gouv.fr</a>;
}
  
const columns: ColumnDefinition[] = [
    { title: 'email', field: 'id', width: 150, formatter: reactFormatter(<Link/>)},
    { title: 'fullname', field: 'fullname' },
    { title: 'startups', field: 'startups', hozAlign: 'center'},
    { title: 'domaine', field: 'domaine', hozAlign: 'center' }
];
  
const css = ".panel { min-height: 400px; }" // to have enough space to display dropdown

/* Pure component */
export const Community = InnerPageLayout((props: CommunityProps) => {

    const [state, setState] = React.useState<any>({
        users: [],
        selectedName: '',
        ...props,
    });

    const changeFormData = (key, value) => {
        setState({
            ...state,
            key: value
        })
    }

    const onClickSearch = async () => {
        const domaines = (state.domaines || []).map(d => d.value).join(',')
        const incubators = (state.incubators || []).map(d => d.value).join(',')
        const startups = (state.startups || []).map(d => d.value).join(',')
        const memberStatus = (state.memberStatus || {}).value
        const startupPhases = (state.startupPhases || []).map(d => d.value).join(',')
        const params = {
            domaines,
            incubators,
            startups,
            memberStatus,
            startupPhases
        }
        const queryParamsString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
        const data = await axios.get(`/api/get-users?${queryParamsString}`).then(response => response.data);
        setState({
            ...state,
            users: data.users
        })
    }

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

    return (
    <>
        <div className="module">
            <div className="panel panel-full-width">
                <h3>
                    Rechercher
                </h3>
                <form className="no-margin" action="/community">
                    <div className="form__group">
                        <label><strong>Nom ou prénom du membre</strong></label>
                        <MemberSelect
                            name="username"
                            onChange={(e) => changeFormData('username', e.value)}
                            members={props.users.map(u => ({
                                value: u.id,
                                label: u.fullname
                            }))}
                            defaultValue={undefined}></MemberSelect>
                    </div>
                    <div className="form__group">
                        <button className="button no-margin" type="submit">Voir la fiche</button>
                    </div>
                </form>
                <br />
                <p>
                    Le membre que vous cherchez n'existe pas ? Vous pouvez lui donner le lien du <a href="/onboarding">formulaire de création de fiche</a>.
                </p>
            </div>
            <div key={'filter-user'} className="panel panel-full-width" id="filter-user">
                <h3>
                    Filtrer les membres
                </h3>
                <div className="row">
                <div style={{ width: '50%' }}>
                <SEIncubateurSelect
                    incubators={props.incubatorOptions}
                    onChange={(incubators) => setState({
                    ...state,
                    incubators
                    })} />
                </div>
                <div style={{ width: '50%' }}>
                <SESelect
                    isMulti={true}
                    startups={props.startupOptions}
                    onChange={(startups) => setState({
                    ...state,
                    startups
                    })} />
                </div>
            </div>
            <div className="row">
                <div style={{ width: '50%' }}>
                    <DomaineSelect
                        domaines={props.domaineOptions}
                        onChange={(domaines) => setState({
                        ...state,
                        domaines
                        })}
                    />
                </div>
                <div style={{ width: '50%' }}>
                    <MemberStatusSelect
                        onChange={(memberStatus) => setState({
                        ...state,
                        memberStatus
                        })}
                    />
                </div>
            </div>
            <div className="row">
                <div style={{ width: '50%' }}>
                    <SEPhaseSelect
                        isMulti={true}
                        onChange={(startupPhases) => setState({
                        ...state,
                        startupPhases
                    })} />
                </div>
            </div>
            <br/>
            <button onClick={onClickSearch} className="button margin-right-10">Chercher</button>
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
        </div>
        <style media="screen">
            {css}
        </style>
    </>)
})

hydrateOnClient(Community)
