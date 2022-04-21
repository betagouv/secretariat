import type { Request } from 'express'
import React from 'react'
import { PageLayout } from '../../components/PageLayout'
import { hydrateOnClient } from '../../../lib/hydrateOnClient'

interface Props {
  request: Request,
  errors: any[],
  messages: any[],
  domain: string,
  next: string,
}

/* Pure component */
export const Home = PageLayout(function (props: Props) {
  return (
    <>
    <div className="container container-small">

      <p>
        Gère ton compte email (mot de passe, redirections, etc) et les membres de la communauté (arrivées et départs).
      </p>

      { !!props.errors.length &&
        <div className="notification error">
          <strong>Erreur : </strong>{ props.errors }
        </div>
      }

      <div className="panel margin-top-m">
        <h4>Me connecter</h4>

        { !!props.messages.length && 
          <div className="notification">{ props.messages }</div>
        }
        <form action={`/login${props.next}`} method="POST" id="login_form" onSubmit={e => e.preventDefault()}>
          <label htmlFor="emailInput"><b>Mon email</b></label>
          <div className="input__group">
            <input name="emailInput" type="email" placeholder="prenom.nom@beta.gouv.fr"  autoComplete="username"/>
          </div>
          <button className="button" id="primary_email_button">Recevoir le lien de connexion</button>
          <span><a href="#forgot">J'ai oublié mon email</a></span>
        </form>
      </div>

      <div className="panel border-left-primary">
        <h6>👋&nbsp;Tu viens d'arriver ?</h6>
        <p>Crée ta fiche Github pour rejoindre la communauté. Tu pourras obtenir une adresse email @{ props.domain }.</p>
        <p><a className="button" href="/onboarding" role="button">Créer ma fiche Github</a></p>
      </div>

      <div className="panel border-left-primary" id="forgot">
          <h6>🆘 Besoin d'aide ?</h6>

          <ul>
            <li><b>J'ai oublié mon email pour me connecter :</b> l'accès au secrétariat se fait avec une adresse du service public (@beta.gouv.fr, @pole-emploi.fr...) ou un email secondaire (celui sur lequel tu as reçu tes accès). En cas d'oubli, demande de l'aide à un··e admin le Mattermost <a href="https://mattermost.incubateur.net/betagouv/channels/incubateur-secretaria" target="_blank" title="Lien vers le channel secretariat sur Mattermost">~incubateur-secretaria</a></li>
            <li><b>Je n'arrive pas à accéder à mes emails :</b> <a href="https://doc.incubateur.net/communaute/travailler-a-beta-gouv/jutilise-les-outils-de-la-communaute/emails#2.-configurer-la-reception-et-lenvoi-demails" target="_blank" title="lien vers la documentation pour se connecter à sa boite mail">configure ton client webmail</a>.</li>
          </ul>
      </div>
    </div>
    </>
  )
})

hydrateOnClient(Home)