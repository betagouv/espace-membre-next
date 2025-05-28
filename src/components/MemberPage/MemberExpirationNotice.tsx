import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";

import { MemberPageProps } from "./MemberPage";
import { getLastMissionDate } from "@/utils/member";

export const MemberExpirationNotice = ({
  userInfos,
}: {
  userInfos: MemberPageProps["userInfos"];
}) => (
  <Alert
    className={fr.cx("fr-mt-2w", "fr-mb-2w")}
    title={`Fiche arrivée à expiration`}
    severity="warning"
    description={
      <div>
        <p>
          La fiche de {userInfos.fullname} est arrivée à expiration le{" "}
          <strong>{getLastMissionDate(userInfos.missions)}</strong>.
        </p>
        <p>
          Si {userInfos.fullname} est encore dans la communauté ou revient pour
          une nouvelle mission tu peux mettre à jour ses missions en cliquant
          sur le bouton ci-dessous :
        </p>
        <br />
        <Button
          linkProps={{
            href: `/community/${userInfos.username}/update`,
          }}
        >
          Mettre à jour les missions de {userInfos.fullname}
        </Button>
        <br />
      </div>
    }
  />
);
