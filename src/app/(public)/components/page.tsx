import { fr } from "@codegouvfr/react-dsfr";
import type { Metadata } from "next";

import MemberPage, {
    MemberPageProps,
} from "@/components/MemberPage/MemberPage";
import {
    CommunicationEmailCode,
    Domaine,
    EmailStatusCode,
} from "@/models/member";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";

export const metadata: Metadata = {
    title: `Components Demo`,
};

const sampleMember: { member: MemberPageProps } = {
    member: {
        changes: [
            {
                created_at: new Date("2024-12-12"),
                created_by_username: "ada.lovelace",
            },
        ],
        emailInfos: {
            email: "ada@love.com",
            isBlocked: false,
            isPro: true,
            isExchange: false,
            emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO,
        },
        isExpired: false,
        startups: [
            {
                start: new Date("2023-01-01"),
                end: new Date("2023-06-01"),
                name: "Math pour tous",
                uuid: "42",
            },
        ],
        avatar: "/static/images/ada.jpg",
        userInfos: {
            competences: ["Data science", "Algorithms"],
            domaine: Domaine.ANIMATION,
            fullname: "Ada lovelace",
            missions: [
                {
                    start: new Date("2023-01-01"),
                    end: new Date("2023-06-01"),
                    employer: "some",
                    status: "independent",
                },
            ],
            teams: [
                {
                    name: "Équipe data",
                    ghid: "equipe-data",
                    // @ts-ignore todo
                    incubator_title: "Fabrique de fusées",
                    incubator_id: "fabrique-de-fusee",
                    uuid: "unduid",
                },
            ],
            primary_email: "ada@love.com",
            primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
            email_is_redirection: false,
            role: "Software engineer",
            username: "ada.lovelace",
            bio: "Sending rockets",
            communication_email: CommunicationEmailCode.PRIMARY,
            primary_email_status_updated_at: new Date(),
            uuid: "42",
            secondary_email: "none@none.com",
            updated_at: new Date(),
            github: "ada",
            link: "https://fr.wikipedia.org/wiki/Ada_Lovelace",
        },
        availableEmailPros: [],
        canEdit: false,
        emailResponder: null,
        mattermostInfo: {
            hasMattermostAccount: true,
            isInactiveOrNotInTeam: false,
            mattermostUserName: "ada.lovelace",
        },
        matomoInfo: {
            email: "unemaildetest@gmail.com",
            account_type: "matomo",
            service_user_id: "unemaildetest@gmail.co",
            metadata: {
                sites: [
                    {
                        id: 46,
                        url: "https://totobogosss",
                        name: "supertoto",
                        type: "website",
                        accessLevel: "admin",
                    },
                    {
                        id: 47,
                        url: "https://iiiiii",
                        name: "supertata",
                        type: "website",
                        accessLevel: "admin",
                    },
                ],
            },
        },
        sentryInfo: {
            email: "unemaildetest@gmail.com",
            account_type: "sentry",
            service_user_id: "168",
            metadata: {
                organisationRole: "admin",
                pending: false,
                expired: false,
                inviteStatus: "approved",
                teams: [
                    {
                        slug: "monservice-prod",
                        name: "monservice-prod",
                        id: "123",
                        role: null,
                        memberCount: 3,
                        projects: [
                            {
                                name: "projet",
                                id: "145",
                                slug: "projet1",
                                plateform: "typescript",
                            },
                        ],
                    },
                    {
                        name: "nis2",
                        slug: "nis2",
                        role: null,
                        id: "124",
                        memberCount: 3,
                        projects: [],
                    },
                ],
            },
        },
        redirections: [{ from: "ada@love.com", id: "42", to: "some@one.com" }],
        authorizations: {
            canCreateEmail: false,
            canCreateRedirection: false,
            canChangePassword: false,
            canChangeEmails: false,
            hasPublicServiceEmail: false,
        },
    },
};

export default async function Page() {
    return (
        <div className={fr.cx("fr-col-12")}>
            <h1>Members</h1>
            <h2>Active member</h2>
            <hr />
            <MemberPage {...sampleMember.member} />
            <hr />
            <h2>Expired member</h2>
            <hr />
            <MemberPage
                {...sampleMember.member}
                isExpired={true}
                avatar={undefined}
                emailInfos={{
                    email: sampleMember.member.userInfos.primary_email || "-",
                    isBlocked: true,
                    isPro: true,
                    isExchange: false,
                    emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO,
                }}
                userInfos={{
                    ...sampleMember.member.userInfos,
                    primary_email_status: EmailStatusCode.EMAIL_DELETED,
                }}
                emailServiceInfo={{
                    primaryEmail: { emailBlacklisted: true, listIds: [] },
                    secondaryEmail: { emailBlacklisted: true, listIds: [] },
                }}
                mattermostInfo={{
                    hasMattermostAccount: true,
                    isInactiveOrNotInTeam: true,
                }}
            />
            <hr />
            <h2>Editable member</h2>
            <hr />
            <MemberPage
                {...sampleMember.member}
                canEdit={true}
                emailInfos={{
                    email: sampleMember.member.userInfos.primary_email || "-",
                    isBlocked: false,
                    isExchange: true,
                    isPro: false,
                    emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_EXCHANGE,
                }}
            />
            <hr />
            <h2>Admin view</h2>
            <hr />
            <MemberPage
                {...sampleMember.member}
                isAdmin={true}
                canEdit={true}
                emailInfos={{
                    email: sampleMember.member.userInfos.primary_email || "-",
                    isBlocked: false,
                    isPro: false,
                    isExchange: false,
                    emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC,
                }}
            />
            <hr />
            <h2>With workplace</h2>
            <hr />
            <MemberPage
                {...sampleMember.member}
                userInfos={{
                    ...sampleMember.member.userInfos,
                    workplace_insee_code: "75010",
                }}
            />
            <hr />
            <h2>No avatar</h2>
            <hr />
            <MemberPage {...sampleMember.member} avatar={undefined} />
        </div>
    );
}
