import { useState } from "react";
import { useAuth } from "./AuthContext";
import { getTakmaAd } from "./takmaAdlar";
import Klan from "./Klan";
import Magaza from "./Magaza";
import { itemBul, aktifBoost, boostKalanSure } from "./magazaData";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

const ROZETLER = [
  { id: "baslangic",  label: "🌱 Yeşil Başlangıç",     kosul: (t) => t >= 1 },
  { id: "on",         label: "📦 10 Tarama",            kosul: (t) => t >= 10 },
  { id: "elli",       label: "🔥 50 Tarama",            kosul: (t) => t >= 50 },
  { id: "yuz",        label: "💯 100 Tarama",           kosul: (t) => t >= 100 },
  { id: "puan200",    label: "⭐ Puan Avcısı",          kosul: (t, p) => p >= 200 },
  { id: "puan500",    label: "🏆 Süper Geri Dönüşçü",  kosul: (t, p) => p >= 500 },
];

export default function Profil({ oturum }) {
  const { profil, kullanici, cikisYap } = useAuth();
  const [klanAcik,   setKlanAcik]   = useState(false);
  const [magazaAcik, setMagazaAcik] = useState(false);

  const [gbAcik,   setGbAcik]   = useState(false);
  const [gbTip,    setGbTip]    = useState("destek");
  const [gbMesaj,  setGbMesaj]  = useState("");
  const [gbDurum,  setGbDurum]  = useState(null); // null | "gonderiliyor" | "tamam" | "hata"

  const gonderGeriBildirim = async () => {
    if (!gbMesaj.trim()) return;
    setGbDurum("gonderiliyor");
    try {
      await addDoc(collection(db, "geri_bildirimler"), {
        userId:      kullanici?.uid || "anonim",
        displayName: profil?.displayName || "Anonim",
        tip:         gbTip,
        mesaj:       gbMesaj.trim(),
        tarih:       serverTimestamp(),
      });
      setGbDurum("tamam");
      setGbMesaj("");
    } catch {
      setGbDurum("hata");
    }
  };

  const toplamTarama = (profil?.taramaSayisi || 0) + (oturum?.taramaSayisi || 0);
  const toplamPuan   = (profil?.toplamPuan || 0)   + (oturum?.toplamPuan || 0);

  const kazanilanRozetler = ROZETLER.filter(r => r.kosul(toplamTarama, toplamPuan));

  const giyili  = profil?.giyili_itemlar || {};
  const sapka   = itemBul(giyili.sapka);
  const kiyafet = itemBul(giyili.kiyafet);
  const aksesuar = itemBul(giyili.aksesuar);
  const boost   = aktifBoost(profil);

  return (
    <div className="profil-ekran">
      {/* Avatar + isim */}
      <div className="profil-hero">
        {/* Karakter önizleme */}
        <div className="profil-karakter">
          <div className="profil-karakter-sapka">
            {sapka ? sapka.emoji : <span className="profil-karakter-bos">·</span>}
          </div>
          <div className="profil-karakter-avatar-wrap">
            <div className="avatar-daire">
              {getInitials(profil?.displayName || kullanici?.displayName || "?")}
            </div>
            {aksesuar && <div className="profil-karakter-aks">{aksesuar.emoji}</div>}
          </div>
          <div className="profil-karakter-kiyafet">
            {kiyafet ? kiyafet.emoji : <span className="profil-karakter-bos">·</span>}
          </div>
        </div>

        <div className="profil-isim">{profil?.displayName || "Kullanıcı"}</div>
        <div
          className="profil-unvan"
          style={{ color: getTakmaAd(toplamPuan).renk, fontWeight: 700 }}
        >
          {getTakmaAd(toplamPuan).unvan}
        </div>

        {/* Aktif boost chip */}
        {boost && (
          <div className="boost-aktif-chip">
            {boost.emoji} {boost.ad} — {boostKalanSure(boost.bitis)} kaldı
          </div>
        )}

        {/* Mağaza butonu */}
        <button className="magaza-ac-btn" onClick={() => setMagazaAcik(true)}>
          🛍️ Karakter & Mağaza
        </button>
      </div>

      {/* İstatistikler */}
      <div className="istatistik-grid">
        <div className="ist-kart">
          <div className="ist-kart-sayi">{toplamTarama}</div>
          <div className="ist-kart-etiket">Toplam tarama</div>
        </div>
        <div className="ist-kart">
          <div className="ist-kart-sayi">{toplamPuan}</div>
          <div className="ist-kart-etiket">Toplam puan</div>
        </div>
        <div className="ist-kart">
          <div className="ist-kart-sayi">{kazanilanRozetler.length}</div>
          <div className="ist-kart-etiket">Rozet</div>
        </div>
        <div className="ist-kart">
          <div className="ist-kart-sayi" style={{ fontSize: "0.95rem", paddingTop: 6 }}>
            {profil?.mahalle || "—"}
          </div>
          <div className="ist-kart-etiket">Mahalle</div>
        </div>
      </div>

      {/* Rozetler */}
      <div className="rozetler-bolum">
        <div className="rozetler-baslik">Rozetler</div>
        {kazanilanRozetler.length === 0 ? (
          <div style={{ fontSize: "0.82rem", color: "var(--soluk)" }}>
            Henüz rozet yok — tara ve kazan!
          </div>
        ) : (
          <div className="rozetler-liste">
            {kazanilanRozetler.map(r => (
              <div key={r.id} className="rozet-chip">{r.label}</div>
            ))}
          </div>
        )}
      </div>

      {/* Klan */}
      <div className="klan-profil-bolum">
        <div className="rozetler-baslik">Klan</div>
        {profil?.klanId ? (
          <button className="klan-profil-btn aktif" onClick={() => setKlanAcik(true)}>
            <span className="klan-tag-kucuk">[{profil.klanTag}]</span>
            <span>{profil.klanAdi}</span>
            <span className="klan-profil-ok">›</span>
          </button>
        ) : (
          <button className="klan-profil-btn" onClick={() => setKlanAcik(true)}>
            Klana katıl veya oluştur
          </button>
        )}
      </div>

      {/* Çıkış */}
      <button className="cikis-btn" onClick={cikisYap}>
        Çıkış Yap
      </button>

      {/* Geri Bildirim */}
      <div className="gb-bolum">
        <button
          className="gb-toggle"
          onClick={() => { setGbAcik(a => !a); setGbDurum(null); }}
        >
          <span>Geri Bildirim</span>
          <span className="gb-toggle-ok">{gbAcik ? "∧" : "∨"}</span>
        </button>

        {gbAcik && (
          <div className="gb-form">
            {gbDurum === "tamam" ? (
              <div className="gb-tamam">
                Teşekkürler! Geri bildiriminiz iletildi.
              </div>
            ) : (
              <>
                <div className="gb-tip-grup">
                  <button
                    className={`gb-tip-btn ${gbTip === "destek" ? "aktif" : ""}`}
                    onClick={() => setGbTip("destek")}
                  >
                    Destek
                  </button>
                  <button
                    className={`gb-tip-btn sikayet ${gbTip === "sikayet" ? "aktif" : ""}`}
                    onClick={() => setGbTip("sikayet")}
                  >
                    Şikayet
                  </button>
                </div>
                <textarea
                  className="gb-textarea"
                  placeholder={gbTip === "destek" ? "Nasıl yardımcı olabiliriz?" : "Neyi bildirmek istersiniz?"}
                  value={gbMesaj}
                  onChange={e => { setGbMesaj(e.target.value); setGbDurum(null); }}
                  rows={4}
                  maxLength={500}
                />
                <div className="gb-altsatir">
                  <span className="gb-karakter">{gbMesaj.length}/500</span>
                  {gbDurum === "hata" && (
                    <span className="gb-hata">Bir hata oluştu, tekrar dene.</span>
                  )}
                  <button
                    className="gb-gonder-btn"
                    onClick={gonderGeriBildirim}
                    disabled={!gbMesaj.trim() || gbDurum === "gonderiliyor"}
                  >
                    {gbDurum === "gonderiliyor" ? "Gönderiliyor…" : "Gönder"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Klan   acik={klanAcik}   onKapat={() => setKlanAcik(false)} />
      <Magaza acik={magazaAcik} onKapat={() => setMagazaAcik(false)} />
    </div>
  );
}
