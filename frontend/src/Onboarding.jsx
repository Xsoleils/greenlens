import { useState } from "react";

const ADIMLAR = [
  {
    emoji: "🌱",
    baslik: "GreenLens'e Hoş Geldin!",
    aciklama: "Çöpünü doğru kutuya atmayı öğren, puan kazan ve Türkiye sıralamasına gir!",
    alt: null,
  },
  {
    emoji: "📸",
    baslik: "Çek → Analiz Et → Öğren",
    aciklama: "Atmak istediğin çöpü kameraya göster. Yapay zeka hangi renkli kutuya ait olduğunu söyler.",
    alt: "Fotoğraf veya video çekebilirsin — ikisi de çalışır.",
  },
  {
    emoji: "🎥",
    baslik: "Video ile Ekstra Puan!",
    aciklama: "Çöpü çöp kutusuna atarken video çek. Doğru kutuya attıysan 80–100 XP kazanırsın!",
    alt: "Kaydı Başlat butonuna bas, ata, Durdur de. 6 saniye yeterli.",
  },
  {
    baslik: "Kutu Renkleri",
    emoji: null,
    aciklama: null,
    alt: null,
    kutular: [
      { renk: "#1d4ed8", ad: "Mavi Kutu",     icerik: "Kağıt, karton, gazete" },
      { renk: "#15803d", ad: "Yeşil Kutu",    icerik: "Cam şişe, kavanoz" },
      { renk: "#b45309", ad: "Sarı Kutu",     icerik: "Plastik, metal, alüminyum" },
      { renk: "#374151", ad: "Gri Kutu",      icerik: "Geri dönüşmeyen çöp" },
      { renk: "#b91c1c", ad: "Kırmızı Kutu",  icerik: "Pil, ilaç, tehlikeli" },
    ],
  },
  {
    emoji: "🏆",
    baslik: "Görevler & Sıralama",
    aciklama: "Her gün görevleri tamamla, XP kazan. Mahallenle, ilçenle, tüm Türkiye ile yarış!",
    alt: "Klan kur, arkadaşlarını davet et, birlikte sıralamada yüksel.",
  },
];

export default function Onboarding({ onBitti }) {
  const [adim, setAdim] = useState(0);

  const ileri = () => {
    if (adim < ADIMLAR.length - 1) setAdim(a => a + 1);
    else onBitti();
  };

  const geri = () => {
    if (adim > 0) setAdim(a => a - 1);
  };

  const mevcut = ADIMLAR[adim];
  const sonAdim = adim === ADIMLAR.length - 1;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-kart">

        {/* Atla butonu */}
        <button className="onboarding-atla" onClick={onBitti}>Atla</button>

        {/* İçerik */}
        <div className="onboarding-icerik">
          {mevcut.emoji && (
            <div className="onboarding-emoji">{mevcut.emoji}</div>
          )}

          <div className="onboarding-baslik">{mevcut.baslik}</div>

          {mevcut.aciklama && (
            <div className="onboarding-aciklama">{mevcut.aciklama}</div>
          )}

          {mevcut.alt && (
            <div className="onboarding-alt">{mevcut.alt}</div>
          )}

          {/* Kutu listesi (sadece kutu adımında) */}
          {mevcut.kutular && (
            <div className="onboarding-kutular">
              {mevcut.kutular.map(k => (
                <div key={k.ad} className="onboarding-kutu-satir">
                  <div className="onboarding-kutu-renk" style={{ background: k.renk }} />
                  <div className="onboarding-kutu-bilgi">
                    <div className="onboarding-kutu-ad">{k.ad}</div>
                    <div className="onboarding-kutu-icerik">{k.icerik}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alt alan: noktalar + butonlar */}
        <div className="onboarding-alt-alan">
          {/* İlerleme noktaları */}
          <div className="onboarding-noktalar">
            {ADIMLAR.map((_, i) => (
              <div
                key={i}
                className={`onboarding-nokta ${i === adim ? "aktif" : ""}`}
                onClick={() => setAdim(i)}
              />
            ))}
          </div>

          {/* Butonlar */}
          <div className="onboarding-butonlar">
            {adim > 0 && (
              <button className="onboarding-btn-geri" onClick={geri}>Geri</button>
            )}
            <button className="onboarding-btn-ileri" onClick={ileri}>
              {sonAdim ? "Hadi Başlayalım! 🚀" : "İleri"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
