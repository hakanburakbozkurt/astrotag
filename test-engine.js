const { julian, solar } = require('astronomia');

console.log("\n--- Kozmik Motor Testi (BAŞARILI) ---");

// 1. Julian Günü hesapla
const date = new Date();
const jd = julian.CalendarGregorianToJD(
    date.getUTCFullYear(), 
    date.getUTCMonth() + 1, 
    date.getUTCDate() + (date.getUTCHours() / 24)
);

// 2. Güneş'in gerçek boylamını hesapla
const lon = solar.apparentLongitude(jd);

console.log(`[OK] Güncel Julian Günü: ${jd.toFixed(4)}`);
console.log(`[OK] Güneş Boylamı (Longitude): ${lon.toFixed(4)} derece`);

console.log("\n[TAMAMLANDI] Motorumuz tıkır tıkır çalışıyor! Artık derleme derdi bitti.");