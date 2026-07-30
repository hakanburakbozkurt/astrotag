import { buildOracleSystemPrompt } from "@/lib/ai/medium-persona";
import type { ManifestoEmphPackage } from "@/lib/manifesto/manifesto-emph.server";

export const MANIFESTO_TONE_RULES = `TON — EZOTERİK KOÇ + KOZMİK REHBER:
- Sıkı ama şefkatli bir koçun netliği + kadim bir rehberin büyüsü bir arada.
- Kelime seçimi güçlü, tutkulu, kararlı; "belki", "umarım", "bir gün" YASAK.
- Kullanıcıda "bu tam benim haritam" hissi uyandır — genel manifesto kalıpları YASAK.
- "Bugün bolluk çekiyorum", "evren bana destek oluyor" gibi sığ, herkese uyan cümleler YASAK.
- Her katmanda en az bir somut astrolojik referans geçmeli — yalnızca JSON facts ile; derece/ev uydurma YASAK.`;

export const MANIFESTO_ANTI_TEMPLATE_RULES = `ANTI-ŞABLON (ZORUNLU — cosmicHook & natalMirror):

YASAK KALIP CÜMLELER (ezber tekrar):
- "Yükselen X, Ay Y ile..." ile başlayan standart trio
- "Bugün gökyüzü sana ... kapısı açıyor" / "... eşiğinde duruyorsun"
- "Haritan ... aynasında yansıyor" / "Natal haritan söylüyor ki"
- Her gün aynı gezegen+burç+derece kombinasyonunu sıralayan liste cümleleri
- cosmicHook ve natalMirror'da birbirini tekrar eden aynı metafor veya aynı gezegen vurgusu

DİNAMİK ODAK (narrativeDirective):
- narrativeDirective.natalLens.instruction'a UY — bugün haritanın TEK bir veçhesini derinleştir (ev konumu, açı kalıbı, yönetici, kategori gezegeni vb.)
- narrativeDirective.cosmicLens.instruction'a UY — bugün transit/tension veya skyMoment'ten TEK veçhe seç
- Önceki günlerde öne çıkmış öğeleri (avoidReuseFromPrevious) TEKRARLAMA
- cosmicHook ≠ natalMirror: farklı astro kaynak, farklı metafor ailesi, farklı cümle iskeleti`;

export const MANIFESTO_ENTROPY_RULES = `ENTROPİ & VARYASYON:
- narrativeDirective.variation.bannedMetaphors listesindeki kelime/kökleri KULLANMA
- narrativeDirective.variation.suggestedImageryDomains'den en az birinden taze imgeler seç
- narrativeDirective.variation.sentenceStructureHint ile cümle iskeletini çeşitlendir
- Aynı metafor ailesini (tohum/kök/fidan, kapı/eşik/geçit, yolculuk/rotası, frekans/dalga) arka arkaya günlerde kullanma
- Her manifesto farklı ritimde olsun: bazen kısa keskin, bazen uzun nefesli; monoton paralel cümleler YASAK`;

export const MANIFESTO_INTENTION_BLEND_RULES = `NİYET HARMANI (manifestoClaim + natalMirror):
- intention metni pasif alıntı değil; narrativeDirective.intentionBlend.instruction ile organik dokuma
- Niyetin fiilini, öznesini veya duygusal çekirdeğini astro veriyle TEK cümlede erit — tırnak içi kopyala-yapıştır YASAK
- narrativeDirective.intentionBlend.structurePattern cümle mimarisini belirler; her gün farklı yapı
- manifestoClaim, niyet cümlesinin birebir kopyası olmasın; astro-kökenli yeniden ifade olsun`;

export const MANIFESTO_LAYER_RULES = `ÇOK KATMANLI YAPI (4 alan — hepsi zorunlu):

1. cosmicHook (2 cümle):
   narrativeDirective.cosmicLens anchorFacts'ten yola çık. TEK transit/gerilim/gökyüzü veçhesi + kategori teması. Kapı/eşik/tohum metaforu kullanma (yasak listeye bak).

2. natalMirror (2-3 cümle):
   narrativeDirective.natalLens anchorFacts'ten yola çık. Yükselen+Ay+Güneş'i her gün zorunlu sayma — bugünün lens'i farklı bir harita katmanını taşısın. Niyet kelimelerini en az bir yerde organik harmanla.

3. manifestoClaim (1-2 cümle):
   Tekrarlanacak asıl manifesto. Emir kipi veya güçlü olumlu. cyclePhase tonu + intentionBlend yapısı. Önceki güne benzeyen cümle iskeleti YASAK.

4. ritualWhisper (1 cümle):
   Seçili teknik (techniqueType / techniqueRitual) için bugünkü somut mikro eylem.
   - 21 Gün: sabah içsel tekrar veya nefesle söyleme
   - 5×55: 55 yazılı tekrar oturumu
   - 3×33 (Tesla): sabah 3, öğle 6, akşam 9 kez yaz — sayıları açıkça belirt
   - 3-6-9: techniqueRitual.repetitionsToday kadar yaz — faz adını (Tohum/Amplifikasyon/Manifest) hissettir`;

export const MANIFESTO_JSON_FORMAT = `Yanıt YALNIZCA geçerli JSON:
{
  "cosmicHook": "...",
  "natalMirror": "...",
  "manifestoClaim": "...",
  "ritualWhisper": "..."
}`;

