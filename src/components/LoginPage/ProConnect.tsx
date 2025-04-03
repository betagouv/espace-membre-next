"use client";
import { ReactElement } from "react";

import { signIn } from "next-auth/react";

export const ProConnect = (): ReactElement => {
    const login = async (): Promise<void> => {
        signIn("proconnect");
    };

    return (
        <>
            <button
                type="button"
                className="fr-connect fr-mt-3w"
                onClick={login}
            >
                <span className="fr-connect__login">S’identifier avec</span>
                <span className="fr-connect__brand">ProConnect</span>
            </button>
            <p>
                <a
                    href="https://www.proconnect.gouv.fr/"
                    target="_blank"
                    rel="noopener"
                    title="Qu’est-ce que ProConnect ? - nouvelle fenêtre"
                >
                    Qu’est-ce que ProConnect ?
                </a>
            </p>
        </>
    );
};
