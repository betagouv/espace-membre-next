"use client";

import { useRef } from "react";

import L, { LatLngExpression } from "leaflet";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";

import Clusterizer from "./Clusterizer";
import MapZoomHandler from "./MapZoomHandler";
import styles from "./styles.module.css";
import { useLeafletAccessibility } from "./useLeafletAccessibility";

import "leaflet/dist/leaflet.css";

L.Icon.Default.imagePath = "/static/images/";

export type Point = {
  geoLoc?: {
    lat: number;
    lon: number;
  };
  label: string;
  content?: string;
  href?: string;
};

interface Props {
  points: Point[];
  centerPosition?: LatLngExpression;
  distance?: number;
  zoom?: number;
}

export const Map: React.FC<Props> = ({
  points = [],
  centerPosition = [46.763031, 2.471237],
  zoom = 5,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useLeafletAccessibility(ref);

  return (
    <div ref={ref}>
      <MapContainer
        className={`fr-mx-auto ${styles.map}`}
        center={centerPosition}
        zoom={zoom}
        scrollWheelZoom={true}
        maxZoom={25}
        minZoom={3}
        zoomControl={false}
      >
        <MapZoomHandler />

        <Clusterizer points={points} />

        <ZoomControl zoomInTitle="Zoomer" zoomOutTitle="Dézoomer" />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
      </MapContainer>
    </div>
  );
};
