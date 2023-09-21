import React from 'react';
import Modal from 'react-modal';
import SESponsorSelect from "../SESponsorSelect"
import { SponsorForm } from '../SponsorForm/SponsorForm';
import { Sponsor } from '@/models/sponsor';

const SponsorBlock = ({ setSponsors, sponsors, setNewSponsors, newSponsors }) => {

    const [modalIsOpen, setIsOpen] = React.useState(false);

    function openModal() {
        setIsOpen(true);
    }

    function afterOpenModal() {
        // references are now sync'd and can be accessed.
        //subtitle.style.color = '#f00';
    }

    function closeModal() {
        setIsOpen(false);
    }

    function addSponsor(newSponsor: Sponsor) {
        console.log(newSponsor)
        setNewSponsors([
            ...newSponsors,
           newSponsor
        ])
        console.log([...sponsors, newSponsor.acronym])
        setSponsors([...sponsors, newSponsor.acronym])
        closeModal()
    }

    const customStyles = {
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          maxWidth: '550px',
          width: '80%',
          transform: 'translate(-50%, -50%)',
        },
    };

    return <div className="form__group">
        <label htmlFor="startup">
            <strong>Sponsors : </strong><br />
        </label>
        <SESponsorSelect
            value={sponsors}
            newSponsors={newSponsors}
            onChange={sponsors => {
                setSponsors(sponsors)}
            } />
        <p>Le sponsor n'est pas encore dans la base de donnée ?<a style={{ textDecoration: 'none' }}
            onClick={openModal}
        >ajouter un sponsor</a></p>
        <Modal
            isOpen={modalIsOpen}
            onAfterOpen={afterOpenModal}
            onRequestClose={closeModal}
            style={customStyles}
            contentLabel="Example Modal"
        >
            <SponsorForm addSponsor={addSponsor} />
        </Modal>
    </div>
}

export default SponsorBlock
