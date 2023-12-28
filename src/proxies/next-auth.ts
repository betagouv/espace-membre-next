import config from "@/config";
import { signIn as real_signIn } from "next-auth/react";
import { signOut as real_signOut } from "next-auth/react";
import { getSession as real_getSession } from "next-auth/react";
export { useSession as real_useSession } from "next-auth/react";
import { getServerSession as real_getServerSession } from "next-auth";
import { useEffect, useState } from "react";
import routes, { computeRoute } from "@/routes/routes";
import axios from "axios";

const mock_signIn: typeof real_signIn = async function () {
    console.log(`"signIn" mock has been called`);

    return {
        error: undefined,
        status: 200,
        ok: true,
        url: "/no-matter",
    } as any; // "any" is not great, but that's how they do in the official code due to complex typings (ref: https://github.com/nextauthjs/next-auth/blob/2c669b32fc51ede4ed334384fbdbe01dc1cce9cc/packages/next-auth/src/react/index.tsx#L276)
};

export const signIn: typeof real_signIn =
    process.env.NODE_ENV === "test" ? mock_signIn : real_signIn;

const mock_signOut: typeof real_signOut = async function () {
    console.log(`"signOut" mock has been called`);

    return {
        url: "/no-matter",
    } as any;
};

export const signOut: typeof real_signOut =
    process.env.NODE_ENV === "test" ? mock_signOut : real_signOut;

const mock_getSession: typeof real_getSession = async function () {
    console.log(`"getSession" mock has been called`);

    return {
        status: "loading",
    } as any;
};

export const getSession: typeof real_getSession =
    process.env.NODE_ENV === "test" ? mock_getSession : real_getSession;

const mock_getServerSession: typeof real_getServerSession = async function () {
    console.log(`"getServerSession" mock has been called`);

    return {
        status: "loading",
    } as any;
};

export const useSession = function useSession(props?: {
    required?: boolean;
    onUnauthenticated?: () => void;
    onAuthenticated?: () => void;
}) {
    const [loading, setLoading] = useState<boolean>(false);
    const [data, setData] = useState<{
        user: { name: string; isAdmin: boolean };
    }>();
    const [status, setStatus] = useState<string>("loading");

    useEffect(() => {
        setStatus("loading");
        axios
            .get(computeRoute(routes.ME), { withCredentials: true })
            .then((data) => {
                if (data.data.user) {
                    setStatus("authenticated");
                    setData({
                        ...data.data,
                    });
                    if (props && props.onAuthenticated) {
                        props.onAuthenticated();
                    }
                } else {
                    setStatus("unauthenticated");
                    if (props && props.onUnauthenticated) {
                        props.onUnauthenticated();
                    }
                }
                setLoading(false);
            })
            .catch(() => {
                setStatus("unauthenticated");
                if (props && props.onUnauthenticated) {
                    props.onUnauthenticated();
                }
                setLoading(false);
            });

        return () => {};
    }, [loading]);

    return {
        loading,
        data,
        status,
    };
};

export const getServerSession: typeof real_getServerSession =
    process.env.NODE_ENV === "test"
        ? mock_getServerSession
        : real_getServerSession;
