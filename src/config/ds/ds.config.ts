import makeDS from "@/lib/ds"
import config from ".."

const makeFakeMathods = () => {
    let dossierInt = 0
    return {
        getAllDossiersForDemarche: async(demarcheNumber) => {},
        getDossierForDemarche: async(dossierNumber) => {},
        createPrefillDossier: async(demarcheNumber, {}) => {
            dossierInt = dossierInt + 1
            return {
                dossier_url: 'https://www.demarches-simplifiees.fr/commencer/demande?prefill_token=untoken',
                state: 'prefilled',
                dossier_id: `${dossierInt}==`,
                dossier_number: dossierInt,
                dossier_prefill_token: 'untoken'
            }
        }
    }
}
let DS_METHODS = makeFakeMathods()

if (process.env.NODE_ENV !== 'test') {
  
    try {
        DS_METHODS = makeDS({
            DS_TOKEN: config.DS_TOKEN
        })
      
    } catch (e) {
      console.error(e)
      process.exit(1)
    }
} else {
    console.log('Emails will go through a FAKE email service (no mails sent).')
}
  
export default {
    ...DS_METHODS
}
