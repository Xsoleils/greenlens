import { useAuth } from "./AuthContext";
import { TAKMA_ADLAR, getTakmaAd, getSonrakiTakmaAd } from "./takmaAdlar";

const KUTULAR = [
  { renk: "#1d4ed8", ad: "Mavi Kutu",    icerik: "Kağıt, karton, gazete, dergi" },
  { renk: "#15803d", ad: "Yeşil Kutu",   icerik: "Cam şişe, kavanoz, cam ambalaj" },
  { renk: "#b45309", ad: "Sarı Kutu",    icerik: "Plastik şişe, metal kutu, alüminyum" },
  { renk: "#374151", ad: "Gri Kutu",     icerik: "Karışık, geri dönüşmeyen atıklar" },
  { renk: "#b91c1c", ad: "Kırmızı Kutu", icerik: "Pil, ilaç, elektronik, tehlikeli atık" },
];

const PUANLAR = [
  { eylem: "Fotoğraf tarama",        puan: "+0",       aciklama: "Sadece analiz — puan yok" },
  { eylem: "Video — doğru kutu",     puan: "+80-100",  aciklama: "Görüntüde doğru kutuya atarsan" },
  { eylem: "Video — yanlış kutu",    puan: "+0-10",    aciklama: "Yanlış kutu algılanırsa" },
  { eylem: "Video — kutu belirsiz",  puan: "+0",       aciklama: "Kutu kameraya girmezse" },
];

export default function Bilgi() {
  const { profil } = useAuth();
  const toplamPuan = profil?.toplamPuan || 0;
  const takmaAd = getTakmaAd(toplamPuan);
  const sonraki = getSonrakiTakmaAd(toplamPuan);

  return (
    <div className="bilgi-ekran">

      {/* Mevcut takma ad */}
      <div className="bilgi-unvan-kart">
        <div className="bilgi-unvan-etiket">Takma Adın</div>
        <div className="bilgi-unvan-adi" style={{ color: takmaAd.renk }}>{takmaAd.unvan}</div>
        {sonraki ? (
          <div className="bilgi-unvan-ilerleme">
            {sonraki.min - toplamPuan} puan daha → <span style={{ color: sonraki.renk }}>{sonraki.unvan}</span>
          </div>
        ) : (
          <div className="bilgi-unvan-ilerleme" style={{ color: "#f59e0b" }}>En yüksek takma ada ulaştın!</div>
        )}
      </div>

      {/* Nasıl kullanılır */}
      <div className="bilgi-section">
        <div className="bilgi-section-baslik">Nasıl Kullanılır?</div>
        {[
          { n: "1", baslik: "Fotoğraf ya da Video Çek",  alt: "Atmak istediğin çöpü çek ya da atarken kaydet" },
          { n: "2", baslik: "Yapay Zeka Analiz Etsin",   alt: "Gemini Vision atığı tanır" },
          { n: "3", baslik: "Hangi Kutuya Atacağını Öğren", alt: "Renk ve kutu adı gösterilir" },
          { n: "4", baslik: "Puan Kazan, Sıralamaya Gir", alt: "Mahallenle, ilçenle, Türkiye ile yarış" },
        ].map(({ n, baslik, alt }) => (
          <div key={n} className="bilgi-adim">
            <div className="bilgi-adim-numara">{n}</div>
            <div className="bilgi-adim-icerik">
              <div className="bilgi-adim-baslik">{baslik}</div>
              <div className="bilgi-adim-alt">{alt}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Kutu rehberi */}
      <div className="bilgi-section">
        <div className="bilgi-section-baslik">Kutu Renkleri</div>
        {KUTULAR.map(k => (
          <div key={k.ad} className="bilgi-kutu-satir">
            <div className="bilgi-kutu-renk-daire" style={{ background: k.renk }} />
            <div>
              <div className="bilgi-kutu-adi">{k.ad}</div>
              <div className="bilgi-kutu-icerik">{k.icerik}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Puan sistemi */}
      <div className="bilgi-section">
        <div className="bilgi-section-baslik">Puan Sistemi</div>
        {PUANLAR.map(p => (
          <div key={p.eylem} className="bilgi-puan-satir">
            <div className="bilgi-puan-bilgi">
              <div className="bilgi-puan-eylem">{p.eylem}</div>
              <div className="bilgi-puan-aciklama">{p.aciklama}</div>
            </div>
            <div className="bilgi-puan-deger">{p.puan}</div>
          </div>
        ))}
      </div>

      {/* Takma adlar */}
      <div className="bilgi-section">
        <div className="bilgi-section-baslik">Takma Adlar</div>
        {[...TAKMA_ADLAR].reverse().map(t => {
          const kazanildi = toplamPuan >= t.min;
          return (
            <div key={t.unvan} className={`bilgi-takmaad-satir ${kazanildi ? "kazanildi" : ""}`}>
              <div className="bilgi-takmaad-adi" style={{ color: kazanildi ? t.renk : "var(--soluk)" }}>
                {t.unvan}
              </div>
              <div className="bilgi-takmaad-puan">{t.min === 0 ? "Başlangıç" : `${t.min.toLocaleString("tr-TR")} puan`}</div>
              {kazanildi && <div className="bilgi-takmaad-check">✓</div>}
            </div>
          );
        })}
      </div>

    </div>
  );
}
