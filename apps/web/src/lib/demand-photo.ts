type DemandPhotoInput = {
  photoUrl?: string | null;
  category: string;
  title?: string;
};

/** Demo seed uses inline SVG data URIs — replace with real stock photos in the UI. */
function isDemoPlaceholderPhoto(url: string) {
  return url.startsWith("data:image/svg+xml");
}

const UNSPLASH_BY_CATEGORY: Record<string, string> = {
  safety_hazard:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  electricity:
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
  water_supply:
    "https://images.unsplash.com/photo-1581091870622-7b0e460d41d2?auto=format&fit=crop&w=800&q=80",
  water_leakage:
    "https://images.unsplash.com/photo-1607472586893-edb57bdc127e?auto=format&fit=crop&w=800&q=80",
  streetlights:
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
  drainage:
    "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=800&q=80",
  garbage:
    "https://images.unsplash.com/photo-1530587199841-c3cc4a2dafd2?auto=format&fit=crop&w=800&q=80",
  potholes_roads:
    "https://images.unsplash.com/photo-1590362891995-a9e5a39ddbc7?auto=format&fit=crop&w=800&q=80",
  school_upgrade:
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80",
  health_facility:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
  parks_playgrounds:
    "https://images.unsplash.com/photo-1564361575420-74c709d42253?auto=format&fit=crop&w=800&q=80",
  community_infra:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
  vocational_training:
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
  transport:
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
  pollution:
    "https://images.unsplash.com/photo-1611273426858-450d8eee07fa?auto=format&fit=crop&w=800&q=80",
  encroachment:
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80",
  other:
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80",
};

const DEFAULT_UNSPLASH =
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80";

function titleHintPhoto(title: string) {
  const t = title.toLowerCase();
  if (t.includes("wire") || t.includes("electric") || t.includes("power line")) {
    return UNSPLASH_BY_CATEGORY.safety_hazard;
  }
  if (t.includes("playground") || t.includes("park")) {
    return UNSPLASH_BY_CATEGORY.parks_playgrounds;
  }
  if (t.includes("pothole") || t.includes("road")) {
    return UNSPLASH_BY_CATEGORY.potholes_roads;
  }
  if (t.includes("water") && (t.includes("leak") || t.includes("pipe"))) {
    return UNSPLASH_BY_CATEGORY.water_leakage;
  }
  if (t.includes("water")) {
    return UNSPLASH_BY_CATEGORY.water_supply;
  }
  if (t.includes("garbage") || t.includes("waste")) {
    return UNSPLASH_BY_CATEGORY.garbage;
  }
  if (t.includes("drain") || t.includes("flood") || t.includes("stagnat")) {
    return UNSPLASH_BY_CATEGORY.drainage;
  }
  if (t.includes("light")) {
    return UNSPLASH_BY_CATEGORY.streetlights;
  }
  if (t.includes("school") || t.includes("classroom")) {
    return UNSPLASH_BY_CATEGORY.school_upgrade;
  }
  if (t.includes("health") || t.includes("hospital") || t.includes("medicine")) {
    return UNSPLASH_BY_CATEGORY.health_facility;
  }
  return null;
}

export function demandPhotoUrl(demand: DemandPhotoInput): string {
  const raw = demand.photoUrl?.trim();
  if (raw && !isDemoPlaceholderPhoto(raw)) return raw;

  if (demand.title) {
    const hinted = titleHintPhoto(demand.title);
    if (hinted) return hinted;
  }

  return UNSPLASH_BY_CATEGORY[demand.category] ?? DEFAULT_UNSPLASH;
}
