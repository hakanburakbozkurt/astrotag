/** Tarot kartı — dış/iç çizgi + köşe köşebentleri (dekoratif) */
export default function TarotMysticFrame() {
 return (
 <div className="universe-tarot-mystic-frame" aria-hidden>
 <span className="universe-tarot-mystic-frame__inset" />
 <span className="universe-tarot-mystic-corner universe-tarot-mystic-corner--tl" />
 <span className="universe-tarot-mystic-corner universe-tarot-mystic-corner--tr" />
 <span className="universe-tarot-mystic-corner universe-tarot-mystic-corner--bl" />
 <span className="universe-tarot-mystic-corner universe-tarot-mystic-corner--br" />
 <span className="universe-tarot-mystic-tick universe-tarot-mystic-tick--top" />
 <span className="universe-tarot-mystic-tick universe-tarot-mystic-tick--bottom" />
 </div>
 );
}
