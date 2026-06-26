import type { AspectType, PlanetId } from "@/lib/astrology/types";

export type OrbStrengthTier = "strong" | "supportive" | "weak";

const EXACT_ASPECT_ORB_THRESHOLD = 1;

const ASPECT_QUALITY: Record<AspectType, string> = {
  conjunction: "Bütünleşme",
  trine: "Rezonans",
  square: "Zorlanma",
  opposition: "Polarite",
};

const PLANET_DOMAIN: Record<PlanetId, string> = {
  sun: "Kimlik",
  moon: "Duygusal",
  mercury: "Zihinsel",
  venus: "Bağ",
  mars: "Enerji",
  jupiter: "Refah",
  saturn: "Yapı",
};

/** Gezegen çifti anahtarı — sıra bağımsız */
export function planetPairKey(a: PlanetId, b: PlanetId): string {
  return [a, b].sort().join("|");
}

export function buildAspectDrivenTitle(params: {
  userPlanetId: PlanetId;
  partnerPlanetId: PlanetId;
  type: AspectType;
  typeLabel: string;
}): string {
  const pairKey = planetPairKey(params.userPlanetId, params.partnerPlanetId);
  const pairTitle = PAIR_ASPECT_TITLES[pairKey]?.[params.type];

  if (pairTitle) {
    return `${pairTitle} (${params.typeLabel})`;
  }

  if (params.userPlanetId === params.partnerPlanetId) {
    const domain = PLANET_DOMAIN[params.userPlanetId];
    const quality = ASPECT_QUALITY[params.type];
    return `${domain} ${quality} (${params.typeLabel})`;
  }

  const domainA = PLANET_DOMAIN[params.userPlanetId];
  const domainB = PLANET_DOMAIN[params.partnerPlanetId];
  const quality = ASPECT_QUALITY[params.type];
  return `${domainA}–${domainB} ${quality} (${params.typeLabel})`;
}

export function buildPlanetPairEffect(params: {
  userPlanetId: PlanetId;
  partnerPlanetId: PlanetId;
  type: AspectType;
  tier: OrbStrengthTier;
}): string {
  const pairKey = planetPairKey(params.userPlanetId, params.partnerPlanetId);
  const pairEffect =
    PAIR_EFFECTS[pairKey]?.[params.type] ??
    SAME_PLANET_EFFECTS[params.userPlanetId]?.[params.type];

  if (pairEffect) {
    return applyTierIntensity(pairEffect, params.tier);
  }

  return fallbackEffect(params.userPlanetId, params.partnerPlanetId, params.type, params.tier);
}

export function buildAspectDetailLine(params: {
  userBody: string;
  partnerBody: string;
  typeLabel: string;
  angle: number;
}): string {
  return `${params.userBody} ↔ ${params.partnerBody} · ${params.typeLabel} ${params.angle}°`;
}

export function buildOrbTechnicalLine(params: {
  orb: number;
  orbStrengthLabel: string;
}): string {
  const exactSuffix =
    params.orb < EXACT_ASPECT_ORB_THRESHOLD ? " · Tam Açı (Exact Aspect)" : "";

  return `Orb ${params.orb.toFixed(2)}° · ${params.orbStrengthLabel}${exactSuffix}`;
}

export function isExactAspect(orb: number): boolean {
  return orb < EXACT_ASPECT_ORB_THRESHOLD;
}

export interface SynastryMatchPresentation {
  aspectTitle: string;
  planetEffect: string;
  aspectDetail: string;
  orbTechnical: string;
  isExactAspect: boolean;
  astroNote: string;
}

