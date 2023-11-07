import React from "react";
import Modal from "react-modal";
import SESponsorSelect from "../SESponsorSelect";
import { SponsorForm } from "../SponsorForm/SponsorForm";
import { Sponsor } from "@/models/sponsor";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
const modal = createModal({
    id: "foo-modal",
    isOpenedByDefault: false,
});

const SponsorBlock = ({
    setSponsors,
    sponsors,
    setNewSponsors,
    newSponsors,
}) => {
    function openModal() {
        modal.open();
    }

    function addSponsor(newSponsor: Sponsor) {
        setNewSponsors([...newSponsors, newSponsor]);
        setSponsors([...sponsors, newSponsor.acronym]);
        modal.close();
    }

    const customStyles = {
        content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            maxWidth: "550px",
            width: "80%",
            transform: "translate(-50%, -50%)",
        },
    };

    return (
        <div className="fr-input-group">
            <label className="fr-label">Sponsor</label>
            <br />
            <SESponsorSelect
                value={sponsors}
                newSponsors={newSponsors}
                onChange={(sponsors) => {
                    setSponsors(sponsors);
                }}
            />
            <p>Le sponsor n'est pas encore dans la base de donnée ? </p>
            <Button
                nativeButtonProps={{
                    onClick: openModal,
                }}
                priority="tertiary"
            >
                Ajouter un sponsor
            </Button>
            <modal.Component title="Ajouter un sponsor">
                <SponsorForm addSponsor={addSponsor} />
            </modal.Component>
        </div>
    );
};

export default SponsorBlock;
