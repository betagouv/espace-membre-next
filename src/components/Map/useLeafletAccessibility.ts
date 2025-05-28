import { MutableRefObject, useEffect } from "react";

export function useLeafletAccessibility(
  ref: MutableRefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const leafletDivContainer = ref.current;
    if (leafletDivContainer) {
      const popupContainer = leafletDivContainer.querySelector(
        ".leaflet-pane .leaflet-popup-pane",
      );

      const observer = new MutationObserver((mutations) => {
        mutations.forEach(({ type, target }) => {
          if (type === "childList" && target instanceof Element) {
            const popupCloseLink = target.querySelector(
              ".leaflet-popup-close-button",
            );

            popupCloseLink &&
              popupCloseLink.setAttribute("aria-label", "Fermer");
          }
        });
      });

      observer.observe(popupContainer!, { childList: true });

      return () => observer.disconnect();
    }
  }, [ref]);
}
