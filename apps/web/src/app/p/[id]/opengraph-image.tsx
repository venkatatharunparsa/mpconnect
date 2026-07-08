import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { getStateHex } from "@/components/dashboard/stateColors";
import { serverApiUrl } from "@/lib/api-client";

export const runtime = "edge";
export const alt = "MPconnect share card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function fetchDemand(id: string) {
  try {
    const res = await fetch(serverApiUrl(`/api/demands/${id}`), { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.demand ?? data;
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: { id: string } }) {
  const demand = await fetchDemand(params.id);
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const pageUrl = `${siteBase}/p/${params.id}`;

  const title = demand?.title ?? "MPconnect demand";
  const affectedCount = demand?.affectedCount ?? 0;
  const ward = demand?.ward ?? "Visakhapatnam";
  const state = demand?.state ?? "claimed";
  const stateColor = getStateHex(state);
  const stateLabel = String(state).replace(/_/g, " ");

  const qrSvg = await QRCode.toString(pageUrl, { type: "svg", margin: 1, width: 4 });
  const qrDataUrl = `data:image/svg+xml,${encodeURIComponent(qrSvg)}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          backgroundColor: "#f8fafc",
          padding: 48,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            flex: 1,
            maxWidth: 900,
          }}
        >
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#0f4c81" }}>
            MPconnect ·{" "}
            <span style={{ color: stateColor, marginLeft: 8, textTransform: "capitalize" }}>
              {stateLabel}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 44,
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.15,
            }}
          >
            <div style={{ display: "flex" }}>{title}</div>
            <div style={{ display: "flex", fontSize: 32, color: "#0f4c81", marginTop: 16 }}>
              affects {affectedCount.toLocaleString()} citizens
            </div>
            <div style={{ display: "flex", fontSize: 22, color: "#64748b", marginTop: 8 }}>
              {ward} ward
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 16, color: "#94a3b8" }}>
            Scan to join · Citizens confirm closure
          </div>
        </div>
        <div style={{ display: "flex", marginLeft: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR" width={160} height={160} />
        </div>
      </div>
    ),
    { ...size },
  );
}
