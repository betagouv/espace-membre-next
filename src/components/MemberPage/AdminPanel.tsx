import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { ChangeSecondaryEmail } from "./ChangeSecondaryEmail";
import MemberBrevoEventList from "./MemberBrevoEventList";
import MemberEventList from "./MemberEventList";
import { MemberPageProps } from "./MemberPage";
import { EmailUpgrade } from "./EmailUpgrade";
import { EmailStatusCode } from "@/models/member";
import { CreateEmailForm } from "./CreateEmailForm";
import MemberEmailServiceInfo from "./MemberEmailServiceInfo";

export const AdminPanel = ({
    userInfos,
    emailInfos,
    availableEmailPros,
    authorizations,
}: {
    userInfos: MemberPageProps["userInfos"];
    emailInfos: MemberPageProps["emailInfos"];
    availableEmailPros: MemberPageProps["availableEmailPros"];
    authorizations: MemberPageProps["authorizations"];
}) => {
    const shouldDisplayUpgrade = Boolean(
        availableEmailPros.length &&
            emailInfos &&
            !emailInfos.isPro &&
            !emailInfos.isExchange
    );
    return (
        <div className="fr-mb-8v">
            <h2>Actions admin</h2>
            <ChangeSecondaryEmail userInfos={userInfos}></ChangeSecondaryEmail>
            <MemberBrevoEventList userId={userInfos.username} />
            <MemberEventList userId={userInfos.username} />
            {shouldDisplayUpgrade && (
                <Accordion label="Passer en compte pro">
                    {shouldDisplayUpgrade && (
                        <EmailUpgrade
                            availableEmailPros={availableEmailPros}
                            userInfos={userInfos}
                        />
                    )}
                </Accordion>
            )}
            {!emailInfos &&
                ![
                    EmailStatusCode.EMAIL_CREATION_WAITING,
                    EmailStatusCode.EMAIL_VERIFICATION_WAITING,
                ].includes(userInfos.primary_email_status) &&
                userInfos.secondary_email &&
                authorizations.canCreateEmail && (
                    <CreateEmailForm
                        userInfos={userInfos}
                        hasPublicServiceEmail={
                            authorizations.hasPublicServiceEmail
                        }
                    />
                )}
            <br />
            <h3>Brevo</h3>
            <MemberEmailServiceInfo
                userId={userInfos.username}
                isAdmin={true}
            />
        </div>
    );
};
