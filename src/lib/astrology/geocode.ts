import type { BirthCoordinates } from "./types";

type GeocodeResult = {
  latitude: number;
  longitude: number;
  timezone: string;
  name: string;
};

const FALLBACK: BirthCoordinates = {
  latitude: 41.0082,
  longitude: 28.9784,
  timezone: "Europe/Istanbul",
  displayName: "İstanbul",
};

async function fetchGeocode(query: string): Promise<GeocodeResult | null> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "tr");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());

  if (!response.ok) return null;

  const data = (await response.json()) as {
    results?: Array<{
      latitude: number;
      longitude: number;
      timezone: string;
      name: string;
      country?: string;
    }>;
  };

  const hit = data.results?.[0];
  if (!hit) return null;

  return {
    latitude: hit.latitude,
    longitude: hit.longitude,
    timezone: hit.timezone,
    name: hit.country ? `${hit.name}, ${hit.country}` : hit.name,
  };
}

export async function resolveBirthPlace(
  birthPlace: string
): Promise<BirthCoordinates> {
  const query = birthPlace.trim();
  if (!query) return FALLBACK;

  try {
    const hit = await fetchGeocode(query);
    if (!hit) return { ...FALLBACK, displayName: query };

    return {
      latitude: hit.latitude,
      longitude: hit.longitude,
      timezone: hit.timezone,
      displayName: hit.name,
    };
  } catch {
    return { ...FALLBACK, displayName: query };
  }
}
