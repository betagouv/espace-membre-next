"use client";

import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster/dist/leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";

import "./styles-marker-cluster.css";
import { Point } from ".";

interface Props {
    points: Point[];
}

let markers: L.MarkerClusterGroup;

const Clusterizer: React.FC<Props> = ({ points }) => {
    const map = useMap();

    if (markers !== undefined) {
        map.removeLayer(markers);
    }

    markers = L.markerClusterGroup({
        // This function is used within leaflet, do not remove because the IDE tells you so
        iconCreateFunction: (cluster) => {
            var childCount = cluster.getChildCount();

            var markerCluster = " marker-cluster-";
            if (childCount < 10) {
                markerCluster += "small";
            } else if (childCount < 100) {
                markerCluster += "medium";
            } else {
                markerCluster += "large";
            }

            // aria-label for screen reader
            return new L.DivIcon({
                html: `<div><span aria-label="${childCount}">${childCount}</span></div>`,
                className: "marker-cluster" + markerCluster,
                iconSize: new L.Point(40, 40),
            });
        },
        maxClusterRadius: 50,
    });

    points.forEach((point) => {
        const { geoLoc, label, href, content } = point;
        if (geoLoc && geoLoc.lat && geoLoc.lon) {
            let marker = L.marker(new L.LatLng(geoLoc.lat, geoLoc.lon), {
                alt: label,
            });

            const popup = L.popup().setContent(`
        <div>
          <p class='fr-text--lg fr-text--bold fr-mb-1w'> ${label} </p> 
          ${content}
          ${
              href
                  ? `<a class="fr-btn fr-btn--tertiary" href="${href}">
                      Voir la fiche
                  </a>`
                  : ""
          }
        </div>
        `);

            marker.bindPopup(popup);
            markers.addLayer(marker);
        }
    });

    map.addLayer(markers);
    return null;
};

export default Clusterizer;
