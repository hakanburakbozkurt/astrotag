import type { BirthCoordinates } from "./types";

const GEOCODE_ERROR_MESSAGE =
  "Konum doğrulanamadı: Lütfen bilgileri kontrol edin.";

export class GeocodeValidationError extends Error {
  constructor(message: string = GEOCODE_ERROR_MESSAGE) {
    super(message);
    this.name = "GeocodeValidationError";
  }
}

type GeocodeHit = {
  latitude: number;
  longitude: number;
  timezone: string;
  name: string;
  admin1?: string;
  country?: string;
};

function normalizeLocationName(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function parseBirthPlace(birthPlace: string): {
  birthCity: string;
  birthDistrict: string;
} {
  const parts = birthPlace
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    birthCity: parts[0] ?? "",
    birthDistrict: parts[1] ?? "",
  };
}

function matchesCity(hit: GeocodeHit, city: string): boolean {
  const normalizedCity = normalizeLocationName(city);

  return (
    normalizeLocationName(hit.name) === normalizedCity ||
    normalizeLocationName(hit.admin1 ?? "") === normalizedCity
  );
}

function matchesDistrict(hit: GeocodeHit, district: string): boolean {
  return normalizeLocationName(hit.name) === normalizeLocationName(district);
}

function toBirthCoordinates(hit: GeocodeHit): BirthCoordinates {
  if (!hit.timezone?.trim()) {
    throw new GeocodeValidationError();
  }

  const displayName = hit.country
    ? `${hit.name}, ${hit.country}`
    : hit.name;

  return {
    latitude: hit.latitude,
    longitude: hit.longitude,
    timezone: hit.timezone.trim(),
    displayName,
  };
}

function pickBestMatch(
  hits: GeocodeHit[],
  birthCity: string,
  birthDistrict: string
): GeocodeHit | null {
  if (hits.length === 0) {
    return null;
  }

  if (birthDistrict && birthCity) {
    return (
      hits.find(
        (hit) => matchesDistrict(hit, birthDistrict) && matchesCity(hit, birthCity)
      ) ?? null
    );
  }

  if (birthCity) {
    return hits.find((hit) => matchesCity(hit, birthCity)) ?? null;
  }

  const first = hits[0];
  return first?.timezone?.trim() ? first : null;
}

async function fetchGeocodeResults(
  query: string,
  count = 10
): Promise<GeocodeHit[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", String(count));
  url.searchParams.set("language", "tr");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new GeocodeValidationError();
  }

  const data = (await response.json()) as {
    results?: Array<{
      latitude: number;
      longitude: number;
      timezone: string;
      name: string;
      admin1?: string;
      country?: string;
    }>;
  };

  return (data.results ?? []).map((hit) => ({
    latitude: hit.latitude,
    longitude: hit.longitude,
    timezone: hit.timezone,
    name: hit.name,
    admin1: hit.admin1,
    country: hit.country,
  }));
}

function buildGeocodeQueries(birthCity: string, birthDistrict: string): string[] {
  const queries: string[] = [];

  if (birthDistrict && birthCity) {
    queries.push(`${birthDistrict}, ${birthCity}`);
    queries.push(birthDistrict);
  }

  if (birthCity) {
    queries.push(birthCity);
  }

  return [...new Set(queries.map((query) => query.trim()).filter(Boolean))];
}

export async function resolveBirthPlace(
  birthPlace: string
): Promise<BirthCoordinates> {
  const query = birthPlace.trim();
  if (!query) {
    throw new GeocodeValidationError();
  }

  const { birthCity, birthDistrict } = parseBirthPlace(query);
  const queries = buildGeocodeQueries(birthCity, birthDistrict);

  try {
    for (const candidate of queries) {
      const hits = await fetchGeocodeResults(candidate);
      const match = pickBestMatch(hits, birthCity, birthDistrict);

      if (match) {
        return toBirthCoordinates(match);
      }
    }

    throw new GeocodeValidationError();
  } catch (error) {
    if (error instanceof GeocodeValidationError) {
      throw error;
    }

    throw new GeocodeValidationError();
  }
}
