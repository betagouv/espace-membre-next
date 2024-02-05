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

    return (
        <div className="fr-input-group">
            <SESponsorSelect
                value={sponsors}
                newSponsors={newSponsors}
                onChange={(newSponsors) => {
                    setSponsors(newSponsors);
                }}
                placeholder={"Sélectionnez des sponsors"}
                containerStyle={{
                    marginBottom: `0.5rem`,
                }}
            />
            <span className="fr-text fr-text--sm">
                Le sponsor n'est pas encore dans la base de donnée ?
            </span>
            <Button
                nativeButtonProps={{
                    onClick: openModal,
                }}
                style={{
                    marginLeft: `0.5rem`,
                    transform: `translateY(0.25rem)`,
                }}
                iconId="fr-icon-add-circle-fill"
                priority="tertiary no outline"
                size="small"
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
