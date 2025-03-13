import { addDays, subDays } from "date-fns";

import { FakeDataInterface } from "./fakeData";
import { Domaine } from "@/models/member";

export const newMemberInStartupA = {
    username: "annie.mation",
    domaine: Domaine.ANIMATION,
    missions: [
        {
            start: subDays(new Date(), 3),
            end: addDays(new Date(), 3),
            startups: ["seconda-startup-name"],
        },
    ],
};

export const otherMemberFromStartupA = {
    username: "othermember.fromstartupA",
    domaine: Domaine.ANIMATION,
    missions: [
        {
            start: subDays(new Date(), 3),
            end: addDays(new Date(), 3),
            startups: ["seconda-startup-name"],
        },
    ],
};

export const userIncubatorAndTeams: FakeDataInterface = {
    incubators: [
        { ghid: "un-super-incubator" },
        { ghid: "un-autre-incubator" },
    ],
    users: [
        {
            username: "julien.dauphant",
            domaine: Domaine.PRODUIT,
            missions: [
                {
                    start: subDays(new Date(), 200),
                    end: addDays(new Date(), 500),
                    startups: ["a-startup"],
                },
            ],
            teams: ["gip-team"],
        },
        {
            username: "membre.actif",
            missions: [
                {
                    start: subDays(new Date(), 140),
                    end: addDays(new Date(), 500),
                    startups: ["test-startup"],
                },
            ],
            teams: ["dinum-team"],
        },
        newMemberInStartupA,
        otherMemberFromStartupA,
    ],
    startups: [
        {
            incubator: "un-autre-incubator",
            ghid: "seconda-startup-name",
        },
        {
            ghid: "a-startup",
        },
        {
            ghid: "test-startup",
        },
    ],
    teams: [
        {
            ghid: "dinum-team",
            incubator: "un-super-incubator",
        },
        {
            ghid: "gip-team",
            incubator: "un-autre-incubator",
        },
    ],
};

export const testUsers: FakeDataInterface = {
    users: [
        {
            username: "membre.actif",
            fullname: "Membre Actif",
            github: "membre.actif",
            role: "Chargé de déploiement",
            domaine: Domaine.DEVELOPPEMENT,
            missions: [
                {
                    start: new Date("2016-11-03"),
                    end: new Date("2040-11-12"),
                    status: "independent",
                    employer: "octo",
                    startups: ["test-startup"],
                },
            ],
        },
        {
            username: "membre.expire",
            fullname: "Membre Expiré",
            github: "membre.expire",
            domaine: Domaine.DEPLOIEMENT,
            missions: [
                {
                    start: new Date("2016-11-03"),
                    end: new Date("2017-11-02"),
                    status: "independent",
                    employer: "octo",
                },
            ],
        },
        {
            username: "membre.parti",
            fullname: "Membre Parti",
            github: "test-github",
            domaine: Domaine.ANIMATION,
            missions: [
                {
                    start: new Date("2016-11-03"),
                    end: new Date("2050-10-30"),
                    status: "independent",
                    employer: "octo",
                },
            ],
        },
        {
            username: "membre.nouveau",
            fullname: "Membre Nouveau",
            domaine: Domaine.ANIMATION,
            missions: [
                {
                    start: new Date("2020-07-03"),
                    end: new Date("2050-07-03"),
                    status: "independent",
                    employer: "octo",
                    startups: ["test-startup"],
                },
            ],
        },
        {
            username: "membre.plusieurs.missions",
            fullname: "Membre Plusieurs Missions",
            role: "Chargé de déploiement",
            domaine: Domaine.COACHING,
            missions: [
                {
                    start: new Date("2016-11-03"),
                    end: new Date("2017-10-30"),
                    status: "independent",
                    employer: "octo",
                },
                {
                    start: new Date("2014-11-03"),
                    end: new Date("2021-10-30"),
                    status: "admin",
                    employer: "Département du Var",
                },
            ],
        },
        {
            username: "julien.dauphant",
            fullname: "Julien Dauphant",
            domaine: Domaine.PRODUIT,
            missions: [
                {
                    start: new Date("2016-11-03"),
                    end: new Date("2050-10-30"),
                    status: "independent",
                    employer: "octo",
                },
            ],
        },
        {
            username: "hela.ghariani",
            fullname: "Hela Ghariani",
            domaine: Domaine.DEVELOPPEMENT,
            missions: [
                {
                    start: new Date("2014-11-01"),
                    end: new Date("2019-10-30"),
                    employer: "dinsic",
                },
            ],
        },
        {
            username: "nicolas.bouilleaud",
            fullname: "Nicolas Bouilleaud",
            domaine: Domaine.AUTRE,
            github: "n-b",
            missions: [
                {
                    start: new Date("2018-04-09"),
                    end: new Date("2018-12-31"),
                    status: "independent",
                    employer: "octo",
                },
            ],
        },
        {
            username: "laurent.bossavit",
            fullname: "Laurent Bossavit",
            domaine: Domaine.INTRAPRENARIAT,
            missions: [
                {
                    start: new Date("2016-03-01"),
                    end: new Date("2021-04-05"),
                    employer: "dinsic",
                },
            ],
        },
        {
            username: "stephane.legouffe",
            fullname: "Stéphane Legouffe",
            github: "slegouffe",
            domaine: Domaine.DESIGN,
            missions: [
                {
                    start: new Date("2018-03-08"),
                    end: new Date("2018-06-08"),
                    employer: "independent",
                },
            ],
        },
        {
            username: "sandra.chakroun",
            fullname: "Sandra Chakroun",
            domaine: Domaine.DESIGN,
            missions: [
                {
                    start: new Date("2017-05-10"),
                    end: new Date("2018-10-05"),
                    status: "independent",
                    employer: "octo",
                },
            ],
        },
        {
            username: "loup.wolff",
            fullname: "Loup Wolff",
            domaine: Domaine.INTRAPRENARIAT,
            missions: [
                {
                    start: new Date("2018-03-27"),
                    end: new Date("2020-03-20"),
                    status: "admin",
                    employer: "Ministère de la Culture",
                },
            ],
        },
        {
            username: "ishan.bhojwani",
            fullname: "Ishan Bhojwani",
            github: "IshanB",
            domaine: Domaine.ANIMATION,
            missions: [
                {
                    start: new Date("2017-05-23"),
                    end: new Date("2018-12-31"),
                    status: "independent",
                    employer: "octo",
                },
            ],
        },
        {
            username: "pierre.de_la_morinerie",
            fullname: "Pierre de La Morinerie",
            domaine: Domaine.PRODUIT,
            missions: [
                {
                    start: new Date("2017-01-24"),
                    end: new Date("2017-07-31"),
                    status: "independent",
                    employer: "octo",
                },
            ],
        },
        {
            username: "thomas.guillet",
            fullname: "Thomas Guillet",
            domaine: Domaine.COACHING,
            missions: [
                {
                    start: new Date("2017-03-06"),
                    end: new Date("2020-12-24"),
                    employer: "dinsic",
                },
            ],
        },
        {
            username: "mattermost.newuser",
            fullname: "Mattermost Newuser",
            domaine: Domaine.DEPLOIEMENT,
            missions: [
                {
                    start: new Date("2021-07-09"),
                    end: new Date("2050-12-24"),
                    employer: "dinsic",
                },
            ],
        },
    ],
    startups: [
        {
            ghid: "test-startup",
        },
    ],
};
