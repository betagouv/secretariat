import makeDS from '@/lib/ds';
import config from '..';

const makeFakeMathods = () => {
  let dossierInt = 0;
  let dossiers = [];
  return {
    getAllDossiersForDemarche: async (demarcheNumber) => {
      return dossiers;
    },
    getDossierForDemarche: async (dossierNumber) => {
      return dossiers.find((d) => d.dossier_number === dossierNumber);
    },
    createPrefillDossier: async (demarcheNumber, {}) => {
      dossierInt = dossierInt + 1;
      const dossier = {
        dossier_url:
          'https://www.demarches-simplifiees.fr/commencer/demande?prefill_token=untoken',
        state: 'prefilled',
        dossier_id: `${dossierInt}==`,
        dossier_number: dossierInt,
        dossier_prefill_token: 'untoken',
        annotations: [
          {
            label: 'Status',
            stringValue: '',
          },
        ],
      };
      dossiers.push(dossier);
      return dossier;
    },
  };
};
let DS_METHODS = makeFakeMathods();

if (process.env.NODE_ENV !== 'test') {
  try {
    DS_METHODS = makeDS({
      DS_TOKEN: config.DS_TOKEN,
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
} else {
  console.log('DS wil use fake ds api.');
}

export default {
  ...DS_METHODS,
};
