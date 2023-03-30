import React from 'react';
import type { Request } from 'express';

import { hydrateOnClient } from '../../hydrateOnClient'
import { InnerPageLayout } from '../components/InnerPageLayout';
import SESelect from '../components/SESelect';
import DatepickerSelect from '../components/DatepickerSelect';
import { Mission } from '@/models/mission';
import axios from 'axios';
import { DBPullRequest } from '@/models/pullRequests';
import routes from '@/routes/routes';

interface Option {
  key: string,
  name: string
}

interface BaseInfoFormData {
    missions: Mission[],
    end: string,
    start: string,
    previously?: {
        value: string,
        label: string
    }[],
    startups: {
        value: string,
        label: string
    }[],
    role: string
}

interface BaseInfoUpdateProps {
    title: string,
    currentUserId: string,
    errors: string[],
    messages: string[],
    activeTab: string,
    request: Request,
    formData: BaseInfoFormData,
    statusOptions: Option[],
    genderOptions: Option[],
    formValidationErrors: any,
    startupOptions: {
        value: string,
        label: string
    }[],
    username: string,
    updatePullRequest?: DBPullRequest,
    isAdmin: boolean
}

interface FormErrorResponse {
    errors?: Record<string,string[]>
    message: string
}

/* Pure component */
export const BaseInfoUpdate = InnerPageLayout((props: BaseInfoUpdateProps) => {
    const [state, setState] = React.useState<any>({
        selectedName: '',
        ...props,
        formData: {
            ...props.formData,
            start: props.formData.start ? new Date(props.formData.start) : '',
            end: props.formData.end ? new Date(props.formData.end) : ''
        }
    });
    const [formErrors, setFormErrors] = React.useState({});
    const [errorMessage, setErrorMessage] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false)

    const css = ".panel { overflow: hidden; width: auto; }"

    const changeFormData = (key, value) => {
        const formData = state.formData
        formData[key] = value
        setState({
            ...state,
            formData
        })
    }

    const changesExist = () => {
        let changed = false
        if (state.formData.role !== props.formData.role) {
            changed = true
        } else if (state.formData.end.toISOString().split('T')[0] !== props.formData.end) {
            changed = true
        } else if (state.formData.startups.map(s => s.value).sort().join(',') !== props.formData.startups.map(s => s.value).sort().join(',')) {
            changed = true
        } else if (state.formData.previously.map(s => s.value).sort().join(',') !== props.formData.previously.map(s => s.value).sort().join(',')) {
            changed = true
        }
        return changed
    }

    const save = async (event) => {
        if (isSaving) {
            return
        }
        event.preventDefault();
        setIsSaving(true)
        axios.post(routes.ACCOUNT_POST_BASE_INFO_FORM.replace(':username', props.username), {
            ...state.formData,
            startups: state.formData.startups.map(s => s.value),
            previously: state.formData.previously.map(s => s.value),
        }).then(() => {
            window.location.replace('/account');
        }).catch(({ response: { data }} : { response: { data: FormErrorResponse }}) => {
            const ErrorResponse : FormErrorResponse = data
            setErrorMessage(ErrorResponse.message)
            setIsSaving(false)
            if (ErrorResponse.errors) {
                setFormErrors(ErrorResponse.errors)
            }
        })
    }

    return (
        <>
            <div className="module">
            <div>
                <small>
                    <a href="/account">Mon Compte</a> &gt; <a href="">Mise à jour de mes informations</a>
                </small>
            </div>
            <div className="margin-top-m"></div>
            <div className="panel">
                    <h3>Mise à jour de mes informations</h3>
                    { !!props.updatePullRequest && <div className="notification">
                            ⚠️ Une pull request existe déjà sur ta fiche membre. Toi ou un membre de ton équipe doit la merger pour que les changements soit pris en compte
                            <a href={props.updatePullRequest.url} target="_blank">{props.updatePullRequest.url}</a>
                            <br/>(la prise en compte peut prendre 10 minutes.)
                        </div>
                    }
                    { !!errorMessage && 
                        <p className="text-small text-color-red">{errorMessage}</p>
                    }
                    <div className="beta-banner"></div>
                    <form className='no-margin' onSubmit={save}>
                        <div className="form__group">
                            <label htmlFor="role">
                                <strong>Rôle chez BetaGouv :3</strong><br />
                            </label>
                            <input name="role"
                                onChange={(e) => { changeFormData('role', e.currentTarget.value)}}
                                value={state.formData.role}
                                required/>
                            { !!props.formValidationErrors['role'] && 
                                <p className="text-small text-color-red">{formErrors['role']}</p>
                            }
                        </div>
                        <div className="form__group">
                            <label htmlFor="startup">
                                <strong>Produits actuels :</strong><br />
                                Produits auxquels tu participes actuellement.
                            </label>
                            <SESelect
                                startups={props.startupOptions}
                                onChange={(startups) => {
                                    changeFormData('startups', startups)
                                }}
                                isMulti={true}
                                placeholder={"Selectionne ta startup"}
                                defaultValue={props.formData.startups}
                            />
                            { !!formErrors['gender'] && 
                                <p className="text-small text-color-red">{formErrors['startups']}</p>
                            }
                        </div>
                        <div className="form__group">
                            <label htmlFor="startup">
                                <strong>Produits précédents :</strong><br />
                                Produits auxquels tu as participé précédemment.
                            </label>
                            <SESelect
                                startups={props.startupOptions}
                                onChange={(startups) => {
                                    changeFormData('previously', startups)
                                }}
                                isMulti={true}
                                placeholder={"Selectionne ta startup"}
                                defaultValue={props.formData.previously}
                            />
                            { !!formErrors['gender'] && 
                                <p className="text-small text-color-red">{formErrors['startups']}</p>
                            }
                        </div>
                        <div className="form__group">
                            <label htmlFor="end">
                                <strong>Fin de la mission (obligatoire) :</strong><br />
                                Si tu ne la connais pas, mets une date dans 6 mois, tu pourras la corriger plus tard.<br />
                                <i>Au format JJ/MM/YYYY</i>
                            </label>
                            <DatepickerSelect
                                name="endDate"
                                min={'2020-01-31'}
                                title="En format YYYY-MM-DD, par exemple : 2020-01-31" required
                                dateFormat='dd/MM/yyyy'
                                selected={state.formData.end}
                                onChange={(date:Date) => changeFormData('end', date)} />
                            { !!formErrors['nouvelle date de fin'] && 
                                <p className="text-small text-color-red">{formErrors['nouvelle date de fin']}</p>
                            }
                        </div>
                        <input
                            type="submit"
                            disabled={isSaving || !changesExist()}
                            value={isSaving ? `Enregistrement en cours...` : `Enregistrer`}
                            className="button"
                        />
                    </form>
                </div>
            </div>
            <style media="screen">
                {css}
            </style>
        </>
    )
})

hydrateOnClient(BaseInfoUpdate)
