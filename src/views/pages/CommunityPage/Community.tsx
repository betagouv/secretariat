import React from 'react'
import type { Request } from 'express'
import { Member } from 'src/models/member';
import { InnerPageLayout } from '../components/InnerPageLayout';
import { hydrateOnClient } from '../../hydrateOnClient'
import MemberSelect from '../components/MemberSelect';
  
interface CommunityProps {
    title: string,
    currentUserId: string,
    errors: string[],
    messages: string[],
    users: Member[],
    activeTab: string,
    request: Request,
}
  


/* Pure component */
export const Community = InnerPageLayout((props: CommunityProps) => {
    const [state, setState] = React.useState<any>({
        selectedName: '',
        ...props,
    });
    const changeFormData = (key, value) => {
        const formData = state.formData
        formData[key] = value
        setState({
            ...state,
            formData
        })
    }

    return (
    <>
        <div className="module">
            <div className="panel panel-full-width">
                <h3>
                    Rechercher
                </h3>
                <form className="no-margin" action="/community">
                    <div className="form__group">
                        <label><strong>Nom ou prénom du membre</strong></label>
                        <MemberSelect
                            name="username"
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
    </>)
})

hydrateOnClient(Community)
