"use client";
import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

import SESponsorSelect from "../SESponsorSelect";
import { SponsorForm } from "../SponsorForm/SponsorForm";
import { startupInfoUpdateSchemaType } from "@/models/actions/startup";
import { Option } from "@/models/misc";
import { Sponsor, sponsorSchemaType } from "@/models/sponsor";

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

    return modalContent;
};

const SponsorBlock = ({
    setSponsors,
    sponsors,
    allSponsors,
    setNewSponsors,
}: {
    setSponsors: any;
    sponsors: any;
    allSponsors: Option[];
    setNewSponsors: any;
}) => {
    function openModal() {
        modal.open();
    }

    function addSponsor(
        newSponsor: startupInfoUpdateSchemaType["newSponsors"]
    ) {
        setNewSponsors([newSponsor]);
        modal.close();
    }
    return (
        <div className="fr-input-group">
            <SESponsorSelect
                value={sponsors}
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
