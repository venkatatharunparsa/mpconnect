"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getStateHex, markerRadius } from "./stateColors";
import type { Demand, Ward, WardGeoJson } from "./types";

const VIZAG_CENTER: [number, number] = [17.6868, 83.2185];
const DEFAULT_ZOOM = 12;

function geoJsonToPaths(geojson: WardGeoJson): { lat: number; lng: number }[][] {
  const paths: { lat: number; lng: number }[][] = [];
  if (geojson.type === "FeatureCollection" && geojson.features) {
    for (const f of geojson.features) {
      paths.push(...geoJsonToPaths(f));
    }
    return paths;
  }
  if (geojson.type === "Feature" && geojson.geometry) {
    return geoJsonToPaths(geojson.geometry);
  }
  if (geojson.type === "Polygon" && geojson.coordinates) {
    const ring = geojson.coordinates[0] as number[][];
    return [ring.map(([lng, lat]) => ({ lat, lng }))];
  }
  if (geojson.type === "MultiPolygon" && geojson.coordinates) {
    const polys = geojson.coordinates as number[][][][];
    return polys.map((poly) => {
      const ring = poly[0] as number[][];
      return ring.map(([lng, lat]) => ({ lat, lng }));
    });
  }
  return paths;
}

// Subcomponent to adjust map bounds/pan when needed
function MapEffects() {
  const map = useMap();
  useEffect(() => {
    // Force Leaflet to recalculate container size on load
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

interface LeafletMapProps {
  demands: Demand[];
  wards: Ward[];
  wardsAvailable: boolean;
  onSelect: (id: string) => void;
}

export default function LeafletMap({
  demands,
  wards,
  wardsAvailable,
  onSelect,
}: LeafletMapProps) {
  const mappable = useMemo(
    () => demands.filter((d) => d.lat != null && d.lng != null),
    [demands],
  );

  return (
    <MapContainer
      center={VIZAG_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="h-full w-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEffects />

      {/* Render Ward Polygons */}
      {wardsAvailable &&
        wards.map((ward, i) => {
          const paths = geoJsonToPaths(ward.geojson);
          return paths.map((path, j) => {
            const positions = path.map((p) => [p.lat, p.lng] as [number, number]);
            return (
              <Polygon
                key={`ward-${i}-${j}`}
                positions={positions}
                pathOptions={{
                  color: "#0f4c81",
                  weight: 2,
                  opacity: 0.7,
                  fillColor: "#3b82f6",
                  fillOpacity: 0.08,
                }}
              />
            );
          });
        })}

      {/* Render Demand Hotspots */}
      {mappable.map((d) => {
        const r = markerRadius(d.affectedCount);
        const color = getStateHex(d.state);

        // Custom Leaflet DivIcon with matching CSS styling
        const icon = L.divIcon({
          html: `<div style="
            width: ${r}px;
            height: ${r}px;
            background-color: ${color};
            border: 2px solid white;
            border-radius: 50%;
            opacity: 0.85;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.15s ease-in-out;
          " class="hover:scale-110"></div>`,
          className: "custom-demand-marker",
          iconSize: [r, r],
          iconAnchor: [r / 2, r / 2],
        });

        return (
          <Marker
            key={d.id}
            position={[d.lat!, d.lng!] as [number, number]}
            icon={icon}
            eventHandlers={{
              click: () => onSelect(d.id),
            }}
          />
        );
      })}
    </MapContainer>
  );
}
