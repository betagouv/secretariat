import React from 'react';
import type { Request } from 'express';

import { hydrateOnClient } from '../../hydrateOnClient'
import { InnerPageLayout } from '../components/InnerPageLayout';
import SESelect from '../components/SESelect';
import DatepickerSelect from '../components/DatepickerSelect';
import { Mission } from '@/models/mission';
import axios from 'axios';

interface Option {
  key: string,
  name: string
}

interface BaseInfoFormData {
    missions: Mission[],
    end: string,
    start: string,
    startups: string[],
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
  startups: string[],
  startupOptions: Option[],
  username: string,
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
    const css = ".panel { overflow: hidden; width: auto; }"

    const changeFormData = (key, value) => {
        const formData = state.formData
        formData[key] = value
        setState({
            ...state,
            formData
        })
    }

    const save = async (event) => {
        event.preventDefault();
        axios.post(`/account/base-info/${props.username}`, {
            ...state.formData,
            startups: state.formData.startups.map(s => s.value)
        }).then(() => {
            window.location.replace('/account');
        }).catch(() => {
            alert('Erreur')
        })
    }
    console.log(state.formData)
    return (
        <>
        <div className="module">
        <div className="panel margin-top-m">
            <h3>Mise à jour de mes informations</h3>
            <div className="beta-banner"></div>
            <form onSubmit={save}>
                <div className="form__group">
                    <label htmlFor="role">
                        <strong>Rôle chez BetaGouv</strong><br />
                    </label>
                    <input name="role"
                        onChange={(e) => { changeFormData('role', e.currentTarget.value)}}
                        value={state.formData.role}
                        required/>
                </div>
                <div className="form__group">
                    <label htmlFor="startup">
                        <strong>Startups (actuelles)</strong><br />
                    </label>
                    <SESelect
                        startups={props.startupOptions}
                        onChange={(startups) => {
                            changeFormData('startups', startups)
                        }}
                        isMulti={true}
                        placeholder={"Selectionne ta startup"}
                        defaultValue={props.formData.startups.map(startup => ({
                            label: startup,
                            value: startup
                        }))}
                    />
                    <input type="hidden" name="startup" value={state.formData.startups} required/>
                </div>
                <div className="form__group">
                    <label htmlFor="end">
                        <strong>Fin de la mission (obligatoire)</strong><br />
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
                    { !!props.formValidationErrors['fin de la mission'] && 
                        <p className="text-small text-color-red">{props.formValidationErrors['fin de la mission']}</p>
                    }
                    { !!props.formValidationErrors['date de fin'] && 
                        <p className="text-small text-color-red">{props.formValidationErrors['date de fin']}</p>
                    }
                    {/* <input name="end"
                        value={state.formData.end ? formatDate(state.formData.end) : ''}
                        required hidden/> */}
                </div>
                {/* <div className="form__group">
                    <label htmlFor="startup">
                        <strong>Mes précédentes Startups</strong><br />
                    </label>
                    <SESelect
                        startups={props.startupOptions}
                        onChange={(startups) => setState({
                        ...state,
                        startups
                        })}
                        isMulti={true}
                        placeholder={"Selectionne ta startup"}
                        defaultValue={props.formData.startups.map(startup => ({
                            label: startup,
                            value: startup
                        }))}
                    />
                    <input type="hidden" name="startup" value={state.formData.startups} required/>
                </div> */}
                <input
                    type="submit"
                    value="Enregistrer"
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
