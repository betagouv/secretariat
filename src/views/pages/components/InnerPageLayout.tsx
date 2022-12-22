
   
import React from 'react'
import type { Request } from 'express'

interface InnerPageLayout {
  title: string,
  currentUserId: string,
  errors: string[],
  messages: string[],
  activeTab: string,
  request: Request
}

export const InnerPageLayout = <T extends InnerPageLayout>(Component: (props: T) => JSX.Element) => (
  props: T
) => {
  return (
    <>
        <div>
            <div id="dashboard" className="dashboard">
                <aside className="side-menu" role="navigation" id="navigation">
                    <button id="drawer-toggle" className="button-outline small primary">Menu <span id="drawer-toggle-arrow">▼</span></button>
                    <h4 id="logo">Espace Membre</h4>
                    <ul className="hidden-mobile margin-bottom-5" id="drawer">
                        <li>
                            <a href="/account" id="account" 
                                className={`nav-item ${props.activeTab === 'account' ? 'active' : ''}`}>
                                🔓 Mon compte
                                <br/><small>Administrer mon email, mes infos</small>
                            </a>
                        </li>
                        <li className={`nav-sub-menu-container ${props.activeTab === 'community' ? 'active' : ''}`}>
                            <a href="/community" id="community"
                                className={`nav-item`}>
                                <img src="/static/favicon/favicon-16x16.png" /> Communauté
                                <br/>
                                { props.activeTab !== 'community' &&<small>Rechercher un ou une membre, carte des membres, ...</small> }
                            </a>
                            { props.activeTab === 'community' && <ul>
                                <li>
                                    <a href="/community/" id="account" 
                                        // style={{
                                        //     fontSize: '14px',
                                        //     paddingTop: 0,
                                        //     paddingBottom: 0,
                                        //     paddingLeft: 20,
                                        //     marginBottom: 20
                                        // }} 
                                        className={`nav-sub-item active`}>
                                        🔎 Rechercher un ou une membre
                                    </a>
                                </li>
                                <li>
                                    <a href="/map" target="_blank"
                                        // style={{
                                        //     fontSize: '14px',
                                        //     paddingTop: 0,
                                        //     paddingLeft: 20,
                                        //     marginBottom: 20
                                        // }}
                                        className={`nav-sub-item`}>
                                       📍 Carte des membres
                                    </a>
                                </li>

                            </ul>}
                        </li>
                        {/* <li>
                            <a href="/startups" id="startups"
                                className={`nav-item ${props.activeTab === 'startups' ? 'active' : ''}`}>
                                🚀 Startups
                            </a>
                        </li>
                        <li>
                            <a href="/admin" id="admin" 
                                className={`nav-item ${props.activeTab === 'administration' ? 'active' : ''}`}>
                                ⚙️ Administration
                            </a>
                        </li> */}
                        {/* <li>
                            <a href="/newsletters" id="newsletter" 
                                className={`nav-item ${props.activeTab === 'newsletter' ? 'active' : ''}`}>
                                ✉️ Infolettres internes
                            </a>
                        </li> */}
                        {/* <li>
                            <a href="/resources" id="resources"
                                className={`nav-item ${props.activeTab === 'resources' ? 'active' : ''}`}>
                                📕 Ressources
                            </a>
                        </li> */}
                        {/* <li>
                            <a href="/map" id="map" 
                                className={`nav-item ${props.activeTab === 'map' ? 'active' : ''}`}>
                                📍 Carte des membres
                            </a>
                        </li> */}
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
                                className="text-size-caption text-color-darker-grey">Code source de l'espace membre</a>
                        </li>
                    </ul>
                </aside>
                <main role="main" className="main">
                    { Boolean(props.errors.length) && 
                        <div className="notification error">
                            <strong>Erreur : </strong>
                            {props.errors.map((message) => {
                                return message
                            })}
                        </div>
                    }
                    { Boolean(props.messages.length) && <div className="notification">
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
        </div>
    </>
  )
}
