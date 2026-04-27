import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import type { Metadata, ResolvingMetadata } from "next";
import { getServerSession } from "next-auth/next";

import { validateNewMember } from "@/app/api/member/actions/validateNewMember";
import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import { userInfos } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import { BusinessError } from "@/utils/error";

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const id = params.id;
  return {
    title: `Membre ${id} / Espace Membre`,
  };
}

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  // todo: merge with /account/page.tsx
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id) {
    throw new Error(`You don't have the right to access this function`);
  }
  let userData: { fullname: string; username: string } | null = null;
  let alertSeverity: "success" | "error" | "info" = "success";
  let alertTitle = "Fiche membre validée";
  let alertDescription = "";
  let loadError: any = null;

  try {
    const user = await userInfos({ username: id }, session.user.id === id);
    userData = {
      fullname: user.userInfos.fullname,
      username: user.userInfos.username,
    };
    alertDescription = `La fiche membre de ${user.userInfos.fullname} a été validée par ${session.user.id}`;
    try {
      await validateNewMember({
        memberUuid: user?.userInfos.uuid,
      });
    } catch (error) {
      if (
        error instanceof BusinessError &&
        error.code === "userAlreadyValided"
      ) {
        alertSeverity = "info";
        alertTitle = "Fiche membre déjà validée";
        alertDescription = (error as Error).message;
      } else {
        alertSeverity = "error";
        alertTitle = "Une erreur est survenue lors de la validation";
        alertDescription = (error as Error).message;
      }
    }
  } catch (e: any) {
    loadError = e;
  }

  if (loadError) {
    return <InvalideUserComponent error={loadError} />;
  }

  return (
    <>
      <BreadCrumbFiller
        currentPage={userData!.fullname}
        currentItemId={userData!.username}
      />
      <Alert
        severity={alertSeverity}
        title={alertTitle}
        description={alertDescription}
      />
    </>
  );
}

const InvalideUserComponent = ({ error }) => (
  <>
    <BreadCrumbFiller currentPage="Invalide" currentItemId={null} />
    <h1>Ce membre est inconnu dans la communauté ou invalide</h1>
    <p>{(error && error.toString()) || ""}</p>
    <br />
    <Button linkProps={{ href: `/community` }}>Explorer la communauté</Button>
  </>
);
