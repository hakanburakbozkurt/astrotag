import type { BirthCoordinates } from "./types";

export const GEOCODE_USER_HINT =
  "Lütfen doğum yerini sadece Şehir veya İlçe olarak belirtin";

const GEOCODE_ERROR_MESSAGE = GEOCODE_USER_HINT;

export class GeocodeValidationError extends Error {
  constructor(message: string = GEOCODE_ERROR_MESSAGE) {
    super(message);
    this.name = "GeocodeValidationError";
  }
}

export type GeocodeResolveResult =
  | { ok: true; coordinates: BirthCoordinates }
  | { ok: false; message: string };

/** "Ankara, Yenimahalle" → "Ankara" — il/şehir parçasını döndürür */
export function sanitizeBirthPlace(birthPlace: string): string {
  const parts = birthPlace
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return birthPlace.trim();
  }

  return parts[0];
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
    throw new GeocodeValidationError(GEOCODE_USER_HINT);
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

function hitKey(hit: GeocodeHit): string {
  return `${hit.latitude},${hit.longitude},${hit.name}`;
}

function mergeGeocodeHits(existing: GeocodeHit[], incoming: GeocodeHit[]): GeocodeHit[] {
  const seen = new Set(existing.map(hitKey));
  const merged = [...existing];

  for (const hit of incoming) {
    const key = hitKey(hit);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(hit);
  }

  return merged;
}

function scoreFallbackHit(
  hit: GeocodeHit,
  birthCity: string,
  birthDistrict: string
): number {
  let score = 0;
  const normalizedCity = normalizeLocationName(birthCity);
  const normalizedDistrict = normalizeLocationName(birthDistrict);
  const normalizedName = normalizeLocationName(hit.name);
  const normalizedAdmin1 = normalizeLocationName(hit.admin1 ?? "");

  if (
    birthDistrict &&
    (normalizedName.includes(normalizedDistrict) ||
      normalizedDistrict.includes(normalizedName))
  ) {
    score += 30;
  }

  if (
    birthCity &&
    (normalizedName.includes(normalizedCity) ||
      normalizedAdmin1.includes(normalizedCity) ||
      normalizedCity.includes(normalizedName) ||
      normalizedCity.includes(normalizedAdmin1))
  ) {
    score += 20;
  }

  const country = hit.country?.toLocaleLowerCase("tr-TR") ?? "";
  if (country === "türkiye" || country === "turkey") {
    score += 5;
  }

  return score;
}

/** Tam eşleşme yoksa en yakın geçerli koordinat adayı */
function pickNearestFallback(
  hits: GeocodeHit[],
  birthCity: string,
  birthDistrict: string
): GeocodeHit | null {
  const validHits = hits.filter((hit) => hit.timezone?.trim());

  if (validHits.length === 0) {
    return null;
  }

  return [...validHits].sort(
    (left, right) =>
      scoreFallbackHit(right, birthCity, birthDistrict) -
      scoreFallbackHit(left, birthCity, birthDistrict)
  )[0];
}

function logGeocodeFallback(
  birthPlace: string,
  birthCity: string,
  birthDistrict: string,
  fallback: GeocodeHit
): void {
  console.warn(
    "[geocode] GeocodeValidationError — tam eşleşme bulunamadı, fallback koordinat kullanılıyor",
    {
      birthPlace,
      birthCity,
      birthDistrict,
      fallbackName: fallback.name,
      fallbackAdmin1: fallback.admin1,
      fallbackCountry: fallback.country,
      latitude: fallback.latitude,
      longitude: fallback.longitude,
      timezone: fallback.timezone,
    }
  );
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

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      return [];
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
  } catch (error) {
    console.warn("[geocode] API isteği başarısız", { query, error });
    return [];
  }
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

async function resolveBirthPlaceCandidates(
  birthCity: string,
  birthDistrict: string,
  originalQuery: string
): Promise<BirthCoordinates | null> {
  const queries = buildGeocodeQueries(birthCity, birthDistrict);
  const searchQueries = queries.includes(originalQuery)
    ? queries
    : [...queries, originalQuery];

  let allHits: GeocodeHit[] = [];

  for (const candidate of searchQueries) {
    const hits = await fetchGeocodeResults(candidate);
    allHits = mergeGeocodeHits(allHits, hits);

    const match = pickBestMatch(hits, birthCity, birthDistrict);
    if (match) {
      return toBirthCoordinates(match);
    }
  }

  const fallback = pickNearestFallback(allHits, birthCity, birthDistrict);
  if (fallback) {
    logGeocodeFallback(originalQuery, birthCity, birthDistrict, fallback);
    return toBirthCoordinates(fallback);
  }

  return null;
}

export async function resolveBirthPlaceSafe(
  birthPlace: string
): Promise<GeocodeResolveResult> {
  try {
    const coordinates = await resolveBirthPlace(birthPlace);
    return { ok: true, coordinates };
  } catch (error) {
    const message =
      error instanceof GeocodeValidationError ? error.message : GEOCODE_USER_HINT;

    console.warn("[geocode] soft-fail", {
      birthPlace,
      message,
    });

    return { ok: false, message };
  }
}

export async function resolveBirthPlace(
  birthPlace: string
): Promise<BirthCoordinates> {
  const query = birthPlace.trim();
  if (!query) {
    throw new GeocodeValidationError(GEOCODE_USER_HINT);
  }

  const { birthCity, birthDistrict } = parseBirthPlace(query);

  try {
    const direct = await resolveBirthPlaceCandidates(birthCity, birthDistrict, query);
    if (direct) {
      return direct;
    }

    if (birthDistrict) {
      const cityOnly = sanitizeBirthPlace(query);
      const sanitized = await resolveBirthPlaceCandidates(cityOnly, "", cityOnly);

      if (sanitized) {
        console.warn("[geocode] adres sadeleştirildi — yalnızca şehir kullanıldı", {
          original: query,
          cityOnly,
        });
        return sanitized;
      }
    }

    throw new GeocodeValidationError(GEOCODE_USER_HINT);
  } catch (error) {
    if (error instanceof GeocodeValidationError) {
      throw error;
    }

    console.error("[geocode] Beklenmeyen geocode hatası", {
      birthPlace: query,
      error,
    });
    throw new GeocodeValidationError(GEOCODE_USER_HINT);
  }
}
