export interface GuideSection {
  id: string;
  title: string;
  content: string;
}

export const guideSections: GuideSection[] = [
  {
    id: "astro-tag-nedir",
    title: "AstroTag tam olarak nedir?",
    content:
      "AstroTag, fiziksel dünyadaki bir nesneyi dijital evrenin derinlikleriyle birleştiren bir köprüdür. NFC çip teknolojisine sahip anahtarlığını telefonuna yaklaştırdığında, sadece bir web sayfası açılmaz; senin için özel olarak işlenmiş kozmik kimliğin canlanır. Bu sistem, karmaşık hesaplamaları senin için sadeleştirip günlük yaşamına rehberlik eden bir asistan gibi çalışır.",
  },
  {
    id: "astro-tag-bir-gun",
    title: "AstroTag ile bir günün",
    content:
      "Sabah uyandığında anahtarlığını telefonuna dokundurarak günün enerjisini görmek, bir ritüel haline dönüşür. Uygulama, gökyüzünün anlık konumunu analiz eder ve sana odaklanman gereken anahtar cümleyi fısıldar. Gün boyu aklına takılan her türlü soruyu Oracle modülüne sorabilir, akşam arkadaşınla buluşmadan önce aranızdaki uyumu test edebilirsin. Bu sistem, senin gökyüzüyle kurduğun şahsi bağın bir yansımasıdır.",
  },
  {
    id: "sistem-kesinligi",
    title: "Sistemimiz ne kadar kesin?",
    content:
      "Astrolojinin arkasındaki matematik oldukça derin ve biz bu karmaşıklığı senin yerine yönetiyoruz. Ephemeris ve Nexus motorlarımız, gökyüzündeki hareketleri saniyesi saniyesine takip ederek senin haritanla eşleştiriyor. Sana sunduğumuz her yorum, bu teknik hesaplamaların damıtılmış ve anlaşılır bir hali. Bizim işimiz rakamlarla boğuşmanı önlemek, sana ise sadece gökyüzünün mesajını net bir şekilde ulaştırmak.",
  },
  {
    id: "yildiz-ekonomisi",
    title: "Yıldızların ekonomisi",
    content:
      "Uygulama içindeki yıldızlar, senin kozmik enerjini temsil eden birimlerdir. Oracle'a sorduğun her soru veya yaptığın her özel analiz, bu enerjinin bir kısmını kullanır. Bu sistem, uygulamanın sürdürülebilirliğini sağlamak ve sadece gerçekten ihtiyaç duyduğun anlarda rehberlik almanı teşvik etmek için tasarlandı. Yıldızların tükendiğinde, küçük paketlerle enerji tazeleyebilir ve gökyüzüyle olan randevuna kaldığın yerden devam edebilirsin.",
  },
  {
    id: "uzman-platformu",
    title: "Kozmik Randevu: Uzmanlarla Buluşma",
    content:
      "Dijital analizlerimiz, gökyüzünün dilini öğrenmen için sana harika bir rehberlik sunar. Ancak bazen haritanın ötesine geçmek, o derinliği bir insanla paylaşmak ve sorularına birebir yanıtlar almak istersin. Uzman Platformumuz, tam olarak bu ihtiyacını karşılamak için var. Burası, kendi alanlarında yetkin astrologlarla senin aranda kurduğumuz güvenli bir köprü. Uzmanlarımızla yapacağın her görüşme, Iyzico'nun güvenli ödeme altyapısı ile korunur ve senin için özel bir deneyim olur. Bu platformda, uzmanlarımızın emeğine duyduğumuz saygı gereği her görüşme ayrı ayrı fiyatlandırılır. Biz ise bu köprüyü ayakta tutan teknolojik altyapıyı sunduğumuz için küçük bir hizmet bedeli alırız. Senin için en doğru rehberle buluşmanı sağlayan bu güvenli ekosistem, haritanın en derin katmanlarına inebilmen için seni bekliyor.",
  },
  {
    id: "guvenlik-onceligi",
    title: "Güvenliğiniz önceliğimiz",
    content:
      "Doğum bilgilerin, senin kozmik parmak izindir. Bu yüzden verilerini asla başka kişi veya kurumlarla paylaşmıyor, sadece senin haritanı oluşturmak için kullanıyoruz. Uygulama mimarimizi, senin verilerin üzerinde tam kontrole sahip olacağın şekilde kurguladık. PWA yapımız sayesinde mağazalara bağımlı kalmadan, doğrudan tarayıcın üzerinden güvenli bir şekilde giriş yapabilir ve tüm kozmik yolculuğunu gizlilik içinde yönetebilirsin.",
  },
];

/** @deprecated Use guideSections */
export const PRODUCT_GUIDE_SECTIONS = guideSections;
