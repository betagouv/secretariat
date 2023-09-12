import React from 'react';
import type { Request } from 'express';

import { hydrateOnClient } from '@views/hydrateOnClient'
import { InnerPageLayout } from '@components/InnerPageLayout';
import SESelect from '@components/SESelect';

interface Option {
    value: string,
    label: string
}

interface StartupListProps {
    title: string,
    currentUserId: string,
    errors: string[],
    messages: string[],
    activeTab: string,
    subActiveTab: string,
    request: Request,
    startupOptions: Option[],
    isAdmin: boolean
}

/* Pure component */
export const StartupList = InnerPageLayout((props: StartupListProps) => {
    const css = ".panel { overflow: hidden; width: auto; min-height: 100vh; }"
    const [startup, setStartup] = React.useState('')
    const save = (event) => {
        event.preventDefault();
        window.location.href = `/startups/${startup}`;
    }
    return (
        <>
            <div className="module">
                <div>
                    <small>
                    <a href="/startups">Produit</a> &gt; <a href="/startups">Rechercher un produit</a>
                    </small>
                </div>
                <div className="margin-top-m"></div>
                <div className="row">
                    <div className="panel panel-full-width">
                        <h3>
                            Rechercher un produit
                        </h3>
                        <form className='no-margin' onSubmit={save}>
                            <p>De quel produit voulez-vous voir les infos ?</p>
                            <SESelect
                                startups={props.startupOptions}
                                onChange={(e) => {
                                    setStartup(e.value)
                                }}
                                isMulti={undefined}
                                placeholder={"Sélectionne un produit"}/>
                            <input
                                type="submit"
                                disabled={!startup}
                                value={`Voir cette page`}
                                className="button"
                            />
                        </form>
                        <br></br>
                        <br></br>
                        Pour créer une nouvelle fiche produit c'est ici : <a href="/startups/create-form">Créer un produit</a>
                    </div>
                </div>
            </div>
            <style media="screen">
                {css}
            </style>
        </>
    )
})

hydrateOnClient(StartupList)
