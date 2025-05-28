import { usePathname, useRouter } from "next/navigation";
import { useMap } from "react-leaflet";

export const MapEventHandler = () => {
  const map = useMap();

  map.on("moveend", (e) => {
    const center = map.getCenter();
    const zoom = map.getZoom();
  });

  return null;
};

export default MapEventHandler;
