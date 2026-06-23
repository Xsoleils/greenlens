import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { getTakmaAd } from "./takmaAdlar";
import { getIsimStili, getFrameStil, itemBul } from "./magazaData";

function LiderAvatar({ user, size = 38 }) {
  const giyili   = user.giyili_itemlar || {};
  const sapka    = itemBul(giyili.sapka);
  const kiyafet  = itemBul(giyili.kiyafet);
  const aks      = itemBul(giyili.aksesuar);
  const frameStil = getFrameStil(giyili);
  const initials  = getInitials(user.displayName);
  const bg        = getAvatarRenk(user.displayName);

  return (
    <div className="lider-avatar-grup" style={{ width: size, height: size }}>
      {sapka && <div className="lider-sapka-mini">{sapka.emoji}</div>}
      {frameStil ? (
        <div className="lider-cerceve-wrap" style={frameStil}>
          <div className="lider-avatar lider-avatar-sm" style={{ background: bg }}>{initials}</div>
        </div>
      ) : (
        <div className="lider-avatar" style={{ background: bg, width: size, height: size }}>{initials}</div>
      )}
      {aks && <div className="lider-aks-mini">{aks.emoji}</div>}
      {kiyafet && <div className="lider-kiyafet-mini">{kiyafet.emoji}</div>}
    </div>
  );
}

const BIREYSEL_SEKMELER = [
  { key: "mahalle", label: "Mahalle" },
  { key: "ilce",    label: "İlçe" },
  { key: "il",      label: "İl" },
  { key: "ulke",    label: "Türkiye" },
];

const AVATAR_RENKLER = [
  "#166534", "#1d4ed8", "#7c3aed", "#be123c",
  "#b45309", "#0e7490", "#065f46", "#92400e",
];

const getAvatarRenk = (name = "") =>
  AVATAR_RENKLER[name.charCodeAt(0) % AVATAR_RENKLER.length];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

