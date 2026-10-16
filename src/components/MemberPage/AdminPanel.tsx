import BlocConfigurerEmailPrincipal from "./Email/BlocConfigurerEmailPrincipal";
import { ChangeSecondaryEmail } from "./Email/ChangeSecondaryEmail";
import { ResendWebmailAccess } from "./Email/ResendWebmailAccess";
import { DinumEmailsAdmin } from "./Email/DinumEmailsAdmin";
import MemberBrevoEventList from "./MemberBrevoEventList";
import MemberEmailServiceInfo from "./MemberEmailServiceInfo";
import MemberEventList from "./MemberEventList";
import { MemberPageProps } from "./MemberPage";
import { EmailStatusCode } from "@/models/member";
// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
import { LegacyEmailLoginException } from "@/components/LegacyEmailLogin/LegacyEmailLoginException";

export const AdminPanel = ({
  userInfos,
  authorizations,
}: {
  userInfos: MemberPageProps["userInfos"];
  authorizations: MemberPageProps["authorizations"];
}) => {
  return (
    <div className="fr-mb-8v">
      <h2>Actions admin</h2>
      <h3>Emails</h3>
      <BlocConfigurerEmailPrincipal
        isAdmin={true}
        canChangeEmails={authorizations.canChangeEmails}
        userInfos={userInfos}
      ></BlocConfigurerEmailPrincipal>
      <ChangeSecondaryEmail userInfos={userInfos}></ChangeSecondaryEmail>
      <ResendWebmailAccess username={userInfos.username} />
      {/* legacy-email-login: remove with src/lib/auth/legacyEmailLogin */}
      <LegacyEmailLoginException username={userInfos.username} />
      <DinumEmailsAdmin username={userInfos.username} />
      <br />
      <h3>Évènements</h3>
      <MemberEventList userId={userInfos.username} />
      <MemberBrevoEventList userId={userInfos.username} />
      <br />
      <h3>Brevo</h3>
      <MemberEmailServiceInfo userId={userInfos.username} isAdmin={true} />
    </div>
  );
};
