import { CreateEmailForm } from "./CreateEmailForm";
import { ChangeSecondaryEmail } from "./Email/ChangeSecondaryEmail";
import MemberBrevoEventList from "./MemberBrevoEventList";
import MemberEmailServiceInfo from "./MemberEmailServiceInfo";
import MemberEventList from "./MemberEventList";
import { MemberPageProps } from "./MemberPage";
import { EmailStatusCode } from "@/models/member";

export const AdminPanel = ({
    userInfos,
    emailInfos,
    authorizations,
}: {
    userInfos: MemberPageProps["userInfos"];
    emailInfos: MemberPageProps["emailInfos"];
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
