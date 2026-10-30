import React, { useState } from "react";

import { useMapEvents } from "react-leaflet";

const MapZoomHandler = () => {
  const [msg, setMsg] = useState<string | null>(null);

  const map = useMapEvents({
    zoomend: () => {
      setMsg(`le zoom de la carte est maintenant au niveau ${map.getZoom()}`);
    },
  });

  return <p aria-live="polite">{msg}</p>;
};

export default MapZoomHandler;
