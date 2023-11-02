"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Header, HeaderProps } from "@codegouvfr/react-dsfr/Header";
// import { useSession, signIn, signOut } from "next-auth/react";
import { linkRegistry } from "@/utils/routes/registry";
import { useSession, signOut } from "@/proxies/next-auth";
import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";

const MainHeader = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const quickAccessItems: (React.ReactNode | HeaderProps.QuickAccessItem)[] =
        [];
    if (session) {
        quickAccessItems.push({
            iconId: "fr-icon-account-line",
            text: session?.user?.name,
            linkProps: {
                href: linkRegistry.get("account", undefined),
            },
        });
        quickAccessItems.push({
            buttonProps: {
                onClick: async () => {
                    await axios.get(computeRoute(routes.LOGOUT_API), {
                        withCredentials: true,
                    });
                    router.push("/");
                    //signOut();
                },
            },
            iconId: "fr-icon-logout-box-r-line",
            text: `Se déconnecter`,
        });
    } else {
        quickAccessItems.push({
            buttonProps: {
                onClick: () => {
                    router.push("/login");
                },
            },
            iconId: "fr-icon-account-line",
            text: "Se connecter",
        });
    }
    return (
        <Header
            brandTop={<>beta.gouv.fr</>}
            homeLinkProps={{
                href: "/",
                title: "Accueil - Espace Membre @beta.gouv.fr",
            }}
            id="fr-header-header-with-quick-access-items"
            quickAccessItems={[...quickAccessItems]}
            serviceTagline="Mon espace membre de la communauté"
            serviceTitle="Espace-Membre @beta.gouv.fr"
        />
    );
};

export default MainHeader;
