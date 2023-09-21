import React from 'react';
import SponsorDomainSelect from './SponsorDomainSelect';
import { Sponsor, SponsorDomaineMinisteriel, SponsorType } from '@/models/sponsor';
import SponsorTypeSelect from './SponsorTypeSelect';

// import style manually

interface SponsorForm {
    addSponsor: (sponsor: Sponsor) => void
}


/* Pure component */
export const SponsorForm = (props: SponsorForm) => {
    const [acronym, setAcronym] = React.useState('')
    const [name, setName] = React.useState('')
    const [type, setType] = React.useState('')
    const [domaine, setDomaine] = React.useState('')


    const save = async () => {
        props.addSponsor({
            name,
            domaine_ministeriel: domaine as SponsorDomaineMinisteriel,
            type: type as SponsorType,
            acronym
        })
    }

    function hasChanged() {
        return name && domaine && type && acronym
    }
    let disabled = false
    
    if (!hasChanged()) {
        disabled = true
    }
    return (
        <>
        <div>
            {<>

                <form className='no-margin' onSubmit={save}>
                    <div className="form__group">
                        <label htmlFor="name">
                            <strong>Nom du sponsor</strong><br />
                        </label>
                        <input name="link"
                        onChange={(e) => { setName(e.currentTarget.value)}}
                        value={name}/>
                    </div>
                    <div className="form__group">
                        <label htmlFor="acronym">
                            <strong>Acronym du sponsor :</strong><br />
                        </label>
                        <input name="github"
                        onChange={(e) => { setAcronym(e.currentTarget.value)}}
                        value={acronym}/>
                    </div>
                    <div className="form__group">
                        <label htmlFor="type">
                            <strong>Type</strong><br />
                        </label>
                        <SponsorTypeSelect
                            isMulti={false}
                            onChange={(value) => { setType(value)}}
                            value={type}/>
                    </div>
                    <div className="form__group">
                        <label htmlFor="domaine">
                            <strong>Domaine ministériel</strong><br />
                        </label>
                        <SponsorDomainSelect
                            isMulti={false}
                            onChange={(value) => { setDomaine(value)}}
                            value={domaine}/>
                    </div>
                    <input
                        type="submit"
                        disabled={disabled}
                        value={`Enregistrer`}
                        className="button"
                    />
                </form>
            </>}
        </div>
    </>
    )
}

export default SponsorForm
