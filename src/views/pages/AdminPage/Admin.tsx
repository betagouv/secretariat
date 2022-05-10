import React, { ReactNode } from 'react'
import { InnerPageLayout } from '../components/InnerPageLayout'
import { hydrateOnClient } from '../../../lib/hydrateOnClient'
import type { Request } from 'express'
// import 'react-tabulator/lib/styles.css'; // required styles
// import 'react-tabulator/lib/css/tabulator.min.css'; // theme
import { ReactTabulator, ColumnDefinition } from 'react-tabulator';


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

interface AdminProps {
  emails: Email[],
  expiredEmails: Email[],
  title: string,
  currentUserId: string,
  errors: string[],
  messages: string[],
  activeTab: string,
  request: Request
}

const columns: ColumnDefinition[] = [
  { title: 'Id', field: 'id', width: 150 },
  { title: 'Email', field: 'email', hozAlign: 'left', formatter: 'progress' },
  { title: 'Redirection', field: 'redirections' },
  { title: 'Date', field: 'endDate', sorter: 'date' },
  { title: 'Account', field: 'account', hozAlign: 'center'},
  { title: 'Expiré ?', field: 'expired', hozAlign: 'center', formatter: 'tickCross' },
  { title: 'github', field: 'github', hozAlign: 'center' }
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

  const data = props.emails || [
    { id: 1, name: 'Oli Bob', age: '12', color: 'red', dob: '01/01/1980', rating: 5, passed: true, pets: ['cat', 'dog'] },
    { id: 2, name: 'Mary May', age: '1', color: 'green', dob: '12/05/1989', rating: 4, passed: true, pets: ['cat'] },
    { id: 3, name: 'Christine Lobowski', age: '42', color: 'green', dob: '10/05/1985', rating: 4, passed: false },
    { id: 4, name: 'Brendon Philips', age: '125', color: 'red', dob: '01/08/1980', rating: 4.5, passed: true },
    { id: 5, name: 'Margret Marmajuke', age: '16', color: 'yellow', dob: '07/01/1999', rating: 4, passed: false },
    {
      id: 6,
      name: 'Van Ng',
      age: '37',
      color: 'green',
      dob: '06/10/1982',
      rating: 4,
      passed: true,
      pets: ['dog', 'fish']
    },
    { id: 7, name: 'Duc Ng', age: '37', color: 'yellow', dob: '10/10/1982', rating: 4, passed: true, pets: ['dog'] }
  ];
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
    return (<tr>
        <td>
            <a href={`/community/${email.id}`}>{email.email}</a>
            <div data-id={email.id} className="redirection-list">
                { email.redirections.map(function(redirection) {
                  return <>{redirection}<br /></>
                })}
            </div>
        </td>
        <td>{email.github ? <a href={`https://github.com/betagouv/beta.gouv.fr/blob/master/content/_authors/${email.id}.md`} target="_blank">✔ Oui</a> : '❌ Non !' }</td>
        <td>{!email.expired ? `✔ Oui` : `❌ Non !` }</td>
        <td>{email.account ? `✔ Oui` : `❌ Non !` }</td>
    </tr>)
  })

  const expiredRows : ReactNode[] = props.expiredEmails.map(function(email) {
    return (<tr>
      <td><a href={`/community/${email.id}`}>{email.email}</a>
            <div data-id={`/community/${email.id}`} className="redirection-list">
                { email.redirections.map(function(redirection) {
                  return <>{redirection}<br /></>
                })}
            </div>
        </td>
        <td>{email.endDate ? email.endDate : '❌ Non !'}</td>
        <td>{email.account ? '✔ Oui' : '❌ Non !' }</td>
        <td>{email.github ? <a href={`https://github.com/betagouv/beta.gouv.fr/blob/master/content/_authors/${email.id}.md`} target="_blank">✔ Oui</a> : '❌ Non !' }</td>
    </tr>)
  })

  const css = ".panel { overflow: scroll; }"

  return (
    <>
      <div className="module">
          <div className="panel panel-full-width" id="all">
              <h3>
                  Liste des emails
              </h3>
              <a href="#expired">⬇️ Voir les comptes expirés</a>
              <hr />
              <table className="sortable">
                  <thead>
                      <tr>
                          <th>Email</th>
                          <th>Fiche sur Github</th>
                          <th>Date de fin OK</th>
                          <th>Compte Email</th>
                      </tr>
                  </thead>
                  <tbody>
                      {rows}
                  </tbody>
              </table>
          </div>

          <div className="panel panel-full-width" id="expired">
              <h3>
                  Comptes expirés
              </h3>
              <a href="#all">⬆️ Voir tous les comptes</a>
              <hr />
              <table className="sortable">
                  <thead>
                      <tr>
                          <th>Email</th>
                          <th>Date de fin</th>
                          <th>Compte Email</th>
                          <th>Fiche sur Github</th>
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
        columns={columns} data={data} events={{ rowClick }} />
      <link rel="stylesheet" media="screen,print" href='/static/sortable/sortable.css'/>
      <script src="/static/sortable/sortable.js"></script>
      <style media="screen">
        {css}
      </style>
    </>
  )
})

hydrateOnClient(Admin)
