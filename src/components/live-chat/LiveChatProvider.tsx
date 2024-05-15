"use client";

import { PropsWithChildren, useCallback, useEffect, useState } from "react";

import { Crisp } from "crisp-sdk-web";

import { LiveChatContext } from "@/components/live-chat/LiveChatContext";
import frontConfig from "@/frontConfig";

const crispWebsiteId: string =
    process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID ||
    process.env.CRISP_WEBSITE_ID ||
    "no_crisp_settings";

const typeForms = {
    doNotReceivedEmail: ["problem", "email", "email-contact", "details"],
};

const ChatwootScript = () => {
    useEffect(() => {
        (function (d, t) {
            if (!frontConfig.CHATWOOT_WEBSITE_TOKEN) {
                throw new Error("Chatwoot website token not defined");
            }
            const BASE_URL = "https://chatwoot.incubateur.net";
            const g = d.createElement(t) as HTMLScriptElement,
                s = d.getElementsByTagName(t)[0];
            g.src = BASE_URL + "/packs/js/sdk.js";
            g.defer = true;
            g.async = true;
            if (s.parentNode) s.parentNode.insertBefore(g, s);
            g.onload = function () {
                if (window.chatwootSDK) {
                    window.chatwootSDK.run({
                        websiteToken:
                            frontConfig.CHATWOOT_WEBSITE_TOKEN as string,
                        baseUrl: BASE_URL,
                    });
                }
            };
        })(document, "script");
    }, []); // Empty dependency array ensures this runs only once

    return null; // This component does not render anything to the DOM
};

export const LiveChatProvider = ({ children }: PropsWithChildren) => {
    // [IMPORTANT] When using `useSearchParams()` is breaks the the vanilla DSFR to add attributes to the `html` tag
    // resulting in the `react-dsfr` not able to initialize... it's an odd case, things are missing for mystic reasons
    // It's only happening when starting a built bundle, not in development...
    // Just using more below a vanilla frontend look up on search params
    // const searchParams = useSearchParams();

    const chatName: string = frontConfig.CHAT_SUPPORT_SERVICE || "chatwoot";
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const showLiveChat = useCallback(async (type) => {
        if (chatName === "chatwoot") {
            if (typeof window != "undefined" && window.$chatwoot) {
                window.$chatwoot.toggle("open");
            }
            return;
        }
        // Even if it failed retrieving information for this user, let the user contact the support
        Crisp.chat.open();
        // Example 4: show a field message
        if (type === "doNotReceivedEmail") {
            Crisp.message.show("picker", {
                id: "problem",
                text: "Bonjour, quel est ton problème ?",

                choices: [
                    {
                        value: "mattermost",
                        label: "mattermost",
                        selected: false,
                    },

                    {
                        value: "connexion espace-membre",
                        label: "connexion espace-membre",
                        selected: false,
                    },
                ],
            });
            let step = 0;
            Crisp.message.onMessageReceived((data) => {
                let messageToDisplay;
                // // Skip responses not being updates
                if (data.origin !== "update") {
                    return;
                }
                console.log(step, typeForms[type].indexOf(data.content.id));
                if (step === typeForms[type].indexOf(data.content.id)) {
                    messageToDisplay = typeForms[type][step + 1];
                    step = step + 1;
                }
                if (messageToDisplay === "email") {
                    Crisp.message.show("field", {
                        id: "email",
                        text: "Quel email as-tu utilisé pour essayer de te connecter ?",
                        explain: "Entre l'email que tu as utilisé",
                    });
                    return;
                }

                if (messageToDisplay === "email-contact") {
                    Crisp.message.show("field", {
                        id: "email-contact",
                        text: "Sur quel email peut-on te contacter ?",
                        explain: "Entre l'email que tu as utilisé",
                    });
                    return;
                }

                if (messageToDisplay === "details") {
                    Crisp.message.send(
                        "text",
                        "Si tu as d'avantage de détails à donner tu peux l'écrire ci dessous"
                    );
                }
            });
        }
    }, []);

    useEffect(() => {
        if (chatName === "chatwoot") {
            return;
        }
        // This `sessionIdToResume` definition is a workaround, see at the top of the component for the reason
        let sessionIdToResume = null;
        // if (window) {
        //     const searchParams = new URLSearchParams(window.location.search);
        //     sessionIdToResume = searchParams.get("crisp_sid");
        // }

        Crisp.configure(crispWebsiteId, {
            autoload: !!sessionIdToResume, // If the user comes from a Crisp email to reply to the session, we load Crisp and this one should handle retrieving previous session
            cookieExpire: 7 * 24 * 60 * 60, // Must be in seconds, currently 7 days instead of the default 6 months
            sessionMerge: true,
            locale: "fr",
        });

        // if (sessionIdToResume) {
        //     showLiveChat();
        // }

        return () => {
            // Crisp should allow us to destroy the instance (for Storybook for example)
            // Ref: https://stackoverflow.com/questions/71967230/how-to-destroy-crisp-chat
        };
    }, [showLiveChat]);

    return (
        <>
            <LiveChatContext.Provider
                value={{
                    showLiveChat: showLiveChat,
                    isLiveChatLoading: isLoading,
                }}
            >
                {children}
                <ChatwootScript />
            </LiveChatContext.Provider>
        </>
    );
};
