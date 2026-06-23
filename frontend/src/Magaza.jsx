import { useState } from "react";
import { useAuth } from "./AuthContext";
import {
  ITEMLAR, BOOSTLAR, SLOT_ETIKETLER,
  itemBul, aktifBoost, boostKalanSure,
  itemSatinAl, itemGiy, itemCikar, boostSatinAl,
} from "./magazaData";

const SLOTLAR = ["sapka", "kiyafet", "aksesuar"];
const SLOT_TABS = [...SLOTLAR.map(s => ({ key: s, label: SLOT_ETIKETLER[s] })), { key: "boost", label: "Boost" }];

function KarakterOnizleme() {
  const { profil } = useAuth();
  const giyili = profil?.giyili_itemlar || {};
  const sapka   = itemBul(giyili.sapka);
  const kiyafet = itemBul(giyili.kiyafet);
  const aks     = itemBul(giyili.aksesuar);
  const isim    = profil?.displayName || "?";
  const initials = (() => {
    const p = isim.trim().split(/\s+/);
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase();
  })();

  return (
    <div className="karakter-onizleme">
      <div className="karakter-sapka-slot">{sapka ? sapka.emoji : <span className="karakter-bos-slot">·</span>}</div>
      <div className="karakter-avatar-wrap">
        <div className="karakter-avatar">{initials}</div>
        {aks && <div className="karakter-aks-badge">{aks.emoji}</div>}
      </div>
      <div className="karakter-kiyafet-slot">{kiyafet ? kiyafet.emoji : <span className="karakter-bos-slot">·</span>}</div>
    </div>
  );
}

function ItemKart({ item, onIslem }) {
  const { kullanici, profil, setProfil } = useAuth();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  const sahip   = profil?.sahip_itemlar?.includes(item.id) || false;
  const giyili  = profil?.giyili_itemlar?.[item.slot] === item.id;
  const xp      = profil?.toplamPuan || 0;
  const yeterli = xp >= item.fiyat;

  const tikla = async () => {
    setHata(""); setYukleniyor(true);
    try {
      if (!sahip) {
        await itemSatinAl(kullanici.uid, item, profil, setProfil);
      } else if (giyili) {
        await itemCikar(kullanici.uid, item.slot, profil, setProfil);
      } else {
        await itemGiy(kullanici.uid, item, profil, setProfil);
      }
      onIslem?.();
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className={`magaza-item-kart ${giyili ? "giyili" : ""} ${sahip ? "sahip" : ""}`}>
      <div className="magaza-item-emoji">{item.emoji}</div>
      <div className="magaza-item-ad">{item.ad}</div>
      <div className="magaza-item-alt">
        {!sahip && <span className="magaza-item-fiyat">{item.fiyat} XP</span>}
        {sahip && <span className="magaza-item-sahip">{giyili ? "Giyili ✓" : "Sahipsin"}</span>}
      </div>
      {hata && <div className="magaza-item-hata">{hata}</div>}
      <button
        className={`magaza-item-btn ${giyili ? "cikar" : sahip ? "giy" : yeterli ? "al" : "yetersiz"}`}
        onClick={tikla}
        disabled={yukleniyor || (!sahip && !yeterli)}
      >
        {yukleniyor ? "..." : giyili ? "Çıkar" : sahip ? "Giy" : yeterli ? "Satın Al" : "XP Yetersiz"}
      </button>
    </div>
  );
}

function BoostKart({ boost }) {
  const { kullanici, profil, setProfil } = useAuth();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  const mevcutBoost = aktifBoost(profil);
  const aktif = mevcutBoost?.boostId === boost.id;
  const baskaBostAktif = mevcutBoost && !aktif;
  const xp = profil?.toplamPuan || 0;
  const yeterli = xp >= boost.fiyat;

  const tikla = async () => {
    setHata(""); setYukleniyor(true);
    try {
      await boostSatinAl(kullanici.uid, boost, profil, setProfil);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className={`magaza-boost-kart ${aktif ? "aktif" : ""}`}>
      <div className="magaza-boost-ust">
        <div className="magaza-boost-emoji">{boost.emoji}</div>
        <div className="magaza-boost-bilgi">
          <div className="magaza-boost-ad">{boost.ad}</div>
          <div className="magaza-boost-aciklama">{boost.aciklama}</div>
        </div>
        <div className="magaza-boost-fiyat">{boost.fiyat} XP</div>
      </div>
      {aktif && (
        <div className="magaza-boost-kalan">
          Aktif — {boostKalanSure(mevcutBoost.bitis)} kaldı
        </div>
      )}
      {hata && <div className="magaza-item-hata">{hata}</div>}
      {!aktif && (
        <button
          className={`magaza-item-btn ${yeterli && !baskaBostAktif ? "al" : "yetersiz"}`}
          onClick={tikla}
          disabled={yukleniyor || !yeterli || !!baskaBostAktif}
        >
          {yukleniyor ? "..." : baskaBostAktif ? "Başka Boost Aktif" : yeterli ? "Satın Al" : "XP Yetersiz"}
        </button>
      )}
    </div>
  );
}

export default function Magaza({ acik, onKapat }) {
  const [sekme, setSekme] = useState("sapka");

  if (!acik) return null;

  const slotItemlari = ITEMLAR.filter(i => i.slot === sekme);

  return (
    <div className="modal-overlay" onClick={onKapat}>
      <div className="modal-icerik" onClick={e => e.stopPropagation()}>

        <div className="klan-modal-header">
          <div className="klan-modal-baslik">Karakter & Mağaza</div>
          <button className="modal-kapat-btn" style={{ position: "static" }} onClick={onKapat}>✕</button>
        </div>

        <KarakterOnizleme />

        <div className="lider-sekmeler" style={{ borderBottom: "1px solid var(--sinir)", flexShrink: 0 }}>
          {SLOT_TABS.map(t => (
            <button
              key={t.key}
              className={`sekme-btn ${sekme === t.key ? "aktif" : ""}`}
              onClick={() => setSekme(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="magaza-liste">
          {sekme !== "boost" && slotItemlari.map(item => (
            <ItemKart key={item.id} item={item} />
          ))}
          {sekme === "boost" && BOOSTLAR.map(b => (
            <BoostKart key={b.id} boost={b} />
          ))}
        </div>

      </div>
    </div>
  );
}
