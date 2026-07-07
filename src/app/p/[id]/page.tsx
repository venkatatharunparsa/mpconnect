import type { Metadata } from "next";
import { PERSONAL_CATEGORIES } from "@/server/taxonomy";
import { RallyPointClient } from "@/components/RallyPointClient";

// TODO: confirm shape with A — server-side fetch for metadata when API exists
async function fetchDemandMeta(id: string) {
  const base = process.env.PUBLIC_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/demands/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.demand ?? data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const demand = await fetchDemandMeta(params.id);
  if (!demand || PERSONAL_CATEGORIES.includes(demand.category)) {
    return { title: "MPconnect — Rally point" };
  }
  return {
    title: `${demand.title} — MPconnect`,
    description: `Affects ${demand.affectedCount} citizens · ${demand.ward ?? "Visakhapatnam"}`,
    openGraph: {
      title: demand.title,
      description: `Affects ${demand.affectedCount} citizens`,
    },
  };
}

export default async function RallyPointPage({ params }: { params: { id: string } }) {
  const demand = await fetchDemandMeta(params.id);
  const isPersonal =
    demand != null && PERSONAL_CATEGORIES.includes(demand.category as string);

  return <RallyPointClient demandId={params.id} isPersonal={isPersonal} />;
}
