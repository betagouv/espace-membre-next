"use client";
import React from "react";
import _ from "lodash";
import { Member } from "@/models/member";
import { StartupInfo } from "@/models/startup";
import Input from "@codegouvfr/react-dsfr/Input";

function formatDateToReadableFormat(date) {
    let day = date.getDate().toString();
    day = day.length === 1 ? `0${day}` : day;
    let month = (date.getMonth() + 1).toString();
    month = month.length === 1 ? `0${month}` : month;
    return `${date.getFullYear()}-${month}-${day}`;
}

interface CommuneInfo {
    nom: string;
    codesPostaux?: string[];
}

interface Option {
    key: string;
    name: string;
}

interface FormData {
    gender: string;
    legal_status: string;
    workplace_insee_code: string;
    tjm: number;
    secondary_email: string;
    osm_city: string;
    firstName?: string;
    lastName?: string;
    start?: string;
    end?: string;
    average_nb_of_days?: number;
    communication_email: "primary" | "secondary";
    should_create_marrainage: boolean;
    memberType: string;
}

interface Props {
    title?: string;
    errors?: string[];
    messages?: string[];
    request: Request;
    formData: FormData;
    users: Member[];
    allUsers: Member[];
    domaineOptions?: Option[];
    statusOptions?: Option[];
    genderOptions?: Option[];
    formValidationErrors?: any;
    communeInfo?: CommuneInfo;
    startups?: StartupInfo[];
    startupOptions?: {
        value: string;
        label: string;
    }[];
    userConfig: {
        statusOptions: Option[];
        minStartDate: string;
        badgeOptions: Option[];
        memberOptions: Option[];
    };
}

/* Pure component */
export default function ModalOnboarding({ firstName }: { firstName: string }) {
    return (
        <>
            <p>Attention un utilisateur avec ce nom existe déjà.</p>
            <p>
                Si c'est toi, il faut que tu récupère ton compte, tu peux
                trouver les instructions sur{" "}
                <a href="http://espace-membre.incubateur.net/keskipasse">
                    http://espace-membre.incubateur.net/keskipasse
                </a>
                .
            </p>
            <p>
                S'il s'agit d'un homonyme, il risque d'y avoir un soucis lors de
                la création de ton email car l'email existe déjà.
            </p>
            <p>
                Tu peux ajouter la première lettre de ton second prénom dans le
                champs prénom. Par exemple pour {firstName} Camille :
                <br />
                <br />
                <Input
                    label={`Prénom (obligatoire)`}
                    disabled={true}
                    nativeInputProps={{
                        value: `${firstName} C.`,
                    }}
                />
            </p>
        </>
    );
}
