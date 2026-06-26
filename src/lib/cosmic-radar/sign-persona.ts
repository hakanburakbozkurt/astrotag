import type { ZodiacSign } from "@/lib/astrology/zodiac-signs";

interface SignPersona {
  deepOverview: string;
  deepStrategy: string;
  cautionFrame: string;
}

export const SIGN_PERSONA: Record<ZodiacSign, SignPersona> = {
  Koç: {
    deepOverview:
      "Transit Mars ve Güneş ekseninin Koç haritası perspektifinde 1. ve 10. ev temalarını hareketlendirebilir. Eylem ve yön belirleme alanlarında ivme artabilir; ancak kardinal ateş enerjisinin baskınlığı, aceleci karar eğilimini de beraberinde getirebilir. Önceliklerin netleştirilmesi bu dönemde destekleyici bir strateji olabilir.",
    deepStrategy:
      "Mars yönetimindeki alanlarda (girişimcilik, rekabet, fiziksel aktivite) ölçülü ilerleme tercih edilebilir. Transit kavuşum ve üçgen açıları varsa fırsat pencereleri açılabilir; kare açılar varsa tempo düşürülmesi ve planın gözden geçirilmesi önerilir.",
    cautionFrame:
      "Mars baskısı sabırsızlık ve çatışma eğilimini artırabilir; tepkisel kararlarda temkinli olunması önerilir.",
  },
  Boğa: {
    deepOverview:
      "Venüs ve Satürn transitleri sabit toprak elementinde maddi güvenlik, kaynak yönetimi ve bedensel ihtiyaçları öne çıkarabilir. 2. ve 8. ev ekseninde değerler, ortak kaynaklar ve sürdürülebilirlik temaları güçlenebilir.",
    deepStrategy:
      "Finansal planlama, rutin sağlık alışkanlıkları ve somut hedef belirleme bu hafta verimli olabilir. Satürn kısıtlaması varsa sabır ve kademeli ilerleme; Venüs desteği varsa ilişkisel ve estetik alanlarda denge kurma fırsatları değerlendirilebilir.",
    cautionFrame:
      "Sabit burç direnci değişime uyumu zorlaştırabilir; esneklik korunması faydalı olabilir.",
  },
  İkizler: {
    deepOverview:
      "Merkür transitleri değişken hava elementinde iletişim, öğrenme ve bilgi akışını hızlandırabilir. 3. ve 9. ev temaları (kısa yolculuklar, eğitim, medya) öne çıkabilir; zihinsel aktivite yoğunlaşabilir.",
    deepStrategy:
      "Merkür retrosu veya kare açı yoksa sözleşme, yazışma ve sunumlar için uygun bir pencere açılabilir. Dağınıklığı önlemek adına tek bir ana konuya odaklanmak verimliliği artırabilir.",
    cautionFrame:
      "Aşırı uyarılma ve yüzeysellik riski artabilir; derinlemesine odaklanma tercih edilebilir.",
  },
  Yengeç: {
    deepOverview:
      "Ay transitleri su elementinde duygusal güvenlik, aile ve iç mekân temalarını güçlendirebilir. 4. ev ve Ay yönetimindeki alanlarda hassasiyet artabilir; duygusal reaktivite gün içinde dalgalanabilir.",
    deepStrategy:
      "İç dünya ile dış sorumluluklar arasında denge kurmak önemli olabilir. Ay fazlarına göre dinlenme ve iletişim ritmi ayarlanabilir; sınır koruma ile yakınlık birlikte yürütülebilir.",
    cautionFrame:
      "Geçmişe bağlı duygusal tepkiler karar kalitesini düşürebilir; güncel ihtiyaçların ayrıştırılması önerilir.",
  },
  Aslan: {
    deepOverview:
      "Güneş'in konumu sabit ateş elementinde görünürlük, yaratıcılık ve liderlik alanlarını destekleyici kılabilir. 5. ve 10. ev temalarında ifade, performans ve statü konuları gündeme gelebilir.",
    deepStrategy:
      "Özgüvenin yapıcı biçimde ifade edilmesi fırsatları artırabilir. Güneş transitlerinin natal haritayla kavuşum veya üçgen yapması durumunda kişisel projelerde ivme beklenabilir; kare açılarda ego savunmasına dikkat edilebilir.",
    cautionFrame:
      "Onay arayışı ve ego savunması ilişkilerde gerilim yaratabilir; iç motivasyona dönülmesi önerilir.",
  },
  Başak: {
    deepOverview:
      "Merkür-Satürn etkileşimi değişken toprak elementinde düzen, sağlık ve iş süreçlerinde verimliliği artırabilir. 6. ev temaları (rutin, hizmet, sağlık) ve detay odaklı analiz alanları öne çıkabilir.",
    deepStrategy:
      "Sistematik planlama ve süreç iyileştirme bu hafta somut sonuç üretebilir. Mükemmeliyetçilik yerine yeterince iyi standart tercih edilerek ilerleme sürdürülebilir.",
    cautionFrame:
      "Aşırı eleştirellik ilerlemeyi yavaşlatabilir; yapıcı geri bildirim ile ayrıştırma faydalı olabilir.",
  },
  Terazi: {
    deepOverview:
      "Venüs transitleri değişken hava elementinde ilişkiler, adalet ve estetik dengeyi vurgulayabilir. 7. ev ekseninde ortaklık, sözleşme ve karşılıklı beklentiler gündeme gelebilir.",
    deepStrategy:
      "Diplomatik iletişim ve uzlaşma becerileri bu dönemde değer kazanabilir. Venüs kare veya karşıt açıları varsa ilişkisel gerilimler yönetilmeli; destekleyici açılarda iş birliği güçlendirilebilir.",
    cautionFrame:
      "Uzlaşma eğilimi kişisel sınırları zayıflatabilir; net tercihler belirlenmesi önerilir.",
  },
  Akrep: {
    deepOverview:
      "Plüton ve Mars temaları sabit su elementinde dönüşüm, güven ve paylaşım alanlarını derinleştirebilir. 8. ev ekseninde ortak kaynaklar, psikolojik derinlik ve bırakma süreçleri öne çıkabilir.",
    deepStrategy:
      "Yüzeyin altındaki dinamiklerin fark edilmesi stratejik avantaj sağlayabilir. Mars-Pluto açıları yoğunlaşma getirebilir; kontrol ihtiyacını gevşetmek dengeyi koruyabilir.",
    cautionFrame:
      "Kontrol ihtiyacı ve yoğun duygusal tepkiler ilişkilerde baskı oluşturabilir; mesafe almak faydalı olabilir.",
  },
  Yay: {
    deepOverview:
      "Jüpiter hattı değişken ateş elementinde keşif, öğrenme ve genişleme alanlarını destekleyici kılabilir. 9. ve 12. ev temalarında inanç, eğitim ve ufuk genişlemesi gündeme gelebilir.",
    deepStrategy:
      "Uzun vadeli vizyonun kısa vadeli adımlarla hizalanması önemli olabilir. Jüpiter transitlerinin destekleyici açıları eğitim ve seyahat planları için olumlu pencere açabilir.",
    cautionFrame:
      "Aşırı iyimserlik ve abartılı beklentiler planlamayı zayıflatabilir; ölçülü hedefler önerilir.",
  },
  Oğlak: {
    deepOverview:
      "Satürn transitleri sabit toprak elementinde disiplin, kariyer ve sorumluluk temalarını güçlendirebilir. 10. ve 4. ev ekseninde profesyonel yapı ile kişisel temel arasında denge aranabilir.",
    deepStrategy:
      "Yapılandırılmış çalışma ve sürdürülebilir tempo bu hafta verimli olabilir. Satürn kısıtlamaları sabır gerektirebilir; uzun vadeli hedeflere odaklanmak olgunlaşmayı destekleyebilir.",
    cautionFrame:
      "Aşırı kontrol ve duygusal mesafe yük paylaşımını zorlaştırabilir; duygular plana dahil edilebilir.",
  },
  Kova: {
    deepOverview:
      "Uranüs temaları sabit hava elementinde topluluk, vizyon ve özgürlük alanlarında yenilik getirebilir. 11. ev temalarında ağ, proje ve kolektif hedefler öne çıkabilir.",
    deepStrategy:
      "Kalıplar güncellenirken bağlantıların korunması dengeyi destekleyebilir. Uranüs sert açıları ani değişim getirebilir; esneklik ve yedek plan hazırlığı önerilir.",
    cautionFrame:
      "Mesafeli duruş yakın ilişkilerde soğuma yaratabilir; yakınlık da plana dahil edilebilir.",
  },
  Balık: {
    deepOverview:
      "Neptün ve Ay etkileşimi değişken su elementinde sezgi, empati ve ruhsal ihtiyaçları öne çıkarabilir. 12. ev temalarında dinlenme, hayal gücü ve bilinçaltı süreçler güçlenebilir.",
    deepStrategy:
      "Sınırların netleştirilmesi duygusal tükenmeyi önleyebilir. Neptün sis etkisi belirsizlik yaratabilir; somut verilerle sezgisel içgörü dengelenebilir.",
    cautionFrame:
      "Kaçış eğilimi ve aşırı fedakârlık kişisel kaynakları zayıflatabilir; net sınır konulması önerilir.",
  },
};

export function buildCautionIntro(sign: ZodiacSign): string {
  return SIGN_PERSONA[sign].cautionFrame;
}

export function getDeepOverview(sign: ZodiacSign): string {
  return SIGN_PERSONA[sign].deepOverview;
}

export function getDeepStrategy(sign: ZodiacSign): string {
  return SIGN_PERSONA[sign].deepStrategy;
}