export function buildSynastryMatchPresentation(params: {
  userPlanetId: PlanetId;
  partnerPlanetId: PlanetId;
  userBody: string;
  partnerBody: string;
  type: AspectType;
  typeLabel: string;
  angle: number;
  orb: number;
  orbStrengthLabel: string;
  tier: OrbStrengthTier;
}): SynastryMatchPresentation {
  const aspectTitle = buildAspectDrivenTitle({
    userPlanetId: params.userPlanetId,
    partnerPlanetId: params.partnerPlanetId,
    type: params.type,
    typeLabel: params.typeLabel,
  });

  const planetEffect = buildPlanetPairEffect({
    userPlanetId: params.userPlanetId,
    partnerPlanetId: params.partnerPlanetId,
    type: params.type,
    tier: params.tier,
  });

  const aspectDetail = buildAspectDetailLine({
    userBody: params.userBody,
    partnerBody: params.partnerBody,
    typeLabel: params.typeLabel,
    angle: params.angle,
  });

  const orbTechnical = buildOrbTechnicalLine({
    orb: params.orb,
    orbStrengthLabel: params.orbStrengthLabel,
  });

  const exact = isExactAspect(params.orb);

  return {
    aspectTitle,
    planetEffect,
    aspectDetail,
    orbTechnical,
    isExactAspect: exact,
    astroNote: planetEffect,
  };
}

function applyTierIntensity(base: string, tier: OrbStrengthTier): string {
  if (tier === "weak") {
    return `${base} — etki hafif`;
  }

  if (tier === "supportive") {
    return `${base} — orta güçte`;
  }

  return base;
}

function fallbackEffect(
  userPlanetId: PlanetId,
  partnerPlanetId: PlanetId,
  type: AspectType,
  tier: OrbStrengthTier
): string {
  const domain =
    userPlanetId === partnerPlanetId
      ? PLANET_DOMAIN[userPlanetId]
      : `${PLANET_DOMAIN[userPlanetId]}–${PLANET_DOMAIN[partnerPlanetId]}`;

  const tone: Record<AspectType, string> = {
    conjunction: "temalar birleşiyor",
    trine: "doğal akış destekleniyor",
    square: "sürtünme ve büyüme alanı",
    opposition: "denge arayışı belirgin",
  };

  return applyTierIntensity(`${domain} ${tone[type]}`, tier);
}

/** Açı odaklı başlık override — belirgin çiftler için */
const PAIR_ASPECT_TITLES: Partial<
  Record<string, Partial<Record<AspectType, string>>>
> = {
  "jupiter|venus": {
    conjunction: "Sosyal ve Maddi Refah",
    trine: "Keyifli Bağ",
    square: "Keyif–Disiplin Gerilimi",
    opposition: "Değerlerde Çekişme",
  },
  "jupiter|mars": {
    conjunction: "Harekete Geçirici Enerji",
    trine: "Cesaret ve Genişleme",
    square: "Rekabetçi Güdü",
    opposition: "İtaat–Özgürlük Polaritesi",
  },
  "mars|venus": {
    conjunction: "Tutku Birleşimi",
    trine: "Romantik Akış",
    square: "Arzu–Gerilim",
    opposition: "Çekim Polaritesi",
  },
  "moon|venus": {
    trine: "Duygusal Yakınlık",
    conjunction: "Şefkat Bütünleşmesi",
    square: "Duygu–Değer Uyumsuzluğu",
    opposition: "İhtiyaç Karşıtlığı",
  },
  "mercury|venus": {
    trine: "Uyumlu İletişim Dili",
    conjunction: "Zihin–Kalp Uyumu",
    square: "Söz–Duygu Çatışması",
    opposition: "İfade Polaritesi",
  },
  "saturn|venus": {
    trine: "Kalıcı Bağ Potansiyeli",
    conjunction: "Ciddi Bağlılık",
    square: "Mesafe ve Sınır Gerilimi",
    opposition: "Sorumluluk Karşıtlığı",
  },
};

/** Gezegen çifti etkisi — astrolojik karakter vurgusu */
const PAIR_EFFECTS: Partial<
  Record<string, Partial<Record<AspectType, string>>>
