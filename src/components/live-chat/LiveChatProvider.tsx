"use client";

import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Script from "next/script";

import { LiveChatContext } from "@/components/live-chat/LiveChatContext";

// Widget de contact de Messages (La Suite numérique) : les messages arrivent
// dans la boîte contact@beta.gouv.fr sur support.incubateur.net
const widgetsUrl = "https://beta.gouv.fr/assets/lasuite-widgets";
const widgetApiUrl = "https://support.incubateur.net/api/v1.0/inbound/widget/";
const widgetChannel: string =
  process.env.NEXT_PUBLIC_SUPPORT_WIDGET_CHANNEL ||
  "daeaa334-dff4-4944-8c14-676ac6fbb167";

const closeLabel = "Fermer le formulaire de contact";

declare global {
  interface Window {
    _lasuite_widget?: unknown[];
  }
}

// Le loader et le formulaire sont rendus dans des shadow DOM ouverts
const getWidgetElement = (widget: "loader" | "feedback", selector: string) =>
  document
    .getElementById(`lasuite-widget-${widget}-shadow`)
    ?.shadowRoot?.querySelector<HTMLElement>(selector);

// Évite un second bouton flottant quand React rejoue l'effet (strict mode)
let isWidgetInitialized = false;

// Lien direct vers le formulaire, utilisé par doc.incubateur.net
const contactHash = "#contact";

// Widget bloqué (bloqueur de pub, réseau…) ou API Messages en panne
const goToSupportPage = () => {
  // Déjà sur /support : pas de rechargement, on montre l'email de contact
  if (window.location.pathname === "/support") {
    document.getElementById(contactHash.slice(1))?.scrollIntoView();
    return;
  }
  window.location.assign("/support");
};

export const LiveChatProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Ouverture demandée par showLiveChat, en attente de l'événement `opened`
  const pendingOpening = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const showLiveChat = useCallback(() => {
    const loaderButton = getWidgetElement("loader", "button");
    if (!loaderButton) {
      goToSupportPage();
      return;
    }
    if (loaderButton.classList.contains("opened")) {
      getWidgetElement("feedback", "textarea")?.focus();
      return;
    }
    if (pendingOpening.current || loaderButton.classList.contains("loading")) {
      return;
    }
    setIsLoading(true);
    loaderButton.click();
    // Le loader abandonne lui aussi au bout de 10 secondes
    pendingOpening.current = setTimeout(() => {
      pendingOpening.current = undefined;
      setIsLoading(false);
      goToSupportPage();
    }, 10_000);
  }, []);

  useEffect(() => {
    if (!isWidgetInitialized) {
      isWidgetInitialized = true;
      window._lasuite_widget = window._lasuite_widget || [];
      window._lasuite_widget.push([
        "loader",
        "init",
        {
          widget: "feedback",
          script: `${widgetsUrl}/feedback.js`,
          label: "Contacter le support",
          closeLabel,
          params: {
            api: widgetApiUrl,
            channel: widgetChannel,
            title: "Contacter le support",
            placeholder: "Décris ta question ou ton problème…",
            emailPlaceholder: "Ton adresse email",
            submitText: "Envoyer",
            successText: "Ton message a bien été envoyé.",
            successText2: "L'équipe support te répondra par email.",
            closeLabel,
          },
        },
      ]);
    }

    const stopLoading = (event: Event) => {
      // `closed` sans `opened` : feedback.js n'a pas pu récupérer sa config
      const hasFailed =
        !!pendingOpening.current &&
        event.type === "lasuite-widget-feedback-closed";
      clearTimeout(pendingOpening.current);
      pendingOpening.current = undefined;
      setIsLoading(false);
      if (hasFailed) {
        goToSupportPage();
      }
    };
    document.addEventListener("lasuite-widget-feedback-opened", stopLoading);
    document.addEventListener("lasuite-widget-feedback-closed", stopLoading);
    return () => {
      document.removeEventListener(
        "lasuite-widget-feedback-opened",
        stopLoading,
      );
      document.removeEventListener(
        "lasuite-widget-feedback-closed",
        stopLoading,
      );
    };
  }, []);

  // Ouvre le formulaire dès le chargement d'une URL qui finit par #contact
  useEffect(() => {
    if (window.location.hash !== contactHash) {
      return;
    }
    // Le bouton existe déjà si loader.js était chargé avant l'init
    if (getWidgetElement("loader", "button")) {
      showLiveChat();
      return;
    }
    // Sinon loader.js crée le bouton puis émet `loaded` ; s'il est bloqué,
    // rien ne se passe et la page reste lisible
    const openWhenLoaded = () => showLiveChat();
    document.addEventListener("lasuite-widget-loader-loaded", openWhenLoaded, {
      once: true,
    });
    return () =>
      document.removeEventListener(
        "lasuite-widget-loader-loaded",
        openWhenLoaded,
      );
  }, [showLiveChat]);

  return (
    <>
      <Script src={`${widgetsUrl}/loader.js`} strategy="afterInteractive" />
      <LiveChatContext.Provider
        value={{
          showLiveChat: showLiveChat,
          isLiveChatLoading: isLoading,
        }}
      >
        {children}
      </LiveChatContext.Provider>
    </>
  );
};
