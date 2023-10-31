import config from "@/config";
import { signIn as real_signIn } from "next-auth/react";
import { signOut as real_signOut } from "next-auth/react";
import { getSession as real_getSession } from "next-auth/react";
import { getServerSession as real_getServerSession } from "next-auth";
export { useSession, SessionProvider } from "next-auth/react";

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

export const getServerSession: typeof real_getServerSession =
    process.env.NODE_ENV === "test"
        ? mock_getServerSession
        : real_getServerSession;
