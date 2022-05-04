
   
import type { Request } from 'express'
import React from 'react'

interface HasRequest {
  request: Request,
  title: string,
  currentUserId: string,
  errors: string[],
  messages: string[],
  activeTab: string
}

export const InnerPageLayout = <T extends HasRequest>(Component: (props: T) => JSX.Element) => (
  props: T
) => {
  return (
    <>
        <html>
        <head>
            <meta charSet="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <title>{ props.title }</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"/>
            <link rel="apple-touch-icon" sizes="180x180" href="/static/favicon/apple-touch-icon.png"/>
            <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon/favicon-32x32.png"/>
            <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon/favicon-16x16.png"/>
            <link rel="manifest" href="/static/favicon/site.webmanifest"/>
            <link rel="stylesheet" href="/static/css/main.css"/>
        </head>

        <body>
            <div id="dashboard" className="dashboard">
                <aside className="side-menu" role="navigation" id="navigation">
                    <button id="drawer-toggle" className="button-outline small primary">Menu <span id="drawer-toggle-arrow">▼</span></button>
                    <h4 id="logo">🤖&nbsp;Secrétariat</h4>
                    <ul className="hidden-mobile margin-bottom-5" id="drawer">
                        <li>
                            <a href="/account" id="account" 
                                className="nav-item <% if(activeTab === 'account') { %> active <% } %>">
                                Mon compte
                            </a>
                        </li>
                        <li>
                            <a href="/community" id="community"
                                className="nav-item <% if(activeTab === 'community') { %> active <% } %>">
                                Communauté
                            </a>
                        </li>
                        <li>
                            <a href="/startups" id="startups"
                                className="nav-item <% if(activeTab === 'startups') { %> active <% } %>">
                                Startups
                            </a>
                        </li>
                        <li>
                            <a href="/admin" id="admin" 
                                className="nav-item <% if(activeTab === 'admin') { %> active <% } %>">
                                Administration
                            </a>
                        </li>
                        <li>
                            <a href="/newsletters" id="newsletter" 
                                className="nav-item <% if(activeTab === 'newsletter') { %> active <% } %>">
                                Infolettres internes
                            </a>
                        </li>
                        <li>
                            <a href="/resources" id="resources"
                                className="nav-item <% if(activeTab === 'resources') { %> active <% } %>">
                                Ressources
                            </a>
                        </li>
                        <li className="nav-end">
                            <hr />
                            { (props.currentUserId) &&
                            <div>
                                Identifié·e en tant que<br />
                                <span className="font-weight-bold">{ props.currentUserId }</span>
                            </div>}
                            <hr />
                            <a href="/logout">Se déconnecter</a>
                            <hr />
                            <img src="/static/images/betagouv.png" width="150" alt=""/>
                            <a href="https://github.com/betagouv/secretariat/" target="_blank"
                                className="text-size-caption text-color-darker-grey">Code source du sécretariat</a>
                        </li>
                    </ul>
                </aside>
                <main role="main" className="main">
                    { props.errors.length && 
                        <div className="notification error">
                            <strong>Erreur : </strong>
                            {props.errors.map((message) => {
                                { message }
                            })}
                        </div>
                    }
                    { props.messages.length && <div className="notification">
                        {props.messages.map((message) => {
                            return <p>{message}</p>
                        })}
                        </div>
                    }
                    <section className="section section-grey no-padding">
                        <Component {...props} />
                        <div className="main-end">
                            <div>
                                Identifié·e en tant que<br />
                                <span className="font-weight-bold">{ props.currentUserId }</span>
                            </div>
                            <a href="/logout">Se déconnecter</a>
                        </div>
                    </section>
                </main>
                </div>
            </body>
        </html>
    </>
  )
}