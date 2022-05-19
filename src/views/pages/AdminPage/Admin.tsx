import React, { ReactNode } from 'react'
// import { InnerLayoutPage } from '../components/InnerLayoutPage'
import { hydrateOnClient } from '../../hydrateOnClient'
import type { Request } from 'express'
// import 'react-tabulator/lib/styles.css'; // required styles
// import 'react-tabulator/lib/css/tabulator.min.css'; // theme
import { ReactTabulator, ColumnDefinition, reactFormatter } from 'react-tabulator';
import { InnerPageLayout } from '../components/InnerPageLayout';
import { Member } from 'src/models/member';
import Select from 'react-select'
import axios from 'axios';


const SEIncubateurSelect = ({ incubators, onChange }) => {
  return <Select options={incubators}
    isMulti
    onChange={onChange}
    placeholder={'Sélectionne un ou plusieurs incubateurs'}  />
}

const SESelect = ({ startups, onChange }) => {
  return <Select
    options={startups}
    isMulti
    onChange={onChange}
    placeholder={'Sélectionne une ou plusieurs startups'} />
}

const DomaineSelect = ({ domaines, onChange }) => {
  return <Select
    options={domaines}
    onChange={onChange}
    isMulti
    placeholder={'Sélectionne un ou plusieurs domaine'}  />
}

const MemberStatusSelect = ({ status, onChange }) => {
  return <Select
    options={status}
    onChange={onChange}
    placeholder={'Sélectionne les membres actifs/inactifs/les deux'} />
}

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
  const data = props.cell._cell.row.data;
  const cellValue = props.cell._cell.value || 'Edit | Show';
  return <a href={`/community/${data.id}`}>{cellValue}</a>;
}

const columns: ColumnDefinition[] = [
  { title: 'Email', field: 'email', width: 150, formatter: reactFormatter(<Link/>)},
  { title: 'Nom complet', field: 'fullname' },
  { title: 'Startups', field: 'startups', hozAlign: 'center'},
  { title: 'Domaine', field: 'domaine', hozAlign: 'center' }
];

/* Pure component */
export const Admin = InnerPageLayout((props: AdminProps) => {
  const data = props.emails
  let tableRef = React.useRef();
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
    setState({
      ...state,
      filterDirty: false,
      loadingData: true
    })
    const domaines = (state.domaines || []).map(d => d.value).join(',')
    const incubators = (state.incubators || []).map(d => d.value).join(',')
    const startups = (state.startups || []).map(d => d.value).join(',')
    const memberStatus= (state.memberStatus || {}).value

    const data = await axios.get(`/api/get-users?domaines=${domaines}&incubators=${incubators}&startups=${startups}&memberStatus=${memberStatus}`).then(response => response.data);
    
    setState({
      ...state,
      // loadingData: false,
      users: data.users.map(user => ({
        ...user,
        email: `${user.id}@beta.gouv.fr`
      }))
    })
  }

  const exportToCsv = (filename, rows) => {
    if (tableRef) {
      tableRef.current.download("csv", "data.csv")
    }
  }

  const onClickDownload = async () => {
    exportToCsv('users.csv', state.users)
  }
  const options  = {
    downloadDataFormatter: (data) => data,
    downloadReady: (fileContents, blob) => blob,
    paginationSize: 100,
    pagination: 'local',
    movableRows: true,
    // progressiveLoad: 'scroll',
    // progressiveLoadDelay: 200,
    // progressiveLoadScrollMargin: 30,
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
                Filtrer les utilisateurs
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
          <br/>
          <br/>
          { Boolean(state.users.length) && <button onClick={onClickDownload}
          >Télécharger</button> }
          <div style={{ position: 'relative'}}>
            { !state.loadingData && <ReactTabulator
              onRef={(r) => (tableRef = r)}
              key={'tabulator'}
              columns={columns}
              data={state.users}
              options={options}
            /> }
            { !!state.loadingData && <div>Récupération des données...</div>}
          </div>
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
