/**
 * Oracle narration katmanı — tüm KIE/system prompt'larına eklenen JSON guardrail.
 * Deterministik hesap motoru (Emph / cosmic-context) tek gerçeklik kaynağıdır.
 */
export const ORACLE_JSON_GUARDRAIL = `ZORUNLU GUARDRAIL — ASLA İHLAL ETME:
- Görevin yalnızca sana verilen JSON verisini hikayeleştirmektir.
- JSON dışında gezegen, ev, aspect, skor veya transit uydurma.
- Teknik veriyi değiştirecek yorumlardan kaçın; orb, burç, ev numarası tahmin etme.
- Verilen harita/transit paketi ile çelişen bir cümle yazacaksan o cümleyi yazma; sessiz kal veya yalnızca JSON ile uyumlu ifade kullan.
- Eğitim verinden veya genel astroloji bilgisinden ek "sallama" ekleme.`;

export function withOracleGuardrail(systemPrompt: string): string {
  return `${ORACLE_JSON_GUARDRAIL}\n\n${systemPrompt}`;
}
