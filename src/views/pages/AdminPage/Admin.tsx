import React, { ReactNode } from 'react'
// import { InnerLayoutPage } from '../components/InnerLayoutPage'
import { hydrateOnClient } from '../../hydrateOnClient'
import type { Request } from 'express'
// import 'react-tabulator/lib/styles.css'; // required styles
// import 'react-tabulator/lib/css/tabulator.min.css'; // theme
import { ReactTabulator, ColumnDefinition } from 'react-tabulator';
import { InnerPageLayout } from '../components/InnerPageLayout';
import { Member } from 'src/models/member';
import Select from 'react-select'


const SEIncubateurSelect = ({ incubators }) => {
  return <Select options={incubators} isMulti placeholder={'Sélectionne un ou plusieurs incubateurs'}  />
}

const SESelect = ({ startups }) => {
  return <Select options={startups} isMulti placeholder={'Sélectionne une ou plusieurs startups'} />
}

const DomaineSelect = ({ domaines }) => {
  return <Select options={domaines} isMulti placeholder={'Sélectionne un ou plusieurs domaine'}  />
}

const ActiveMemberSelect = ({ status }) => {
  return <Select options={status} placeholder={'Sélectionne les membres actifs/inactifs/les deux'} />
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

const columns: ColumnDefinition[] = [
  { title: 'Id', field: 'id', width: 150 },
  { title: 'fullname', field: 'fullname' },
  { title: 'github', field: 'github' },
  { title: 'Email', field: 'email', hozAlign: 'left' },
  { title: 'start', field: 'start', sorter: 'date' },
  { title: 'end', field: 'end', sorter: 'date' },
  { title: 'previously', field: 'previously', hozAlign: 'center'},
  { title: 'missions', field: 'missions', hozAlign: 'center'},
  { title: 'startups', field: 'startups', hozAlign: 'center'},
  { title: 'employer', field: 'employer', hozAlign: 'center' },
  { title: 'domaine', field: 'domaine', hozAlign: 'center' }
  // { title: 'Name', field: 'name', width: 150 },
  // { title: 'Age', field: 'age', hozAlign: 'left', formatter: 'progress' },
  // { title: 'Favourite Color', field: 'color' },
  // { title: 'Date Of Birth', field: 'dob', sorter: 'date' },
  // { title: 'Rating', field: 'rating', hozAlign: 'center', formatter: 'star' },
  // { title: 'Passed?', field: 'passed', hozAlign: 'center', formatter: 'tickCross' },
  // { title: 'Custom', field: 'custom', hozAlign: 'center', editor: 'input' }
];

/* Pure component */
export const Admin = InnerPageLayout((props: AdminProps) => {
  const data = props.emails
  const [state, setState] = React.useState<any>({
    data: data,
    selectedName: ''
  });
  let ref = React.useRef<any>();

  const rowClick = (e: any, row: any) => {
    console.log('ref table: ', ref.current); // this is the Tabulator table instance
    // ref?.current && ref?.current.replaceData([])
    console.log('rowClick id: ${row.getData().id}', row, e, state);
    setState({ selectedName: row.getData().name });
  };

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

  const css = ".panel { overflow: scroll; }"
  const activeMemberOptions = [{ value: 'active', label: 'Actif'}, { value: 'unactive', label: 'Non Actif'}, { value: 'both', label: 'Tous'}]
  return (
    <>
      <div className="module">
          <div className="row">
            <SEIncubateurSelect incubators={props.incubatorOptions} />
            <SESelect startups={props.startupOptions} />
          </div>
          <div className="row">
            <DomaineSelect domaines={props.domaineOptions} />
            <ActiveMemberSelect status={activeMemberOptions} />
          </div>
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
      </div>
      <ReactTabulator
        onRef={(r) => (ref = r)}
        columns={columns} data={props.users} events={{ rowClick }} />
      <link rel="stylesheet" media="screen,print" href='/static/sortable/sortable.css'/>
      {/* <script src="/static/sortable/sortable.js"></script> */}
      <style media="screen">
        {css}
      </style>
    </>
  )
})

hydrateOnClient(Admin)
