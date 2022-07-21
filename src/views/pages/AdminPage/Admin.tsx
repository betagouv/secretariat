import React, { ReactNode } from 'react'
import axios from 'axios';
import type { Request } from 'express'
import { ReactTabulator, ColumnDefinition, reactFormatter } from 'react-tabulator';
import { Member } from 'src/models/member';
import { InnerPageLayout } from '../components/InnerPageLayout';
import { hydrateOnClient } from '../../hydrateOnClient'
import SEIncubateurSelect from '../components/SEIncubateurSelect';
import SESelect from '../components/SESelect';
import DomaineSelect from '../components/DomaineSelect';
import MemberStatusSelect from '../components/MemberStatusSelect';

interface Email {
  github?: string,
  expired: boolean,
  account: string,
  endDate: string,
  startDate: string,
  id: string,
  email: string,
  redirections: string[],
}

interface Option {
  value: string,
  label: string
}

interface AdminProps {
  emails: Email[],
  expiredEmails: Email[],
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

/* Pure component */
export const Admin = InnerPageLayout((props: AdminProps) => {
  const data = props.emails
  const [state, setState] = React.useState<any>({
    data: data,
    users: [],
    selectedName: ''
  });

  const rows : ReactNode[] = props.emails.map(email => {
    const redirectionList = email.redirections.map(function(redirection, i) {
      return <span key={i}>{redirection}<br /></span>
    })
    return (<tr key={email.id} id={email.id}>
        <td key={'nom'}>
            <a href={`/community/${email.id}`}>{email.email}</a>
            <div data-id={email.id} className="redirection-list">
                { redirectionList }
            </div>
        </td>
        <td key={'github'}>{email.github ? <a href={`https://github.com/betagouv/beta.gouv.fr/blob/master/content/_authors/${email.id}.md`} target="_blank">✔ Oui</a> : '❌ Non !' }</td>
        <td key={'expired'}>{!email.expired ? `✔ Oui` : `❌ Non !` }</td>
        <td key={'account'}>{email.account ? `✔ Oui` : `❌ Non !` }</td>
    </tr>)
  })

  const expiredRows : ReactNode[] = props.expiredEmails.map(function(email) {
    const redirectionList = email.redirections.map(function(redirection, i) {
      return <span key={i}>{redirection}<br /></span>
    })
    return (<tr key={email.id}>
      <td><a href={`/community/${email.id}`}>{email.email}</a>
            <div data-id={`/community/${email.id}`} className="redirection-list">
                { redirectionList }
            </div>
        </td>
        <td>{email.endDate ? email.endDate : '❌ Non !'}</td>
        <td>{email.account ? '✔ Oui' : '❌ Non !' }</td>
        <td>{email.github ? <a href={`https://github.com/betagouv/beta.gouv.fr/blob/master/content/_authors/${email.id}.md`} target="_blank">✔ Oui</a> : '❌ Non !' }</td>
    </tr>)
  })

  const onClickSearch = async () => {
    const domaines = (state.domaines || []).map(d => d.value).join(',')
    const incubators = (state.incubators || []).map(d => d.value).join(',')
    const startups = (state.startups || []).map(d => d.value).join(',')
    const memberStatus= (state.memberStatus || {}).value

    const data = await axios.get(`/api/get-users?domaines=${domaines}&incubators=${incubators}&startups=${startups}&memberStatus=${memberStatus}`).then(response => response.data);
    setState({
      ...state,
      users: data.users
    })
  }

  function exportToCsv(filename, rows) {

    const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
    const header = Object.keys(rows[0])
    console.log(rows[0], Object.keys(rows[0]))
    const csv = [
      header.join(','), // header row first
      ...rows.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
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

  const css = ".panel { overflow: scroll; }"
  const activeMemberOptions = [{ value: 'active', label: 'Membres Actifs'}, { value: 'unactive', label: 'Alumnis'}, { value: 'both', label: 'Membres actifs et Alumnis'}]
  return (
    <>
      <div className="module">
          <div key={'all'} className="panel panel-full-width" id="all">
              <h3>
                  Liste des emails
              </h3>
              <a href="#expired">⬇️ Voir les comptes expirés</a>
              <hr />
              <table className="sortable">
                  <thead>
                      <tr>
                          <th key={'email'}>Email</th>
                          <th key={'github'}>Fiche sur Github</th>
                          <th key={'date'}>Date de fin OK</th>
                          <th key={'account'}>Compte Email</th>
                      </tr>
                  </thead>
                  <tbody>
                      {rows}
                  </tbody>
              </table>
          </div>

          <div key={'expired'}  className="panel panel-full-width" id="expired">
              <h3>
                  Comptes expirés
              </h3>
              <a href="#all">⬆️ Voir tous les comptes</a>
              <hr />
              <table className="sortable">
                  <thead>
                      <tr>
                        <th key={'email'}>Email</th>
                          <th key={'github'}>Fiche sur Github</th>
                          <th key={'date'}>Date de fin OK</th>
                          <th key={'account'}>Compte Email</th>
                      </tr>
                  </thead>
                  <tbody>
                      {expiredRows}
                  </tbody>
              </table>
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
                status={activeMemberOptions}
                onChange={(memberStatus) => setState({
                  ...state,
                  memberStatus
                })}
              />
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
          />
          <br/>
          <br/>
          </div>
      </div>
      <link rel="stylesheet" media="screen,print" href='/static/sortable/sortable.css'/>
      <script src="/static/sortable/sortable.js"></script>
      <style media="screen">
        {css}
      </style>
    </>
  )
})

hydrateOnClient(Admin)