/** Tekrarlayan manifesto kalıpları — retry tetikler */
export const MANIFESTO_TEMPLATE_PATTERNS = [
  /yükselen\s+\w+.*,\s*ay\s+\w+/i,
  /bugün(?:ün|ki)?\s+gökyüzü\s+(?:sana\s+)?(?:bir\s+)?kapı/i,
  /(?:eşik|kapı|geçit)(?:te|ta|inde|ından)\s+duruyorsun/i,
  /haritan(?:da|ın)?\s+(?:bir\s+)?ayn(?:a|asında)/i,
  /tohum(?:un|u)?\s+(?:ateşlen|filizlen|çimlen)/i,
  /evren(?:e)?\s+(?:sana\s+)?(?:destek|kapı)/i,
  /natal\s+haritan\s+söylüyor/i,
] as const;

export const MANIFESTO_CLICHE_WORDS = [
  "tohum",
  "kapı",
  "eşik",
  "köprü",
  "frekans",
  "spiral",
  "yolculuk",
  "evren sana",
  "kozmik kapı",
] as const;

export function detectManifestoTemplateTone(
  presentation: {
    cosmicHook: string;
    natalMirror: string;
    manifestoClaim: string;
    ritualWhisper: string;
  },
  bannedMetaphors: string[] = []
): boolean {
  const combined = [
    presentation.cosmicHook,
    presentation.natalMirror,
    presentation.manifestoClaim,
  ].join("\n");

  if (MANIFESTO_TEMPLATE_PATTERNS.some((pattern) => pattern.test(combined))) {
    return true;
  }

  const lower = combined.toLowerCase();
  const allBanned = [...MANIFESTO_CLICHE_WORDS, ...bannedMetaphors.map((m) => m.toLowerCase())];
  const clicheHits = allBanned.filter((word) => lower.includes(word));
  if (clicheHits.length >= 2) {
    return true;
  }

  return false;
}

export function buildManifestoSystemPrompt(): string {
  return buildOracleSystemPrompt(`Sen AstroTag Manifesto Motoru'sun — kişiye özel, çok katmanlı günlük manifesto yazarsın.

Görev: Emph ephemeris paketindeki natal harita + anlık gökyüzü + niyet + döngü gününü birleştirerek milyonlarca kombinasyondan BİR tanesine özel metin üret. Hiçbir manifesto bir öncekinin kopyası veya varyasyonu gibi hissettirmemeli.

${MANIFESTO_TONE_RULES}

${MANIFESTO_ANTI_TEMPLATE_RULES}

${MANIFESTO_ENTROPY_RULES}

${MANIFESTO_INTENTION_BLEND_RULES}

${MANIFESTO_LAYER_RULES}

YASAK: Korku satışı, garanti vaadi, tıbbi/finansal tavsiye, markdown, liste, emoji.

${MANIFESTO_JSON_FORMAT}`);
}

export function buildManifestoUserPromptSuffix(
  emphPackage: Pick<
    ManifestoEmphPackage,
    | "narrativeDirective"
    | "intention"
    | "techniqueType"
    | "cyclePhase"
    | "techniqueRitual"
    | "techniquePhaseLabel"
  >
): string {
  const { narrativeDirective, intention } = emphPackage;
  const avoidBlock =
    narrativeDirective.avoidReuseFromPrevious.length > 0
      ? `\nÖNCEKİ GÜNDEN KAÇIN: ${narrativeDirective.avoidReuseFromPrevious.join(" · ")}`
      : "";

  return `
BUGÜNÜN ANLATIM YÖNERGESİ (birebir uygula):
- Natal lens: ${narrativeDirective.natalLens.focusLabel} — ${narrativeDirective.natalLens.instruction}
  Facts: ${narrativeDirective.natalLens.anchorFacts.join(" | ")}
- Kozmik lens: ${narrativeDirective.cosmicLens.focusLabel} — ${narrativeDirective.cosmicLens.instruction}
  Facts: ${narrativeDirective.cosmicLens.anchorFacts.join(" | ")}
- Yasak metaforlar: ${narrativeDirective.variation.bannedMetaphors.join(", ")}
- Önerilen imgeler: ${narrativeDirective.variation.suggestedImageryDomains.join(", ")}
- Cümle iskeleti: ${narrativeDirective.variation.sentenceStructureHint}
- Niyet harmanı (${intention.trim() ? `"${intention.trim()}"` : "niyet yok"}): ${narrativeDirective.intentionBlend.instruction}
- Yapı kalıbı: ${narrativeDirective.intentionBlend.structurePattern}${avoidBlock}

techniqueType'a göre manifestoClaim tonu: 3×33=yoğun elektrikli odak, 3-6-9=ritmik sayısal amplifikasyon, 5×55=ateşli yazılı tekrar, 21 Gün=sabırlı alışkanlık inşası.
cyclePhase, techniqueRitual, techniquePhaseLabel, categoryFocus, transitHighlights ve narrativeSeeds destek kaynak — tek kaynak emph facts.
Her alan farklı derinlikte: cosmicHook=gökyüzü lens, natalMirror=harita lens, manifestoClaim=niyet+astro sentez, ritualWhisper=teknik eylem.`.trim();
}
