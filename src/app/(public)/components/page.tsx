import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { fr } from "@codegouvfr/react-dsfr";

import { authOptions } from "@/utils/authoptions";
import MemberPage, {
    MemberPageProps,
} from "@/components/MemberPage/MemberPage";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";
import {
    CommunicationEmailCode,
    Domaine,
    EmailStatusCode,
} from "@/models/member";

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
                // @ts-ignore todo
                { name: "Équipe data", incubator_title: "Fabrique de fusées" },
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
        redirections: [],
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
