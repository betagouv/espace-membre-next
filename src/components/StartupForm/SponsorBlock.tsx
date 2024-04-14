import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import ReactDOM from "react-dom";

import SESponsorSelect from "../SESponsorSelect";
import { SponsorForm } from "../SponsorForm/SponsorForm";

import { Sponsor } from "@/models/sponsor";

const modal = createModal({
    id: "foo-modal",
    isOpenedByDefault: false,
});

export const SponsorModal = ({ addSponsor }) => {
    const modalContent = (
        <modal.Component title="Ajouter un sponsor">
            <SponsorForm addSponsor={addSponsor} />
        </modal.Component>
    );
    if (typeof window !== "undefined") {
        return;
    }
    return ReactDOM.createPortal(
        modalContent,
        document.getElementById("root-container") as Element
    );
};

const SponsorBlock = ({
    setSponsors,
    sponsors,
    allSponsors,
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
                value={sponsors.map((s) => s.replace(/^\/organisations\//, ""))}
                allSponsors={allSponsors}
                onChange={(newSponsors) => {
                    setSponsors(newSponsors);
                }}
                placeholder={"Sélectionnez des sponsors"}
                containerStyle={{
                    marginBottom: `0.5rem`,
                }}
                hint={
                    "Indiquez la ou les administrations qui sponsorisent votre produit"
                }
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
            <SponsorModal addSponsor={addSponsor}></SponsorModal>
        </div>
    );
};

export default SponsorBlock;
