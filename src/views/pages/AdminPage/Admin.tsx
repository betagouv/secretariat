import React, { ReactNode } from 'react'
import { InnerPageLayout } from '../components/InnerPageLayout'
import { hydrateOnClient } from '../../../lib/hydrateOnClient'

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
  activeTab: string
}

/* Pure component */
export const Admin = InnerPageLayout((props: AdminProps) => {

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
    </>
  )
})

hydrateOnClient(Admin)