/* ── Klan Sıralaması ── */
function KlanLiderboard({ benimKlanId }) {
  const [klanlar, setKlanlar]       = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata]             = useState(null);

  useEffect(() => {
    const yukle = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "klanlar"), orderBy("toplamPuan", "desc"), limit(100))
        );
        setKlanlar(snap.docs.map((d, i) => ({ id: d.id, sira: i + 1, ...d.data() })));
      } catch (err) {
        setHata(err.code === "permission-denied"
          ? "Firestore klan izni eksik — Firebase Console → Rules bölümünü güncelle."
          : "Klan sıralaması yüklenemedi.");
      } finally {
        setYukleniyor(false);
      }
    };
    yukle();
  }, []);

  if (yukleniyor) return <div className="lider-yukleniyor"><div className="spinner" /></div>;
  if (hata)       return <div className="hata-kutu">{hata}</div>;
  if (!klanlar.length) return <div className="lider-bos">Henüz hiç klan yok.</div>;

  return (
    <>
      {klanlar.map(k => {
        const benim    = k.id === benimKlanId;
        const renk     = getAvatarRenk(k.ad);
        const siraClass = k.sira === 1 ? "altin" : k.sira === 2 ? "gumus" : k.sira === 3 ? "bronz" : "";
        const siraGoster = k.sira === 1 ? "🥇" : k.sira === 2 ? "🥈" : k.sira === 3 ? "🥉" : k.sira;
        return (
          <div key={k.id} className={`lider-satir ${benim ? "ben" : ""}`}>
            <div className={`lider-sira ${siraClass}`}>{siraGoster}</div>
            <div className="lider-avatar" style={{ background: renk, fontSize: "0.7rem" }}>
              {k.tag}
            </div>
            <div className="lider-bilgi">
              <div className="lider-isim">
                {k.ad}
                {benim && <span className="sen-etiketi">Klanın</span>}
              </div>
              <div className="lider-alt">{k.uyeSayisi} üye</div>
            </div>
            <div className="lider-puan">
              <div className="lider-puan-sayi">{(k.toplamPuan || 0).toLocaleString("tr-TR")}</div>
              <div className="lider-puan-etiket">XP</div>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ── Bölge Sıralaması ── */
const BOLGE_SEKMELER = [
  { key: "iller",      label: "81 İl" },
  { key: "mahalleler", label: "Mahalleler" },
];

function BolgeLiderboard({ benimIl, benimMahalle }) {
  const [sekme, setSekme]           = useState("iller");
  const [liste, setListe]           = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata]             = useState(null);

  useEffect(() => {
    const yukle = async () => {
      setYukleniyor(true); setHata(null); setListe([]);
      try {
        const koleksiyon = sekme === "iller" ? "iller" : "mahalleler";
        const snap = await getDocs(
          query(collection(db, koleksiyon), orderBy("toplamPuan", "desc"), limit(100))
        );
        setListe(snap.docs.map((d, i) => ({ id: d.id, sira: i + 1, ...d.data() })));
      } catch (err) {
        setHata(err.code === "permission-denied"
          ? "Firestore izni eksik — Firebase Console → Rules bölümünü güncelle."
          : "Bölge sıralaması yüklenemedi.");
      } finally {
        setYukleniyor(false);
      }
    };
    yukle();
  }, [sekme]);

  return (
    <>
      <div className="lider-sekmeler">
        {BOLGE_SEKMELER.map(s => (
          <button
            key={s.key}
            className={`sekme-btn ${sekme === s.key ? "aktif" : ""}`}
            onClick={() => setSekme(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="lider-liste">
        {yukleniyor && <div className="lider-yukleniyor"><div className="spinner" /></div>}
        {hata && <div className="hata-kutu">{hata}</div>}
        {!yukleniyor && !hata && liste.length === 0 && (
          <div className="lider-bos">Henüz hiç veri yok — tarama yaptıkça bölgeler oluşur.</div>
        )}
        {!yukleniyor && !hata && liste.map(b => {
          const benim = sekme === "iller"
            ? b.ad === benimIl
            : b.ad === benimMahalle && b.il === benimIl;
          const renk = getAvatarRenk(b.ad);
          const siraClass  = b.sira === 1 ? "altin" : b.sira === 2 ? "gumus" : b.sira === 3 ? "bronz" : "";
          const siraGoster = b.sira === 1 ? "🥇" : b.sira === 2 ? "🥈" : b.sira === 3 ? "🥉" : b.sira;
          return (
            <div key={b.id} className={`lider-satir ${benim ? "ben" : ""}`}>
              <div className={`lider-sira ${siraClass}`}>{siraGoster}</div>
              <div className="lider-avatar bolge-avatar" style={{ background: renk }}>
                {b.ad.slice(0, 2).toUpperCase()}
              </div>
              <div className="lider-bilgi">
                <div className="lider-isim">
                  {b.ad}
                  {benim && <span className="sen-etiketi">Bölgen</span>}
                </div>
                {sekme === "mahalleler" && (
                  <div className="lider-alt">{b.il}</div>
                )}
              </div>
              <div className="lider-puan">
                <div className="lider-puan-sayi">{(b.toplamPuan || 0).toLocaleString("tr-TR")}</div>
                <div className="lider-puan-etiket">XP</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── Ana Liderboard ── */
export default function Liderboard() {
  const { profil, kullanici } = useAuth();
  const [anaTab, setAnaTab]       = useState("bireysel"); // bireysel | klan | bolge
  const [sekme, setSekme]         = useState("mahalle");
  const [tumListe, setTumListe]   = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata]           = useState(null);

  useEffect(() => {
    if (anaTab !== "bireysel") return;
    const yukle = async () => {
      setYukleniyor(true); setHata(null);
      try {
        const snap = await getDocs(
          query(collection(db, "users"), orderBy("toplamPuan", "desc"), limit(200))
        );
        setTumListe(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        setHata(err.code === "permission-denied"
          ? "Firestore izin hatası — Firebase Console → Rules bölümünü güncelle."
          : "Sıralama yüklenemedi: " + (err.code || err.message));
      } finally {
        setYukleniyor(false);
      }
    };
    yukle();
  }, [anaTab]);

  const liste = (() => {
    if (!profil) return [];
    let filtre;
    if (sekme === "mahalle") filtre = tumListe.filter(u => u.mahalle === profil.mahalle && u.il === profil.il);
    else if (sekme === "ilce") filtre = tumListe.filter(u => u.ilce === profil.ilce && u.il === profil.il);
    else if (sekme === "il")   filtre = tumListe.filter(u => u.il === profil.il);
    else                       filtre = tumListe;
    return filtre.map((u, i) => ({ ...u, sira: i + 1 }));
  })();

  const simdi = new Date();
  const ay  = simdi.toLocaleString("tr-TR", { month: "long" });
  const yil = simdi.getFullYear();
  const altBaslik = anaTab === "klan"
    ? `Tüm Klanlar · ${ay} ${yil}`
    : anaTab === "bolge"
    ? `Bölge Sıralaması · ${ay} ${yil}`
    : {
      mahalle: `${profil?.mahalle}, ${ay} ${yil}`,
      ilce:    `${profil?.ilce}, ${ay} ${yil}`,
      il:      `${profil?.il}, ${ay} ${yil}`,
      ulke:    `Türkiye, ${ay} ${yil}`,
    }[sekme];

  return (
    <div className="lider-ekran">
      <div className="lider-baslik-alan">
        <div className="lider-baslik">Sıralama</div>
        <div className="lider-altbaslik">{altBaslik}</div>
      </div>

      {/* Ana tab: Bireysel / Klan / Bölgeler */}
      <div className="lider-ana-tab">
        <button className={`lider-ana-btn ${anaTab === "bireysel" ? "aktif" : ""}`} onClick={() => setAnaTab("bireysel")}>
          Bireysel
        </button>
        <button className={`lider-ana-btn ${anaTab === "klan" ? "aktif" : ""}`} onClick={() => setAnaTab("klan")}>
          Klanlar
        </button>
        <button className={`lider-ana-btn ${anaTab === "bolge" ? "aktif" : ""}`} onClick={() => setAnaTab("bolge")}>
          Bölgeler
        </button>
      </div>

      {/* Bireysel alt sekmeler */}
      {anaTab === "bireysel" && (
        <div className="lider-sekmeler">
          {BIREYSEL_SEKMELER.map(s => (
            <button
              key={s.key}
              className={`sekme-btn ${sekme === s.key ? "aktif" : ""}`}
              onClick={() => setSekme(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Bireysel liste */}
      {anaTab === "bireysel" && (
        <div className="lider-liste">
          {yukleniyor && <div className="lider-yukleniyor"><div className="spinner" /></div>}
          {hata && <div className="hata-kutu">{hata}</div>}
          {!yukleniyor && !hata && liste.length === 0 && (
            <div className="lider-bos">Bu alanda henüz kullanıcı yok.</div>
          )}
          {!yukleniyor && !hata && liste.map(user => {
            const ben        = user.id === kullanici?.uid;
            const siraClass  = user.sira === 1 ? "altin" : user.sira === 2 ? "gumus" : user.sira === 3 ? "bronz" : "";
            const siraGoster = user.sira === 1 ? "🥇" : user.sira === 2 ? "🥈" : user.sira === 3 ? "🥉" : user.sira;
            const isimStil   = getIsimStili(user.giyili_itemlar);
            return (
              <div key={user.id} className={`lider-satir ${ben ? "ben" : ""}`}>
                <div className={`lider-sira ${siraClass}`}>{siraGoster}</div>
                <LiderAvatar user={user} size={38} />
                <div className="lider-bilgi">
                  <div className="lider-isim">
                    <span style={isimStil}>{user.displayName}</span>
                    {ben && <span className="sen-etiketi">Sen</span>}
                  </div>
                  <div className="lider-alt">
                    <span style={{ color: getTakmaAd(user.toplamPuan || 0).renk, fontWeight: 700 }}>
                      {getTakmaAd(user.toplamPuan || 0).unvan}
                    </span>
                    {" · "}{user.taramaSayisi || 0} tarama
                  </div>
                </div>
                <div className="lider-puan">
                  <div className="lider-puan-sayi">{(user.toplamPuan || 0).toLocaleString("tr-TR")}</div>
                  <div className="lider-puan-etiket">XP</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Klan */}
      {anaTab === "klan" && (
        <div className="lider-liste">
          <KlanLiderboard benimKlanId={profil?.klanId} />
        </div>
      )}

      {/* Bölgeler */}
      {anaTab === "bolge" && (
        <BolgeLiderboard benimIl={profil?.il} benimMahalle={profil?.mahalle} />
      )}
    </div>
  );
}
