/** Teknik astroloji uyarı metinlerini son kullanıcı diline çevirir — UI katmanı */

export interface CautionListItem {
  raw: string;
  technical: string;
}

export interface ParsedCautionBody {
  intro: string;
  items: CautionListItem[];
}

const PLANET_AREAS: Record<string, string> = {
  güneş: "kimliğin, özgüvenin ve görünürlüğün",
  ay: "duygularının, güven ihtiyacının ve günlük alışkanlıklarının",
  merkür: "iletişimin, kararların ve günlük planların",
  venüs: "ilişkilerin, keyfin ve harcama alışkanlıklarının",
  mars: "enerjin, sabır sınırın ve harekete geçme biçimin",
  jüpiter: "büyüme arzun, iyimserliğin ve risk alma eğilimin",
  satürn: "sorumlulukların, sınırların ve uzun vadeli planların",
  uranüs: "değişim ihtiyacın ve beklenmedik uyarıların",
  neptün: "hayal gücün, sezgilerin ve belirsizlik alanın",
  plüton: "derin dönüşüm alanın ve kontrol ihtiyacının",
  yükselen: "dış dünyaya yansıyan tarzın ve ilk izlenimin",
  kiron: "iyileşme ve hassasiyet alanın",
};

const ASPECT_DAILY: Record<string, string> = {
  kare: "Bu açı, iki alanın aynı anda baskı yapmasına neden olabilir; acele karar yerine tempo düşürmek faydalı olur.",
  karşıt: "Bu açı, bir yandan istek bir yandan gerçeklik arasında denge kurmanı isteyebilir; orta yol aramak işe yarar.",
  kavuşum: "Bu açı, ilgili alandaki temayı yoğunlaştırır; bilinçli seçimlerle yönlendirmek önemlidir.",
  üçgen: "Bu açı, akışı kolaylaştırabilir; fırsatları değerlendirmek için uygun bir pencere olabilir.",
  sekstil: "Bu açı, küçük düzenlemelerle ilerlemeyi destekleyebilir; hafif adımlar verimli olur.",
};

const COMBO_HINTS: Record<string, string> = {
  "jüpiter|jüpiter|kare":
    "Kendi bildiğini okuma ve fazla iyimserlik eğilimi artabilir; eldekini koruyup gereksiz risklerden kaçınmak dengeli olur.",
  "mars|mars|kare":
    "Sabırsızlık ve tepkisel davranış ihtimali yükselir; tartışma ve ani hamlelerden önce nefes almak iyi gelir.",
  "satürn|satürn|kare":
    "Sorumluluk baskısı ve erteleme-hüsran döngüsü belirginleşebilir; küçük adımlarla ilerlemek yükü hafifletir.",
  "merkür|merkür|kare":
    "Zihin dağılabilir veya iletişimde yanlış anlaşılmalar artabilir; yazılı teyit ve net ifade kullanmak işe yarar.",
  "venüs|venüs|kare":
    "Keyif ve harcama dengesinde aşırılık riski olabilir; ne istediğini netleştirmeden taahhüt vermemek faydalıdır.",
};

function normalizePlanet(name: string): string {
  return name.trim().toLocaleLowerCase("tr-TR");
}

function normalizeAspect(type: string): string {
  return type.trim().toLocaleLowerCase("tr-TR");
}

function comboKey(transit: string, natal: string, aspect: string): string {
  return `${normalizePlanet(transit)}|${normalizePlanet(natal)}|${normalizeAspect(aspect)}`;
}

function planetArea(name: string): string {
  return PLANET_AREAS[normalizePlanet(name)] ?? `${name} alanın`;
}

function aspectAdvice(aspect: string): string {
  return ASPECT_DAILY[normalizeAspect(aspect)] ?? ASPECT_DAILY.kare!;
}

const TRANSIT_REGEX =
  /^Transit\s+(.+?)\s+(kare|karşıt|kavuşum|üçgen|sekstil)\s+natal\s+(.+?)\s*\(orb\s+([\d.]+)°\)/i;

const NATAL_REGEX =
  /^(.+?)\s*[—–-]\s*(.+?):\s*(Kavuşum|Karşıt|Kare|Üçgen|Sekstil|Quincunx)\s*\(orb\s+([\d.]+)°\)/i;

export function parseCautionBody(body: string): ParsedCautionBody {
  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  const bulletLines = lines.filter((line) => line.startsWith("•"));
  const introLines = lines.filter((line) => !line.startsWith("•"));

  const items = bulletLines.map((line) => {
    const raw = line.replace(/^•\s*/, "");
    const technical = raw.split("—")[0]?.trim() ?? raw;
    return { raw, technical };
  });

  return {
    intro: introLines.join("\n\n"),
    items,
  };
}

export function explainTechnicalLine(technical: string): string {
  const transitMatch = technical.match(TRANSIT_REGEX);
  if (transitMatch) {
    const [, transitPlanet, aspectType, natalPlanet, orbStr] = transitMatch;
    return explainTransitAspect(transitPlanet, aspectType, natalPlanet, Number(orbStr));
  }

  const natalMatch = technical.match(NATAL_REGEX);
  if (natalMatch) {
    const [, planetA, planetB, aspectType, orbStr] = natalMatch;
    return explainNatalAspect(planetA, planetB, aspectType, Number(orbStr));
  }

  if (/düşük düzeyde|tetikleyici/i.test(technical)) {
    return "Bu hafta belirgin bir baskı görünmüyor; yine de seni yoran alışkanlıklara ve aşırı yüklenmeye karşı dikkatli olmak iyi olur.";
  }

  return "Bu uyarı, gökyüzü ile doğum haritan arasındaki gerilimi hatırlatır. Tempoyu düşürmek, net konuşmak ve acele kararları ertelemek genelde işe yarar.";
}

export function explainTransitAspect(
  transitPlanet: string,
  aspectType: string,
  natalPlanet: string,
  orb: number
): string {
  const hint = COMBO_HINTS[comboKey(transitPlanet, natalPlanet, aspectType)];
  const transitArea = planetArea(transitPlanet);
  const natalArea = planetArea(natalPlanet);
  const aspectLine = aspectAdvice(aspectType);
  const intensity =
    orb <= 2
      ? "Etki oldukça net hissedilebilir."
      : orb <= 4
        ? "Etki orta düzeyde; farkındalıkla yönetilebilir."
        : "Etki daha yumuşak; yine de arka planda hissedilebilir.";

  if (hint) {
    return `${hint} ${intensity}`;
  }

  return `Şu an gökyüzündeki ${transitPlanet}, ${transitArea} ile ${natalPlanet} (${natalArea}) temas kuruyor. ${aspectLine} ${intensity}`;
}

export function explainNatalAspect(
  planetA: string,
  planetB: string,
  aspectType: string,
  orb: number
): string {
  const aspectLine = aspectAdvice(aspectType);
  const intensity =
    orb <= 2
      ? "Haritanda bu tema güçlü çalışır."
      : "Haritanda bu tema arka planda etkili olabilir.";

  return `Doğum haritanda ${planetA} (${planetArea(planetA)}) ile ${planetB} (${planetArea(planetB)}) arasında ${aspectType.toLowerCase()} açı var. ${aspectLine} ${intensity}`;
}
