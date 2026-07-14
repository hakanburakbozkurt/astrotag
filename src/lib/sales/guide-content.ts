export interface GuideSection {
  id: string;
  title: string;
  kicker?: string;
  paragraphs: string[];
  highlights?: string[];
}

export const PRODUCT_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "nfc-cosmic-assistant",
    kicker: "Başlangıç",
    title: "AstroTag ve Uygulama Nasıl Birleşiyor?",
    paragraphs: [
      "AstroTag anahtarlığının içinde, telefonunuzla konuşan küçük bir NFC çipi bulunur. Bu çip bir uygulama mağazası değildir; sizin size özel dijital kapınızdır. Anahtarlığı telefonunuzun arkasına yaklaştırdığınızda, çip benzersiz kimliğinizi okur ve tarayıcınızda kişisel kozmik profilinizi açar.",
      "Burada gördüğünüz deneyim, soğuk bir yazılım ekranı değil; sizin için çalışan bir kozmik asistandır. Doğum bilgilerinize göre hazırlanmış yorumlar, günlük rehberlik ve paylaşılabilir içgörüler — hepsi tek bir dokunuşla elinizin altındadır. Kurulum, şifre ezberleme veya güncelleme derdi yok: telefonunuzun tarayıcısı yeterlidir.",
      "Anahtarlık fiziksel hatıranızdır; dijital profil ise yaşayan yolculuğunuzdur. İkisi bir araya geldiğinde AstroTag, teknolojiyi arka plana alıp size sadece anlamlı bir deneyim sunar.",
    ],
    highlights: [
      "Uygulama mağazasından indirme gerekmez — tarayıcıdan açılır, ana ekranınıza eklenebilir.",
      "Her anahtarlık burcunuza göre kişiselleştirilir; profiliniz size özeldir.",
    ],
  },
  {
    id: "precision-engine",
    kicker: "Güvenilirlik",
    title: "Sistemimiz Neden Bu Kadar Kesin?",
    paragraphs: [
      "AstroTag’in arkasında, gökyüzünün anlık konumlarını astronomik verilerle hesaplayan güçlü bir motor çalışır. Gezegen dereceleri, burç geçişleri ve doğum haritanızdaki açılar — hepsi Swiss Ephemeris tabanlı astronomi motoru ve Nexus hesaplama katmanıyla üretilir. Bu, tahmine dayalı değil; ölçülebilir gökyüzü verisine dayalı bir temeldir.",
      "Siz ekranda bunu asla formül veya teknik tablo olarak görmezsiniz. Sistem, ham veriyi sizin için sadeleştirir ve anlaşılır bir yoruma dönüştürür. Günlük Nexus rehberiniz, uyum analizleriniz ve Oracle okumalarınız — hepsi aynı hesaplama motorundan beslenir; siz yalnızca net, okunabilir ve kişisel sonucu görürsünüz.",
      "Kısacası: arka planda bilimsel titizlik, ön planda sıcak ve anlaşılır bir rehberlik. AstroTag sizi veriyle boğmaz; size anlam sunar.",
    ],
    highlights: [
      "Hesaplamalar astronomik ephemeris verisine dayanır — rastgele metin üretilmez.",
      "Gördüğünüz her yorum, hesaplanmış gökyüzü verisinin sadeleştirilmiş halidir.",
    ],
  },
  {
    id: "star-economy",
    kicker: "Şeffaflık",
    title: "Yıldız Ekonomisi",
    paragraphs: [
      "AstroTag’de yıldızlar, kozmik enerji biriminizdir. Nexus günlük rehberiniz, Oracle sorularınız ve derin analizleriniz bu enerjiyle çalışır — tıpkı bir yolculukta yakıt gibi. Her okuma, sistemde gerçek hesaplama ve yorum üretimi tetiklediği için küçük bir yıldız maliyeti vardır; bu sayede deneyim sürdürülebilir ve adil kalır.",
      "Yıldızlarınız zamanla yenilenir: belirli aralıklarla kozmik stokunuz otomatik olarak dolar. Ayrıca anahtarlık paketlerinizle gelen hediye yıldızlar veya satın aldığınız yıldız paketleri, stoğunuzu anında yükseltir. Böylece hem günlük kullanım hem de yoğun keşif dönemleri için esneklik sağlanır.",
      "Paketler yalnızca bir fiyat etiketi değildir; platformun size kesintisiz, kaliteli bir kozmik asistan sunabilmesi için tasarlanmış şeffaf bir ekonomidir. Ne harcadığınızı, ne kazandığınızı ve ne zaman yenileneceğinizi her zaman takip edebilirsiniz.",
    ],
    highlights: [
      "Yıldızlar Oracle ve Nexus okumaları için yakıttır — her işlem görünür ve ölçülebilirdir.",
      "Paketler dijital stokunuzu yükseltir; fiziksel anahtarlık paketleri hediye yıldız bonusu içerir.",
    ],
  },
  {
    id: "security-privacy",
    kicker: "Gizlilik",
    title: "Güvenliğiniz Önceliğimiz",
    paragraphs: [
      "Kişisel doğum bilgileriniz, profil tercihleriniz ve kozmik notlarınız yalnızca size aittir. Verileriniz, hesabınıza özel güvenlik kurallarıyla korunan sunucu altyapısında saklanır; başka kullanıcıların profiline erişemez, veriniz izinsiz paylaşılmaz.",
      "Hassas günlük ve kozmik notlarınız şifreli olarak işlenir. Oturum tercihleri ve yerel hatırlatmalar cihazınızda tutulur; böylece deneyiminiz hızlı kalırken kontrol sizde olur. NFC anahtarlığınız ise isteğe bağlı PIN korumasıyla ek bir güvenlik katmanı sunar.",
      "AstroTag, verinizi satmaz veya reklam profili oluşturmaz. Amacımız yalnızca size güvenilir, kişisel ve huzur veren bir kozmik deneyim sunmaktır.",
    ],
    highlights: [
      "Profil verileriniz hesap bazlı izole edilir — yalnızca siz erişirsiniz.",
      "Kozmik notlar şifreli saklanır; NFC profiliniz isteğe bağlı PIN ile korunabilir.",
    ],
  },
  {
    id: "no-app-download",
    kicker: "Pratik",
    title: "Uygulama İndirmem Gerekir mi?",
    paragraphs: [
      "Hayır. AstroTag, telefonunuzun tarayıcısında çalışan modern bir web deneyimidir. Anahtarlığınıza dokunduğunuzda sayfa anında açılır; isterseniz tek dokunuşla ana ekranınıza ekleyerek her zamanki uygulamalarınız gibi kullanabilirsiniz.",
      "Güncellemeler otomatik gelir; mağazadan yeniden indirme, sürüm uyumsuzluğu veya depolama sorunu yaşamazsınız.",
    ],
  },
  {
    id: "personalization",
    kicker: "Kişiselleştirme",
    title: "Anahtarlığım Nasıl Kişiselleştirilir?",
    paragraphs: [
      "Sipariş sırasında her anahtarlık için burç tercihinizi belirlersiniz. Paketiniz birden fazla anahtarlık içeriyorsa, her biri farklı bir burç için ayrı ayrı hazırlanabilir — sevdiklerinize özel hediye senaryoları için idealdir.",
      "Dijital profiliniz ise doğum tarihi, saati ve konumunuzla zenginleşir; ne kadar çok bilgi eklerseniz, kozmik asistanınız o kadar kişisel yorumlar sunar.",
    ],
  },
];
