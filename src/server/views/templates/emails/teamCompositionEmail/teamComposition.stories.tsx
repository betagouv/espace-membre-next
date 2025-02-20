import { Meta, StoryFn } from "@storybook/react";
import { addDays } from "date-fns/addDays";
import { subDays } from "date-fns/subDays";

import {
    TeamCompositionEmail,
    TeamCompositionEmailTitle,
} from "./teamCompositionEmail";
import { Domaine, EmailStatusCode } from "@/models/member";
import { commonEmailsParameters } from "@/server/views/utils/email";
import {
    withEmailClientOverviewFactory,
    withEmailRenderer,
} from "@sbook/email";
import { StoryHelperFactory } from "@sbook/helpers";
import { playFindEmailStructure } from "@sbook/testing";

type ComponentType = typeof TeamCompositionEmail;
const { generateMetaDefault, prepareStory } =
    StoryHelperFactory<ComponentType>();

export default {
    title: "Emails/Templates/TeamCompositionEmail",
    component: TeamCompositionEmail,
    ...generateMetaDefault({
        parameters: {
            ...commonEmailsParameters,
            docs: {
                description: {
                    component:
                        "Email sent to agents on regular basis to get an overview.",
                },
            },
        },
    }),
} as Meta<ComponentType>;

const Template: StoryFn<ComponentType> = (args) => {
    return <TeamCompositionEmail {...args} />;
};

const CompleteStory = Template.bind({});
CompleteStory.args = {
    activeMembers: [
        {
            member: {
                uuid: "123",
                username: "johndoe",
                fullname: "John Doe",
                role: "Developer",
                missions: [
                    {
                        start: new Date(),
                        uuid: "mission-uuid",
                        status: "service",
                        end: new Date(),
                        employer: "Employer Inc.",
                        startups: ["Startup1", "Startup2"],
                    },
                ],
                domaine: Domaine.DEVELOPPEMENT,
                primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
                link: "http://example.com",
                github: "johndoe",
                competences: ["React", "TypeScript"],
                teams: [
                    {
                        uuid: "team-uuid",
                        name: "Team Name",
                        incubator_id: "incubator-uuid",
                        ghid: "ghid",
                        mission: "Mission Name",
                    },
                ],
                bio: "Bio text",
                workplace_insee_code: "12345",
            },
            activeMission: {
                start: new Date(),
                uuid: "active-mission-uuid",
                status: "service",
                end: new Date(),
                employer: "Employer Inc.",
                startups: ["Startup1", "Startup2"],
            },
        },
        {
            member: {
                uuid: "123",
                username: "Arlette",
                fullname: "Arlette Poideri",
                role: "PO",
                missions: [
                    {
                        start: subDays(new Date(), 50),
                        uuid: "mission-uuid",
                        status: "service",
                        end: addDays(new Date(), 15),
                        employer: "Employer Inc.",
                        startups: ["Startup1", "Startup2"],
                    },
                ],
                domaine: Domaine.DEVELOPPEMENT,
                primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
                link: "http://example.com",
                github: "johndoe",
                competences: ["React", "TypeScript"],
                teams: [
                    {
                        uuid: "team-uuid",
                        name: "Team Name",
                        incubator_id: "incubator-uuid",
                        ghid: "ghid",
                        mission: "Mission Name",
                    },
                ],
                bio: "Bio text",
                workplace_insee_code: "12345",
            },
            activeMission: {
                start: subDays(new Date(), 50),
                uuid: "active-mission-uuid",
                status: "service",
                end: addDays(new Date(), 15),
                employer: "Employer Super",
                startups: ["Startup1", "Startup2"],
            },
        },
    ],
    startup: {
        uuid: "32984eda23432423",
        name: "Ma super startup",
        ghid: "ma-super-startup",
        incubator_id: "342424233423342",
        pitch: "une startup qui fait des trucs supers",
        contact: "uncontact@startup.com",
        description: "un startup qui fait des trucs supers et qui a un impact",
    },
    memberAccountLink: `https://unerul`,
};
CompleteStory.decorators = [withEmailRenderer];
CompleteStory.play = async ({ canvasElement }) => {
    await playFindEmailStructure(canvasElement);
};

export const Complete = prepareStory(CompleteStory);

const CompleteClientOverviewStory = Template.bind({});
CompleteClientOverviewStory.args = {
    ...CompleteStory.args,
};
CompleteClientOverviewStory.decorators = [
    withEmailRenderer,
    withEmailClientOverviewFactory(TeamCompositionEmailTitle()),
];
CompleteClientOverviewStory.play = async ({ canvasElement }) => {
    await playFindEmailStructure(canvasElement);
};

export const CompleteClientOverview = prepareStory(CompleteClientOverviewStory);
