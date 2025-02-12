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
    parent: ResolvingMetadata
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
    // compile some account informations

    try {
        const user = await userInfos({ username: id }, session.user.id === id);
        let alert: JSX.Element;
        // validate server side
        try {
            await validateNewMember({
                memberUuid: user?.userInfos.uuid,
            });
            alert = (
                <Alert
                    severity="success"
                    title="Fiche membre validé"
                    description={`La fiche membre de ${user.userInfos.fullname} a été validée par ${session.user.id}`}
                />
            );
        } catch (error) {
            if (error instanceof BusinessError) {
                const businessError = error as BusinessError;
                if (businessError.code === "userAlreadyValided") {
                    alert = (
                        <Alert
                            severity="info"
                            title="Fiche membre déjà validée"
                            description={error.message}
                        />
                    );
                }
            }
            alert = (
                <Alert
                    severity="error"
                    title="Une erreur est survenue lors de la validation"
                    description={(error as Error).message}
                />
            );
        }
        return (
            <>
                <BreadCrumbFiller
                    currentPage={user.userInfos.fullname}
                    currentItemId={user.userInfos.uuid}
                />
                {alert}
            </>
        );
    } catch (e: any) {
        return <InvalideUserComponent error={e}></InvalideUserComponent>;
    }
}

const InvalideUserComponent = ({ error }) => (
    <>
        <BreadCrumbFiller currentPage="Invalide" currentItemId={null} />
        <h1>Ce membre est inconnu dans la communauté ou invalide</h1>
        <p>{(error && error.toString()) || ""}</p>
        <br />
        <Button linkProps={{ href: `/community` }}>
            Explorer la communauté
        </Button>
    </>
);
