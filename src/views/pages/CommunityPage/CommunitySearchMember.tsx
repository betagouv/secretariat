import React from 'react'

import MemberSelect from '../components/MemberSelect';
import { CommunityProps } from '.';

const css = ".panel { min-height: 400px; }" // to have enough space to display dropdown

/* Pure component */
export const CommunitySearchMember = (props: CommunityProps) => {

    const [state, setState] = React.useState<any>({
        users: [],
        selectedName: '',
        ...props,
    });

    const changeFormData = (key, value) => {
        setState({
            ...state,
            key: value
        })
    }

    return (
    <>
        <div className="module">
            <div className="panel panel-full-width">
                <h3>
                    Rechercher un ou une membre
                </h3>
                <form className="no-margin" action="/community">
                    <div className="form__group">
                        <label><strong>Nom ou prénom du membre</strong></label>
                        <MemberSelect
                            name="username"
                            placeholder="Sélectionner un membre"
                            onChange={(e) => changeFormData('username', e.value)}
                            members={props.users.map(u => ({
                                value: u.id,
                                label: u.fullname
                            }))}
                            defaultValue={undefined}></MemberSelect>
                    </div>
                    <div className="form__group">
                        <button className="button no-margin" type="submit">Voir la fiche</button>
                    </div>
                </form>
                <br />
                <p>
                    Le membre que vous cherchez n'existe pas ? Vous pouvez lui donner le lien du <a href="/onboarding">formulaire de création de fiche</a>.
                </p>
            </div>
        </div>
        <style media="screen">
            {css}
        </style>
    </>)
}
