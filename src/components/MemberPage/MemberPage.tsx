"use client";
import { useSession } from "next-auth/react";
import MarkdownIt from "markdown-it";

import { fr } from "@codegouvfr/react-dsfr";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";

import { memberWrapperSchemaType } from "@/models/member";
import { PrivateMemberChangeSchemaType } from "@/models/memberChange";
import { getUserStartups } from "@/lib/kysely/queries/users";

import { MemberCard } from "./MemberCard";
import { MemberContact } from "./MemberContact";
import { MemberMissions } from "./MemberMissions";
import { MemberExpirationNotice } from "./MemberExpirationNotice";
import { AdminPanel } from "./AdminPanel";
import { MemberStatus } from "./MemberStatus";
import EmailContainer from "./Email/EmailContainer";

import "./MemberPage.css";

const mdParser = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
});

export interface MemberPageProps {
    avatar: string | undefined;
    emailInfos: memberWrapperSchemaType["emailInfos"];
    redirections: memberWrapperSchemaType["emailRedirections"];
    authorizations: memberWrapperSchemaType["authorizations"];
    emailResponder: memberWrapperSchemaType["emailResponder"] | null;
    userInfos: memberWrapperSchemaType["userInfos"];
    availableEmailPros: string[];
    mattermostInfo: {
        hasMattermostAccount: boolean;
        isInactiveOrNotInTeam: boolean;
        mattermostUserName?: string | null;
    };
    isExpired: boolean;
    emailServiceInfo?: {
        primaryEmail?: {
            emailBlacklisted: boolean;
            listIds: number[];
        };
        secondaryEmail?: {
            emailBlacklisted: boolean;
            listIds: number[];
        };
    };
    changes: PrivateMemberChangeSchemaType[];
    startups: Awaited<ReturnType<typeof getUserStartups>>;
    canEdit: boolean;
    isAdmin: boolean;
}

/*
 todo: 
    - avatar
    - check action emails
*/

export default function MemberPage({
    emailInfos,
    redirections,
    userInfos,
    availableEmailPros,
    authorizations,
    emailResponder,
    mattermostInfo,
    isExpired,
    startups,
    changes,
    canEdit,
    isAdmin,
    avatar,
}: MemberPageProps) {
    const tabs = [
        {
            label: "Fiche Membre",
            isDefault: true,
            content: (
                <>
                    <MemberCard
                        avatar={avatar}
                        userInfos={userInfos}
                        changes={changes}
                        isAdmin={isAdmin}
                        canEdit={canEdit}
                    />
                    {userInfos.bio && (
                        <figure className={fr.cx("fr-quote", "fr-mt-2w")}>
                            <blockquote
                                dangerouslySetInnerHTML={{
                                    // todo: check secu
                                    __html: mdParser
                                        .render(userInfos.bio.trim())
                                        .replace(/^<p>/, "")
                                        .replace(/<\/p>$/, ""),
                                }}
                            />
                            <figcaption></figcaption>
                        </figure>
                    )}
                    <div className={fr.cx("fr-mt-4w")}>
                        <h3>Contact</h3>
                        <MemberContact
                            userInfos={userInfos}
                            mattermostInfo={mattermostInfo}
                            emailInfos={emailInfos}
                            isAdmin={isAdmin}
                            canEdit={canEdit}
                        />
                    </div>
                    <div className={fr.cx("fr-mt-4w")}>
                        <h3>Missions</h3>
                        <MemberMissions startups={startups} />
                    </div>
                </>
            ),
        },
        {
            label: "Statut du compte",
            content: (
                <MemberStatus
                    isExpired={isExpired}
                    emailInfos={emailInfos}
                    userInfos={userInfos}
                    mattermostInfo={mattermostInfo}
                    redirections={redirections}
                />
            ),
        },
        canEdit && {
            label: "Compte email",
            content: (
                <EmailContainer
                    isExpired={isExpired}
                    emailInfos={emailInfos}
                    emailResponder={emailResponder}
                    emailRedirections={redirections}
                    userInfos={userInfos}
                    authorizations={authorizations}
                ></EmailContainer>
            ),
        },
        isAdmin && {
            label: "Admin",
            content: (
                <AdminPanel
                    authorizations={authorizations}
                    availableEmailPros={availableEmailPros}
                    userInfos={userInfos}
                    emailInfos={emailInfos}
                />
            ),
        },
    ].filter((x) => !!x); // wth, Boolean doesnt work
    return (
        <div className="fr-mb-8v MemberPage">
            <h1>{userInfos.fullname}</h1>
            {isExpired && <MemberExpirationNotice userInfos={userInfos} />}
            <Tabs tabs={tabs} />
        </div>
    );
}
