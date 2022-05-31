import React from 'react'
import { hydrateOnClient } from '../../hydrateOnClient'
import type { Request } from 'express'
import { InnerPageLayout } from '../components/InnerPageLayout';
import { searchCommunes } from '../../../lib/searchCommune';
import SESelect from '../components/SESelect';

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
    secondary_email: string
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
  formValidationErrors: Object,
  communeInfo: CommuneInfo,
  startups: string[],
  startupOptions: Option[],
}

/* Pure component */
export const InfoUpdate = InnerPageLayout((props: InfoUpdateProps) => {
  const [state, setState] = React.useState<any>({
    selectedName: ''
  });

  const css = ".panel { overflow: scroll; }"
  return (
    <>
      <div className="module">
                <div className="row">
                <div className="panel margin-top-m">
                    <h3>Mise à jour de mes informations</h3>

                    <div className="beta-banner"></div>
                    <form action={`/login`} method="POST" id="login_form">
                        <h4>Tes infos persos</h4>
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
                                    onChange={() => {}}
                                    placeholder="Sélectionne une valeur" required>
                                    <>
                                    <option value=""></option>
                                    { props.genderOptions.map((gender) => { 
                                        <option
                                            value={gender.key}
                                            selected={gender.key === props.formData.gender}>{gender.name}</option>
                                    })}
                                    </>
                                </select>
                                { !!props.formValidationErrors['gender'] && 
                                <p className="text-small text-color-red">{props.formValidationErrors['gender']}</p>
                                }
                            </div>
                        </div>

                        <div className="form__group">
                            <label htmlFor="workplace_insee_code">
                                <strong>Lieu de travail</strong><br />
                                Cette information est utilisée pour faire une carte des membres de la communauté 
                                <input
                                    placeholder="Commune ou code postale"
                                    type="text"
                                    onChange={() => searchCommunes(event)}
                                    value={props.communeInfo ? `${props.communeInfo.nom} (${props.communeInfo.codesPostaux[0]})`: ''}
                                    id="input-commune"/>
                                <input
                                    name="workplace_insee_code"
                                    type="text"
                                    id="input-insee-code"
                                    onChange={() => {}}
                                    value={props.formData.workplace_insee_code} hidden/>
                                { !!props.formValidationErrors['workplace_insee_code'] && 
                                    <p className="text-small text-color-red">{props.formValidationErrors['workplace_insee_code']}</p>
                                }
                                <ul id="list-container-city"
                                >
                                </ul>
                            </label>
                        </div>
                        <div className="form__group">
                            <label htmlFor="legal_status">
                                <strong>Statut legal de ton entreprise</strong><br />
                            </label>
                            { props.statusOptions.map((legal_status) => {
                                
                                return (<><input type="radio" name="legal_status"
                                    value={legal_status.key}
                                    onChange={() => {}}
                                    checked={legal_status.key === props.formData.legal_status}
                                    required/>{legal_status.name}<br/></>)

                            })}
                            { !!props.formValidationErrors['legal_statut'] && 
                                <p className="text-small text-color-red">{props.formValidationErrors['legal_statut']}</p>
                            }
                        </div>
                        <div className="form__group">
                            <label htmlFor="tjm">
                                <strong>TJM moyen HT (si tu es indépendant)</strong><br />
                                Cette information est utilisée uniquement pour faire des statistiques. Elle n'est pas affichée.
                                <input
                                    onChange={() => {}}
                                    value={props.formData.tjm}
                                    id="tjm" name="tjm" type="number" placeholder="TJM moyen ht en euros"/>
                            </label>
                        </div>
                        <div className="form__group">
                            <label htmlFor="startups">
                                <strong>Startups</strong><br />
                                Startups.
                                <SESelect
                                    startups={props.startupOptions}
                                    onChange={(startups) => setState({
                                    ...state,
                                    startups
                                    })} />
                            </label>
                        </div>
                        <div className="form__group">
                            <label htmlFor="secondary_email">
                                <strong>Email de récupération</strong><br />
                                L'email de récupération est utile pour récupérer son mot de passe ou garder contact après ton départ.
                                <input
                                    onChange={() => {}}
                                    value={props.formData.secondary_email}
                                    id="secondary_email" name="secondary_email" type="email" placeholder="un email de recupération"/>
                            </label>
                            { !!props.formValidationErrors['secondary_email'] &&
                                <p className="text-small text-color-red">{props.formValidationErrors['secondary_email']}</p>
                            }
                        </div>
                        <button className="button" type="submit">Changer ces informations</button>
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
