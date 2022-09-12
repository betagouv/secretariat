import React from 'react';
import type { Request } from 'express';

import { hydrateOnClient } from '../../hydrateOnClient'
import { InnerPageLayout } from '../components/InnerPageLayout';
import CitySelect from '../components/CitySelect';

interface CommuneInfo {
    nom: string,
    codesPostaux?: string[]
}

interface Option {
  key: string,
  name: string
}

interface FormData {
    gender: string,
    legal_status: string,
    workplace_insee_code: string,
    tjm: number,
    secondary_email: string,
    osm_city: string,
    average_nb_of_days: number
}

interface InfoUpdateProps {
  title: string,
  currentUserId: string,
  errors: string[],
  messages: string[],
  activeTab: string,
  request: Request,
  formData: FormData,
  statusOptions: Option[],
  genderOptions: Option[],
  formValidationErrors: any,
  communeInfo: CommuneInfo,
  startups: string[],
  startupOptions: Option[],
}

/* Pure component */
export const InfoUpdate = InnerPageLayout((props: InfoUpdateProps) => {
    const [state, setState] = React.useState<any>({
        selectedName: '',
        ...props,
    });
    const css = ".panel { overflow: scroll; }"

    const changeFormData = (key, value) => {
        const formData = state.formData
        formData[key] = value
        setState({
            ...state,
            formData
        })
    }

    const handleGenderChange = (e) => {
        changeFormData('gender', e.currentTarget.value)
    }

    const handleLegalStatusChange = (e) => {
        changeFormData('legal_status', e.currentTarget.value)
    }

    const handleTJMChange = (e) => {
        changeFormData('tjm', e.currentTarget.value)
    }

    const handleSecondaryEmail = (e) => {
        changeFormData('secondary_email', e.currentTarget.value)

    }

    const handleCitySelect = (newValue) => {
        if (newValue.isOSM) {
            changeFormData('osm_city', JSON.stringify(newValue))
            changeFormData('workplace_insee_code', '')
        } else {
            changeFormData('workplace_insee_code', newValue.value)
            changeFormData('osm_city', '')
        }
    }

    const getDefaultValue = () => {
        if (props.formData.workplace_insee_code) {
            return props.communeInfo ? `${props.communeInfo.nom}  (${props.communeInfo.codesPostaux[0]})`: null
        } else if (state.formData.osm_city) {
            return JSON.parse(props.formData.osm_city).label
        } 
        return ''
    }

    return (
        <>
        <div className="module">
                    <div className="row">
                    <div className="panel margin-top-m">
                        <h3>Mise à jour de mes informations</h3>

                        <div className="beta-banner"></div>
                        <form action="/account/info" method="POST">
                            <h4>Participez à notre observatoire statisique </h4>
                            ⚠️ À aucun moment nous n'afficherons vos nom et prénom.
                            <div className="form__group">
                                <p>
                                    
                                </p>
                                <div className="form__group">
                                    <label htmlFor="gender">
                                        <strong>Genre</strong><br />
                                        Cette information est utilisée uniquement pour faire des statistiques. Elle n'est pas affichée.
                                    </label>
                                    <select
                                        name="gender"
                                        value={state.formData.gender}
                                        onChange={handleGenderChange}
                                        placeholder="Sélectionne une valeur" required>
                                        <>
                                        { props.genderOptions.map((gender) => { 
                                            return <option
                                                key={gender.key}
                                                value={gender.key}
                                                >{gender.name}</option>
                                        })}
                                        </>
                                    </select>
                                    { !!props.formValidationErrors['gender'] && 
                                    <p className="text-small text-color-red">{props.formValidationErrors['gender']}</p>
                                    }
                                </div>
                            </div>
                            <div className="form__group">
                                <label htmlFor="legal_status">
                                    <strong>Ton statut legal de ton entreprise ou de ton post</strong><br />
                                </label>
                                { props.statusOptions.map((legal_status) => {
                                    
                                    return (<span key={legal_status.key}><input type="radio" name="legal_status"
                                        value={legal_status.key}
                                        onChange={handleLegalStatusChange}
                                        checked={legal_status.key === state.formData.legal_status}
                                        required/>{legal_status.name}<br/></span>)

                                })}
                                { !!props.formValidationErrors['legal_statut'] && 
                                    <p className="text-small text-color-red">{props.formValidationErrors['legal_statut']}</p>
                                }
                            </div>
                            <div className="form__group">
                                <label htmlFor="tjm">
                                    <strong>TJM  HT (si tu es indépendant)</strong><br />
                                    Cette information est utilisée uniquement pour faire des statistiques. Elle n'est pas affichée.
                                    <input
                                        onChange={handleTJMChange}
                                        value={state.formData.tjm || 0}
                                        id="tjm" name="tjm" type="number" placeholder="TJM  ht en euros"/>
                                </label>
                            </div>
                            <div className="form__group">
                                <label htmlFor="averageNbOfDays">
                                    <strong>Nombre de jours moyen travaillés par semaine</strong><br />
                                        <input
                                        defaultValue={state.formData.average_nb_of_days || 0}
                                        id="averageNbOfDays"
                                        name="average_nb_of_days"
                                        type="number"
                                        step="0.5"
                                        placeholder="Nombre de jours moyen"
                                        min={0}
                                        max={5}/>
                                </label>
                            </div>

                            <h4>Participe à la carte des membres (non anonyme)</h4>
                            <div className="form__group">
                                <label htmlFor="workplace_insee_code">
                                    <strong>Ton lieu de travail</strong><br />
                                    Cette information est utilisée pour faire une carte des membres de la communauté et découvrir qui travail dans la même ville
                                    <br></br>
                                    <CitySelect
                                        defaultValue={getDefaultValue()}
                                        onChange={handleCitySelect}
                                        placeholder={'Commune ou code postale'}
                                    ></CitySelect>
                                    <input
                                        name="workplace_insee_code"
                                        type="text"
                                        id="input-insee-code"
                                        readOnly={true}
                                        value={state.formData.workplace_insee_code} hidden/>
                                    { !!props.formValidationErrors['workplace_insee_code'] && 
                                        <p className="text-small text-color-red">{props.formValidationErrors['workplace_insee_code']}</p>
                                    }
                                    <input
                                        name="osm_city"
                                        type="text"
                                        id="input-osm-city"
                                        readOnly={true}
                                        value={state.formData.osm_city} hidden/>
                                </label>
                            </div>
                            <h4>Autre</h4>
                            <div className="form__group">
                                <label htmlFor="secondary_email">
                                    <strong>Email de récupération</strong><br />
                                    L'email de récupération est utile pour récupérer son mot de passe ou garder contact après ton départ.
                                    <input
                                        onChange={handleSecondaryEmail}
                                        value={state.formData.secondary_email || ''}
                                        id="secondary_email" name="secondary_email" type="email" placeholder="un email de recupération"/>
                                </label>
                                { !!props.formValidationErrors['secondary_email'] &&
                                    <p className="text-small text-color-red">{props.formValidationErrors['secondary_email']}</p>
                                }
                            </div>
                            <button className="button" type="submit">Enregistrer</button>
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

hydrateOnClient(InfoUpdate)