> = {
  "jupiter|venus": {
    conjunction: "Sosyal ve maddi refah birlikte güçlenir",
    trine: "Keyifli bağ; birlikte büyüme ve paylaşım kolay",
    square: "Aşırı harcama veya beklenti gerilimi",
    opposition: "Değer ve konfor arasında denge arayışı",
  },
  "jupiter|mars": {
    conjunction: "Harekete geçirici enerji; hedefler büyür",
    trine: "Cesaret ve genişleme birbirini destekler",
    square: "Rekabetçi güdü; sabır gerektiren sürtünme",
    opposition: "Risk alma ile temkin arasında gerilim",
  },
  "mars|venus": {
    conjunction: "Fiziksel ve duygusal çekim yoğun",
    trine: "Romantik ve cinsel akış doğal",
    square: "Arzu ile öfke karışabilir",
    opposition: "Yakınlık–mesafe salınımı",
  },
  "moon|mercury": {
    trine: "Duygular sözcüklerle kolay aktarılır",
    conjunction: "Duygu–düşünce tek kanalda birleşir",
    square: "Duygusal tepki ile mantık çatışır",
    opposition: "Kalp–akıl diyalog gerilimi",
  },
  "sun|moon": {
    trine: "Kimlik ve duygusal ihtiyaç uyumlu",
    conjunction: "Benlik ve ruh hali aynı yönde",
    square: "Ego ile duygusal güvenlik sürtünmesi",
    opposition: "İç dünya–dış ifade dengesi",
  },
  "saturn|sun": {
    square: "Otorite ve sorumluluk baskısı",
    trine: "Disiplin ve olgunluk desteklenir",
    conjunction: "Ciddi bağ ve yapı ihtiyacı",
    opposition: "Özgürlük–sınır polaritesi",
  },
};

/** Aynı gezegen cross-aspect — domain + açı karakteri */
const SAME_PLANET_EFFECTS: Partial<
  Record<PlanetId, Partial<Record<AspectType, string>>>
> = {
  mercury: {
    conjunction: "Zihin hızları aynı frekansta; ortak dil",
    trine: "Zihin hızları uyumlu; iletişim dili doğal akar",
    square: "Anlama biçimlerinde sürtünme; tartışma potansiyeli",
    opposition: "Fikir alışverişinde polarite; farklı bakış açıları",
  },
  venus: {
    conjunction: "Sevgi dili ve estetik zevkler birleşir",
    trine: "Duygusal uyum ve karşılıklı çekim akıcı",
    square: "Değer ve yakınlık beklentilerinde gerilim",
    opposition: "Sevgi ifadesinde karşıt tarzlar",
  },
  mars: {
    conjunction: "Eylem ve motivasyon aynı hedefe kilitlenir",
    trine: "Enerji ve tempo uyumlu; birlikte hareket kolay",
    square: "Rekabet ve öfke tetiklenebilir",
    opposition: "Güdü yönleri zıt; çekim–itme dinamiği",
  },
  moon: {
    conjunction: "Duygusal ihtiyaçlar aynı frekansta",
    trine: "Güven ve empati doğal akar",
    square: "Duygusal tetikleyiciler çatışabilir",
    opposition: "Ruh hali salınımları belirgin",
  },
  sun: {
    conjunction: "Kimlik ve ego alanları birleşir",
    trine: "Özgüven ve yön birbirini destekler",
    square: "Ego sürtünmesi; liderlik çekişmesi",
    opposition: "Benlik alanları karşıt; denge gerekir",
  },
  jupiter: {
    conjunction: "Büyüme ve inanç alanları genişler",
    trine: "Ortak vizyon ve iyimserlik desteklenir",
    square: "Aşırılık ve beklenti gerilimi",
    opposition: "Felsefe ve genişleme karşıtlığı",
  },
  saturn: {
    conjunction: "Sorumluluk ve sınır temaları birleşir",
    trine: "Yapı ve güven birbirini destekler",
    square: "Mesafe ve kısıtlama gerilimi",
    opposition: "Bağlılık–özgürlük dengesi",
  },
};

export function buildSynastryInsightLine(params: {
  aspectTitle: string;
  aspectDetail: string;
  orbTechnical: string;
  planetEffect: string;
}): string {
  return `${params.aspectTitle} — ${params.planetEffect} · ${params.aspectDetail} · ${params.orbTechnical}`;
}
