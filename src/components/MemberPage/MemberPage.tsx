"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import MarkdownIt from "markdown-it";
import { match, P } from "ts-pattern";

import { AdminPanel } from "./AdminPanel";
import EmailContainer from "./Email/EmailContainer";
import { MemberCard } from "./MemberCard";
import { MemberContact } from "./MemberContact";
import { MemberExpirationNotice } from "./MemberExpirationNotice";
import { MemberMissions } from "./MemberMissions";
import { MemberStatus } from "./MemberStatus";
import { getUserStartups } from "@/lib/kysely/queries/users";
import { memberWrapperSchemaType } from "@/models/member";
import { PrivateMemberChangeSchemaType } from "@/models/memberChange";
import { matomoUserSchemaType } from "@/models/matomo";
import { sentryUserSchemaType } from "@/models/sentry";
import LastChange from "../LastChange";
import { FicheHeader } from "../FicheHeader";

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
    matomoInfo?: matomoUserSchemaType;
    sentryInfo?: sentryUserSchemaType;
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
    sessionUserIsFromIncubatorTeam: boolean;
    isAdmin: boolean;
    isCurrentUser: boolean;
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
    matomoInfo,
    sentryInfo,
    isExpired,
    startups,
    changes,
    sessionUserIsFromIncubatorTeam,
    isAdmin,
    avatar,
    isCurrentUser,
}: MemberPageProps) {
    const router = useRouter();

    const [tab, setTab] = useState<string>(
        window.location.hash.replace("#", "") || "team"
    );

    const onHashChange = () => {
        setTab(window.location.hash.replace("#", ""));
    };

    useEffect(() => {
        // Listen for changes in the URL
        window.addEventListener("popstate", onHashChange);

        return () => {
            window.removeEventListener("popstate", onHashChange);
        };
    }, []);

    const canEdit = isAdmin || isCurrentUser || sessionUserIsFromIncubatorTeam;
    const linkToEditPage = match([
        isAdmin,
        isCurrentUser,
        sessionUserIsFromIncubatorTeam,
    ])
        .with(
            [true, P._, P._],
            () => `/community/${userInfos.username}/admin-update`
        )
        .with([false, true, P._], () => `/account/base-info`)
        .with(
            [false, false, true],
            () => `/community/${userInfos.username}/update`
        )
        .otherwise(() => "");

    const tabs = [
        {
            label: "Fiche Membre",
            isDefault: tab === "fiche-membre",
            tabId: "fiche-membre",
            content: (
                <>
                    <MemberCard
                        avatar={avatar}
                        userInfos={userInfos}
                        changes={changes}
                        isAdmin={isAdmin}
                        isCurrentUser={isCurrentUser}
                        sessionUserIsFromIncubatorTeam={
                            sessionUserIsFromIncubatorTeam
                        }
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
                            isCurrentUser={isCurrentUser}
                        />
                    </div>
                    <div className={fr.cx("fr-mt-4w")}>
                        <h3>Missions</h3>
                        <MemberMissions
                            startups={startups}
                            userInfos={userInfos}
                        />
                    </div>
                </>
            ),
        },
        {
            label: "Statut des comptes",
            tabId: "statut-comptes",
            isDefault: tab === "statut-comptes",

            content: (
                <MemberStatus
                    isExpired={isExpired}
                    emailInfos={emailInfos}
                    userInfos={userInfos}
                    mattermostInfo={mattermostInfo}
                    matomoInfo={matomoInfo}
                    sentryInfo={sentryInfo}
                    redirections={redirections}
                    isCurrentUser={isCurrentUser}
                />
            ),
        },
        {
            label: "Compte email",
            tabId: "compte-email",
            isDefault: tab === "compte-email",
            content: (
                <EmailContainer
                    isCurrentUser={isCurrentUser}
                    isExpired={isExpired}
                    emailInfos={emailInfos}
                    emailResponder={emailResponder}
                    emailRedirections={redirections}
                    redirections={redirections}
                    userInfos={userInfos}
                    authorizations={authorizations}
                ></EmailContainer>
            ),
        },
        isAdmin && {
            label: "Admin",
            tabId: "admin",
            isDefault: tab === "admin",
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
            <FicheHeader
                label={userInfos.fullname}
                editLink={canEdit && linkToEditPage}
            />
            <br />
            {isExpired && <MemberExpirationNotice userInfos={userInfos} />}
            <Tabs
                tabs={tabs}
                onTabChange={(obj) => {
                    router.push(`#${tabs[obj.tabIndex].tabId}`);
                }}
            />
            <div
                className={fr.cx("fr-col-12", "fr-mt-4w")}
                style={{ textAlign: "center" }}
            >
                {canEdit && linkToEditPage && (
                    <Button
                        className=""
                        size="small"
                        priority="secondary"
                        linkProps={{
                            href: linkToEditPage,
                        }}
                    >
                        Modifier la fiche
                    </Button>
                )}
                <br />
                <br />
                <LastChange changes={changes} />
            </div>
        </div>
    );
}
