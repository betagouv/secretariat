import axios from "axios";



const makeDS = ({ DS_TOKEN }) => {
    const getDSConfig = () => {
        if (!DS_TOKEN) {
          const errorMessage =
            'Unable to launch ds api calls without env var DS_TOKEN';
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
        return {
          headers: {
            Authorization: `Bearer ${DS_TOKEN}`,
            'Content-Type': 'application/json'
          },
        };
    };
    
    function getAllDossiersForDemarche(demarcheId) {
        return axios.post(
            `https://www.demarches-simplifiees.fr/api/v2/graphql`,
            JSON.stringify({ 
                query: `
                    query getDemarche($demarcheNumber: Int!) {
                        demarche(number: $demarcheNumber) {
                            id
                            dossiers {
                                nodes {
                                    id
                                    demandeur { 
                                        ... on PersonnePhysique { 
                                            civilite
                                            nom
                                            prenom
                                        }
                                        ... on PersonneMorale {
                                            siret
                                        }
                                    }
                                }
                            }
                        }
                    }`,
                variables: {
                    "demarcheNumber": demarcheId,
                }
            }), getDSConfig()).then(resp => resp.data.data.demarche.dossiers);
    }
    
    
    function getDossierForDemarche(dossierNumber){
        return axios.post(
            `https://www.demarches-simplifiees.fr/api/v2/graphql`,
            JSON.stringify({ 
                query: `
                    query getDossier(
                        $dossierNumber: Int!
                        $includeRevision: Boolean = false
                        $includeService: Boolean = false
                        $includeChamps: Boolean = true
                        $includeAnotations: Boolean = true
                        $includeTraitements: Boolean = true
                        $includeInstructeurs: Boolean = true
                        $includeAvis: Boolean = false
                        $includeMessages: Boolean = false
                        $includeGeometry: Boolean = false
                    ) {
                        dossier(number: $dossierNumber) {
                        ...DossierFragment
                        demarche {
                            ...DemarcheDescriptorFragment
                        }
                        }
                    }
                    fragment ServiceFragment on Service {
                        nom
                        siret
                        organisme
                        typeOrganisme
                      }
                    
                      fragment DossierFragment on Dossier {
                        id
                        number
                        archived
                        state
                        dateDerniereModification
                        dateDepot
                        datePassageEnConstruction
                        datePassageEnInstruction
                        dateTraitement
                        dateExpiration
                        dateSuppressionParUsager
                        motivation
                        instructeurs @include(if: $includeInstructeurs) {
                          id
                          email
                        }
                        traitements @include(if: $includeTraitements) {
                          state
                          emailAgentTraitant
                          dateTraitement
                          motivation
                        }
                        champs @include(if: $includeChamps) {
                          ...ChampFragment
                          ...RootChampFragment
                        }
                        annotations @include(if: $includeAnotations) {
                          ...ChampFragment
                          ...RootChampFragment
                        }
                        avis @include(if: $includeAvis) {
                          ...AvisFragment
                        }
                        messages @include(if: $includeMessages) {
                          ...MessageFragment
                        }
                      }
                    
                      fragment DemarcheDescriptorFragment on DemarcheDescriptor {
                        id
                        number
                        title
                        description
                        state
                        declarative
                        dateCreation
                        datePublication
                        dateDerniereModification
                        dateDepublication
                        dateFermeture
                        notice { url }
                        deliberation { url }
                        demarcheUrl
                        cadreJuridiqueUrl
                        service @include(if: $includeService) {
                          ...ServiceFragment
                        }
                        revision @include(if: $includeRevision) {
                          ...RevisionFragment
                        }
                      }
                    
                      fragment RevisionFragment on Revision {
                        id
                        datePublication
                        champDescriptors {
                          ...ChampDescriptorFragment
                          ... on RepetitionChampDescriptor {
                            champDescriptors {
                              ...ChampDescriptorFragment
                            }
                          }
                        }
                        annotationDescriptors {
                          ...ChampDescriptorFragment
                          ... on RepetitionChampDescriptor {
                            champDescriptors {
                              ...ChampDescriptorFragment
                            }
                          }
                        }
                      }
                    
                      fragment ChampDescriptorFragment on ChampDescriptor {
                        __typename
                        id
                        label
                        description
                        required
                        ... on DropDownListChampDescriptor {
                          options
                          otherOption
                        }
                        ... on MultipleDropDownListChampDescriptor {
                          options
                        }
                        ... on LinkedDropDownListChampDescriptor {
                          options
                        }
                        ... on PieceJustificativeChampDescriptor {
                          fileTemplate {
                            ...FileFragment
                          }
                        }
                        ... on ExplicationChampDescriptor {
                          collapsibleExplanationEnabled
                          collapsibleExplanationText
                        }
                        ... on PaysChampDescriptor {
                          options {
                            name
                            code
                          }
                        }
                        ... on RegionChampDescriptor {
                          options {
                            name
                            code
                          }
                        }
                        ... on DepartementChampDescriptor {
                          options {
                            name
                            code
                          }
                        }
                      }
                    
                      fragment AvisFragment on Avis {
                        id
                        question
                        reponse
                        dateQuestion
                        dateReponse
                        claimant {
                          email
                        }
                        expert {
                          email
                        }
                        attachments {
                          ...FileFragment
                        }
                      }
                    
                      fragment MessageFragment on Message {
                        id
                        email
                        body
                        createdAt
                        attachments {
                          ...FileFragment
                        }
                      }
                    
                      fragment GeoAreaFragment on GeoArea {
                        id
                        source
                        description
                        geometry @include(if: $includeGeometry) {
                          type
                          coordinates
                        }
                        ... on ParcelleCadastrale {
                          commune
                          numero
                          section
                          prefixe
                          surface
                        }
                      }
                    
                      fragment RootChampFragment on Champ {
                        ... on RepetitionChamp {
                          rows {
                            champs {
                              ...ChampFragment
                            }
                          }
                        }
                        ... on CarteChamp {
                          geoAreas {
                            ...GeoAreaFragment
                          }
                        }
                        ... on DossierLinkChamp {
                          dossier {
                            id
                            number
                            state
                          }
                        }
                      }
                    
                      fragment ChampFragment on Champ {
                        id
                        __typename
                        label
                        stringValue
                        ... on DateChamp {
                          date
                        }
                        ... on DatetimeChamp {
                          datetime
                        }
                        ... on CheckboxChamp {
                          checked: value
                        }
                        ... on DecimalNumberChamp {
                          decimalNumber: value
                        }
                        ... on IntegerNumberChamp {
                          integerNumber: value
                        }
                        ... on CiviliteChamp {
                          civilite: value
                        }
                        ... on LinkedDropDownListChamp {
                          primaryValue
                          secondaryValue
                        }
                        ... on MultipleDropDownListChamp {
                          values
                        }
                        ... on PieceJustificativeChamp {
                          files {
                            ...FileFragment
                          }
                        }
                        ... on AddressChamp {
                          address {
                            ...AddressFragment
                          }
                        }
                        ... on CommuneChamp {
                          commune {
                            name
                            code
                          }
                          departement {
                            name
                            code
                          }
                        }
                        ... on DepartementChamp {
                          departement {
                            name
                            code
                          }
                        }
                        ... on RegionChamp {
                          region {
                            name
                            code
                          }
                        }
                        ... on PaysChamp {
                          pays {
                            name
                            code
                          }
                        }
                        ... on SiretChamp {
                          etablissement {
                            ...PersonneMoraleFragment
                          }
                        }
                      }
                    
                      fragment PersonneMoraleFragment on PersonneMorale {
                        siret
                        siegeSocial
                        naf
                        libelleNaf
                        address {
                          ...AddressFragment
                        }
                        entreprise {
                          siren
                          capitalSocial
                          numeroTvaIntracommunautaire
                          formeJuridique
                          formeJuridiqueCode
                          nomCommercial
                          raisonSociale
                          siretSiegeSocial
                          codeEffectifEntreprise
                          dateCreation
                          nom
                          prenom
                          attestationFiscaleAttachment {
                            ...FileFragment
                          }
                          attestationSocialeAttachment {
                            ...FileFragment
                          }
                        }
                        association {
                          rna
                          titre
                          objet
                          dateCreation
                          dateDeclaration
                          datePublication
                        }
                      }
                    
                      fragment FileFragment on File {
                        filename
                        contentType
                        checksum
                        byteSize: byteSizeBigInt
                        url
                      }
                    
                      fragment AddressFragment on Address {
                        label
                        type
                        streetAddress
                        streetNumber
                        streetName
                        postalCode
                        cityName
                        cityCode
                        departmentName
                        departmentCode
                        regionName
                        regionCode
                      }
                    
                `,
                variables: {
                    "dossierNumber": dossierNumber
                }})
        , getDSConfig()).then(resp => resp.data.data.dossier);
    }

    function createPrefillDossier(demarcheId, {
        firstname,
        lastname,
        date,
        attributaire
    }) : Promise<{  
          dossier_url: string,
          state: string,
          dossier_id: string,
          dossier_number: number,
          dossier_prefill_token: string
    }> {
        return axios.post(`https://www.demarches-simplifiees.fr/api/public/v1/demarches/${demarcheId}/dossiers`, {
          "champ_Q2hhbXAtNjYxNzM5": firstname,
          "champ_Q2hhbXAtNjYxNzM3": lastname,
          "champ_Q2hhbXAtNjYxNzM4": attributaire.split('/')[1],
          "champ_Q2hhbXAtNjcxODAy": date,
          "champ_Q2hhbXAtMzE0MzkxNA":["Locaux SEGUR 5.413, 5.416, 5.420, 5.425, 5.424, 5.428 et cantine"],
          // "champ_Q2hhbXAtMzE0MzkxNA":["Locaux SEGUR 5.413, 5.416, 5.420, 5.425, 5.424, 5.428 et cantine","Parking"],
          // "champ_Q2hhbXAtMzE4MjQ0Ng":"Texte court",
          // "champ_Q2hhbXAtMzE4MjQ0Nw":"true",
          // "champ_Q2hhbXAtMzE4MjQ0Mw":"Locaux SEGUR 5.413, 5.416, 5.420, 5.425, 5.424, 5.428 et cantine"
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(resp => {
          return resp.data
        }).catch(e => {
          console.log(e)
        })
    }

    return {
        getDossierForDemarche,
        getAllDossiersForDemarche,
        createPrefillDossier
    }
}

export default makeDS