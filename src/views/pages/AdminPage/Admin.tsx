import React, { ReactNode } from 'react'
import type { Request } from 'express'
import { Member } from '@models/member';
import { InnerPageLayout } from '../components/InnerPageLayout';
import { hydrateOnClient } from '../../hydrateOnClient'


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
  users: Member[],
  activeTab: string,
  request: Request,
  isAdmin: boolean
}

/* Pure component */
export const Admin = InnerPageLayout((props: AdminProps) => {

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
