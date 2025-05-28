import React, { useState } from "react";

import { useMap } from "react-leaflet";

const MapZoomHandler = () => {
    const map = useMap();

    const [msg, setMsg] = useState<string | null>(null);

    map.on("zoomend", (e) => {
        setMsg(`le zoom de la carte est maintenant au niveau ${map.getZoom()}`);
    });

    return <p aria-live="polite">{msg}</p>;
};

export default MapZoomHandler;
