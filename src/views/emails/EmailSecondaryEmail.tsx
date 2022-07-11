import React from 'react'
import { hydrateOnClient } from '../hydrateOnClient'
import { Member } from '../../models/member'

interface Props {
  member: Member,
}

/* Pure component */
export const EmailSecondaryEmail = function (props: Props) {
  return (
    <>
        <p>Bonjour {props.member.fullname}</p>
            
        <p>Tu n'as pas d'email secondaire défini.</p>
        <p>L'email secondaire permet de te connecter à l'espace membre pour y changer ton mot de passe pour ton adresse @beta.gouv.fr</p>
        <p>C'est utile si tu l'as perdu ou si ton email beta.gouv.fr a été suspendu temporairement.</p>

        <p>Tu peux le mettre à jour en te rendant sur l'espace membre : 
            <a href="https://espace-membre.incubateur.net/account#change-secondary-email">https://espace-membre.incubateur.net/account#change-secondary-email</a>
        </p>

        <p>🤖 Ceci est un message automatique envoyé par l'app espace membre</p>
    </>
  )
}

hydrateOnClient(EmailSecondaryEmail)
