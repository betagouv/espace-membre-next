"use client";

import { useRef } from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import { LatLngLiteral } from "leaflet";
import L from "leaflet";

import styles from "./styles.module.css";
import Clusterizer from "./Clusterizer";
import MapEventHandler from "./MapEventHandler";
import { useLeafletAccessibility } from "./useLeafletAccessibility";
import MapZoomHandler from "./MapZoomHandler";

import "leaflet/dist/leaflet.css";

L.Icon.Default.imagePath = "static/images/";

export type Point = {
    geoLoc?: {
        lat: number;
        lon: number;
    };
    label: string;
    href?: string;
};

interface Props {
    points: Point[];
    centerPosition?: LatLngLiteral;
    distance?: number;
    zoom?: number;
}

export const Map: React.FC<Props> = ({
    points = [],
    centerPosition = [46.763031, 2.471237],
    zoom = 5,
}) => {
    const ref = useRef(null);
    useLeafletAccessibility(ref);

    return (
        <div ref={ref}>
            <MapContainer
                className={`fr-mx-auto ${styles.map}`}
                center={centerPosition}
                zoom={zoom}
                scrollWheelZoom={false}
                maxZoom={25}
                minZoom={3}
                zoomControl={false}
            >
                <MapEventHandler />
                <MapZoomHandler />

                <Clusterizer points={points} />

                <ZoomControl zoomInTitle="Zoomer" zoomOutTitle="Dézoomer" />

                <TileLayer
                    url="https://data.geopf.fr/wmts?service=WMTS&request=GetTile&version=1.0.0&tilematrixset=PM&tilematrix={z}&tilecol={x}&tilerow={y}&layer=ORTHOIMAGERY.ORTHOPHOTOS&format=image/jpeg&style=normal"
                    //https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; IGN-F/Geoportail"
                />
            </MapContainer>
        </div>
    );
    /*io*/
};
