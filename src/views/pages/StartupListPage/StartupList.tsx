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
                        <a href="/startups">Produit</a>
                    </small>
                </div>
                <div className="row">
                    <div className="panel panel-full-width">
                        <h3>
                            Startups
                        </h3>
                        <form className='no-margin' onSubmit={save}>
                            <p>De quel produit voulez-vous voir les infos ?</p>
                            <SESelect
                                startups={props.startupOptions}
                                onChange={(e) => {
                                    setStartup(e.value)
                                }}
                                isMulti={undefined}
                                placeholder={"Selectionne ta startup"}/>
                            <input
                                type="submit"
                                disabled={!startup}
                                value={`Voir cette page`}
                                className="button"
                            />
                        </form>
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
