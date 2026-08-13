import Button from "@codegouvfr/react-dsfr/Button";
import type { Metadata, ResolvingMetadata } from "next";
import { getServerSession } from "next-auth/next";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import MemberPage from "@/components/MemberPage/MemberPage";
import { authOptions } from "@/lib/authoptions";
import { buildMemberPageProps } from "@/lib/memberPageProps";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;
  return {
    title: `Membre ${id} / Espace Membre`,
  };
}

export default async function Page(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id) {
    throw new Error(`You don't have the right to access this function`);
  }

  let memberPageProps;
  try {
    memberPageProps = await buildMemberPageProps({
      session,
      memberId: id,
      isCurrentUser: session.user.id === id,
    });
  } catch (e: any) {
    return (
      <>
        <BreadCrumbFiller currentPage="Invalide" currentItemId={null} />
        <h1>Ce membre est inconnu dans la communauté ou invalide</h1>
        <p>{(e && e.toString()) || ""}</p>
        <br />
        <Button linkProps={{ href: `/community` }}>
          Explorer la communauté
        </Button>
      </>
    );
  }

  return (
    <>
      <BreadCrumbFiller
        currentPage={memberPageProps.userInfos.fullname}
        currentItemId={memberPageProps.userInfos.username}
      />
      <MemberPage {...memberPageProps} />
    </>
  );
}
