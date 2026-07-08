"use client";

import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo } from "react";
import { getStateHex, markerRadius } from "./stateColors";
import { MapSkeleton } from "./LoadingSkeleton";
import { t } from "./labels";
import type { Demand, UiLocale, Ward, WardGeoJson } from "./types";

const VIZAG_CENTER = { lat: 17.6868, lng: 83.2185 };
const DEFAULT_ZOOM = 12;

function geoJsonToPaths(geojson: WardGeoJson): google.maps.LatLngLiteral[][] {
  const paths: google.maps.LatLngLiteral[][] = [];
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

function WardPolygons({ wards }: { wards: Ward[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || wards.length === 0) return;

    const polygons = wards.flatMap((ward) => {
      const paths = geoJsonToPaths(ward.geojson);
      return paths.map(
        (path) =>
          new google.maps.Polygon({
            paths: path,
            strokeColor: "#0f4c81",
            strokeOpacity: 0.7,
            strokeWeight: 2,
            fillColor: "#3b82f6",
            fillOpacity: 0.08,
            map,
          }),
      );
    });

    return () => polygons.forEach((p) => p.setMap(null));
  }, [map, wards]);

  return null;
}

function DemandMarker({
  demand,
  onSelect,
}: {
  demand: Demand;
  onSelect: (id: string) => void;
}) {
  if (demand.lat == null || demand.lng == null) return null;
  const r = markerRadius(demand.affectedCount);
  const color = getStateHex(demand.state);

  return (
    <AdvancedMarker
      position={{ lat: demand.lat, lng: demand.lng }}
      onClick={() => onSelect(demand.id)}
      title={demand.title}
    >
      <div
        className="cursor-pointer rounded-full border-2 border-white shadow-md transition-transform hover:scale-110"
        style={{
          width: r,
          height: r,
          backgroundColor: color,
          opacity: 0.85,
        }}
      />
    </AdvancedMarker>
  );
}

interface DemandMapProps {
  demands: Demand[];
  wards: Ward[];
  wardsAvailable: boolean;
  loading: boolean;
  locale: UiLocale;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function MapContent({
  demands,
  wards,
  wardsAvailable,
  onSelect,
}: Omit<DemandMapProps, "loading" | "locale" | "selectedId">) {
  const mappable = useMemo(
    () => demands.filter((d) => d.lat != null && d.lng != null),
    [demands],
  );

  return (
    <Map
      defaultCenter={VIZAG_CENTER}
      defaultZoom={DEFAULT_ZOOM}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapId="mpconnect-dashboard"
      className="h-full w-full"
    >
      {/* TODO: confirm GET /api/wards shape with A — polygons render when endpoint exists */}
      {wardsAvailable && wards.length > 0 && <WardPolygons wards={wards} />}
      {mappable.map((d) => (
        <DemandMarker key={d.id} demand={d} onSelect={onSelect} />
      ))}
    </Map>
  );
}

export function DemandMap({
  demands,
  wards,
  wardsAvailable,
  loading,
  locale,
  onSelect,
}: DemandMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (loading) return <MapSkeleton />;

  if (!apiKey) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-100 p-6 text-center">
        <p className="text-sm text-slate-600">{t("mapUnavailable", locale)}</p>
        <p className="mt-2 text-xs text-slate-400">
          {demands.length} demand{demands.length !== 1 ? "s" : ""} would appear as sized markers
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MapContent
        demands={demands}
        wards={wards}
        wardsAvailable={wardsAvailable}
        onSelect={onSelect}
      />
    </APIProvider>
  );
}
