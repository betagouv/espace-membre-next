import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { EmailStatusCode } from "@/models/member";
import { ChangeSecondaryEmail } from "./Email/ChangeSecondaryEmail";
import MemberBrevoEventList from "./MemberBrevoEventList";
import MemberEventList from "./MemberEventList";
import { MemberPageProps } from "./MemberPage";
import { EmailUpgrade } from "./EmailUpgrade";
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
    return (
        <div className="fr-mb-8v">
            <h2>Actions admin</h2>
            <h3>Emails</h3>
            <ChangeSecondaryEmail userInfos={userInfos}></ChangeSecondaryEmail>

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
            <h3>Évènements</h3>
            <MemberEventList userId={userInfos.username} />
            <MemberBrevoEventList userId={userInfos.username} />
            <br />
            <h3>Brevo</h3>
            <MemberEmailServiceInfo
                userId={userInfos.username}
                isAdmin={true}
            />
        </div>
    );
};
