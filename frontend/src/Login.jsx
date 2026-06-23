// frontend/src/Login.jsx
import { useState, useEffect } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";


// ── Firestore'a kullanıcı kaydet ──────────────────────────────────────────────
async function kullaniciyiKaydet(user, ekBilgi = {}) {
  const ref = doc(db, "users", user.uid);
  await setDoc(ref, {
    displayName: user.displayName || ekBilgi.displayName || "İsimsiz",
    email: user.email,
    il: ekBilgi.il || "",
    ilce: ekBilgi.ilce || "",
    mahalle: ekBilgi.mahalle || "",
    sehir: ekBilgi.il || "",
    toplamPuan: 0,
    taramaSayisi: 0,
    kayitTarihi: serverTimestamp(),
  }, { merge: true });
}

// ── Cascade Konum Seçici ──────────────────────────────────────────────────────
function KonumSecici({ il, ilce, mahalle, onIlChange, onIlceChange, onMahalleChange }) {
  const [turkeyData, setTurkeyData] = useState(null);
  const [fetchDurum, setFetchDurum] = useState("yukleniyor"); // yukleniyor | tamam | hata

  useEffect(() => {
    // Hem /turkey_data.json hem de ./turkey_data.json dene
    const urller = ["/turkey_data.json", "./turkey_data.json"];
    let basarili = false;

    const dene = async () => {
      for (const url of urller) {
        try {
          const r = await fetch(url);
          if (!r.ok) continue;
          const data = await r.json();
          setTurkeyData(data);
          setFetchDurum("tamam");
          basarili = true;
          break;
        } catch {
          continue;
        }
      }
      if (!basarili) setFetchDurum("hata");
    };

    dene();
  }, []);

  if (fetchDurum === "yukleniyor") {
    return (
      <div style={{ fontSize: "0.85rem", color: "#6b7280", padding: "0.75rem 0", textAlign: "center" }}>
        ⏳ Konum verileri yükleniyor…
      </div>
    );
  }

  if (fetchDurum === "hata") {
    return (
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#dc2626" }}>
        ⚠️ Konum verileri yüklenemedi. <strong>turkey_data.json</strong> dosyasının{" "}
        <code style={{ background: "#fee2e2", padding: "1px 4px", borderRadius: 3 }}>frontend/public/</code>{" "}
        klasöründe olduğundan emin ol.
      </div>
    );
  }

  const iller = Object.keys(turkeyData).sort();
  const ilceler = il ? Object.keys(turkeyData[il]).sort() : [];
  const mahalleler = il && ilce ? [...turkeyData[il][ilce]].sort() : [];

  return (
    <>
      <label style={s.etiket}>İl</label>
      <select style={s.input} value={il} onChange={e => onIlChange(e.target.value)}>
        <option value="">İl seç…</option>
        {iller.map(i => <option key={i} value={i}>{i}</option>)}
      </select>

      <label style={{ ...s.etiket, opacity: il ? 1 : 0.4 }}>İlçe</label>
      <select
        style={{ ...s.input, opacity: il ? 1 : 0.55, cursor: il ? "pointer" : "not-allowed" }}
        value={ilce} onChange={e => onIlceChange(e.target.value)} disabled={!il}
      >
        <option value="">{il ? "İlçe seç…" : "Önce il seç"}</option>
        {ilceler.map(i => <option key={i} value={i}>{i}</option>)}
      </select>

      <label style={{ ...s.etiket, opacity: ilce ? 1 : 0.4 }}>Mahalle</label>
      <select
        style={{ ...s.input, opacity: ilce ? 1 : 0.55, cursor: ilce ? "pointer" : "not-allowed" }}
        value={mahalle} onChange={e => onMahalleChange(e.target.value)} disabled={!ilce}
      >
        <option value="">{ilce ? "Mahalle seç…" : "Önce ilçe seç"}</option>
        {mahalleler.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </>
  );
}

// ── Profil Tamamlama ──────────────────────────────────────────────────────────
// Google ile girişte displayName zaten geliyor → isim alanını gizle
export function ProfilTamamla({ onTamamla }) {
  const mevcutIsim = auth.currentUser?.displayName || "";
  const [displayName, setDisplayName] = useState(mevcutIsim);
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [mahalle, setMahalle] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  const ilDegisti = (v) => { setIl(v); setIlce(""); setMahalle(""); };
  const ilceDegisti = (v) => { setIlce(v); setMahalle(""); };

  const kaydet = async (e) => {
    e.preventDefault();
    if (!mevcutIsim && !displayName.trim()) return setHata("İsim boş olamaz.");
    if (!il) return setHata("İl seç.");
    if (!ilce) return setHata("İlçe seç.");
    if (!mahalle) return setHata("Mahalle seç.");

    setYukleniyor(true); setHata("");
    try {
      if (!mevcutIsim) {
        await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      }
      await kullaniciyiKaydet(auth.currentUser, { displayName: displayName.trim(), il, ilce, mahalle });
      onTamamla({ displayName: displayName.trim(), il, ilce, mahalle, sehir: il, toplamPuan: 0, taramaSayisi: 0 });
    } catch (err) {
      setHata(err.message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div style={s.sayfa}>
      <div style={s.kart}>
        <div style={s.logo}>🌿 GreenLens</div>
        <h2 style={s.baslik}>Konumunu Seç</h2>
        <p style={s.alt}>Mahalle liderboarduna katılmak için konum bilgisi gerekiyor.</p>

        <form onSubmit={kaydet} style={s.form}>

          {/* İsim: sadece Google'dan isim gelmemişse göster */}
          {!mevcutIsim && (
            <>
              <label style={s.etiket}>Adın</label>
              <input
                style={s.input}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Ad Soyad"
              />
            </>
          )}

          {/* Google'dan isim geldiyse küçük bir selamlama göster */}
          {mevcutIsim && (
            <div style={{ fontSize: "0.9rem", color: "#374151", marginBottom: "0.25rem" }}>
              👋 Merhaba, <strong>{mevcutIsim}</strong>
            </div>
          )}

          <KonumSecici
            il={il} ilce={ilce} mahalle={mahalle}
            onIlChange={ilDegisti}
            onIlceChange={ilceDegisti}
            onMahalleChange={setMahalle}
          />

          {hata && <div style={s.hata}>{hata}</div>}

          <button style={s.btnAna} type="submit" disabled={yukleniyor}>
            {yukleniyor ? "Kaydediliyor…" : "Başla →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Ana Login/Register Ekranı ─────────────────────────────────────────────────
export default function Login() {
  const [mod, setMod] = useState("giris");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  // Mobilde redirect'ten dönen sonucu yakala
  useEffect(() => {
    setYukleniyor(true);
    getRedirectResult(auth)
      .then(async result => {
        if (result?.user) {
          await kullaniciyiKaydet(result.user);
        }
      })
      .catch(err => {
        if (err.code) setHata(googleHataCevir(err.code));
      })
      .finally(() => setYukleniyor(false));
  }, []);

  const googleGiris = async () => {
    setYukleniyor(true); setHata("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await kullaniciyiKaydet(result.user);
    } catch (err) {
      if (
        err.code === "auth/popup-blocked" ||
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        // Popup çalışmadı → redirect ile dene (mobil tarayıcılar)
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          setHata(googleHataCevir(redirectErr.code));
          setYukleniyor(false);
        }
      } else {
        setHata(googleHataCevir(err.code));
        setYukleniyor(false);
      }
    }
  };

  const emailGiris = async (e) => {
    e.preventDefault(); setYukleniyor(true); setHata("");
    try {
      await signInWithEmailAndPassword(auth, email, sifre);
    } catch (err) {
      setHata(hataCevir(err.code));
    } finally {
      setYukleniyor(false);
    }
  };

  const kayitOl = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return setHata("İsim boş olamaz.");
    setYukleniyor(true); setHata("");
    try {
      const result = await createUserWithEmailAndPassword(auth, email, sifre);
      await updateProfile(result.user, { displayName: displayName.trim() });
      await kullaniciyiKaydet(result.user, { displayName: displayName.trim() });
    } catch (err) {
      setHata(hataCevir(err.code));
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div style={s.sayfa}>
      <div style={s.kart}>
        <div style={s.logo}>🌿 GreenLens</div>
        <p style={{ ...s.alt, marginBottom: "1.5rem" }}>Akıllı Atık Asistanı</p>

        <button style={s.btnGoogle} onClick={googleGiris} disabled={yukleniyor}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.2 33.6 29.6 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 6 1.1 8.2 3l6.1-6.1C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.8 0 20-7.8 20-21 0-1.4-.1-2.7-.5-4z"/>
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3.1 0 6 1.1 8.2 3l6.1-6.1C34.6 5.1 29.6 3 24 3c-7.7 0-14.3 4.6-17.7 11.7z"/>
            <path fill="#FBBC05" d="M24 45c5.5 0 10.4-1.9 14.2-5l-6.6-5.4C29.6 36.1 27 37 24 37c-5.6 0-10.2-3.4-11.7-8.4l-7 5.4C8.8 41.3 15.9 45 24 45z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.8 2.3-2.3 4.2-4.3 5.6l6.6 5.4C42.1 36 45 30.5 45 24c0-1.4-.1-2.7-.5-4z"/>
          </svg>
          Google ile Devam Et
        </button>

        <div style={s.ayirac}>
          <div style={s.cizgi} /><span style={s.ayiracYazi}>ya da</span><div style={s.cizgi} />
        </div>

        <div style={s.tab}>
          <button
            style={{ ...s.tabBtn, ...(mod === "giris" ? s.tabAktif : {}) }}
            onClick={() => { setMod("giris"); setHata(""); }}
          >Giriş Yap</button>
          <button
            style={{ ...s.tabBtn, ...(mod === "kayit" ? s.tabAktif : {}) }}
            onClick={() => { setMod("kayit"); setHata(""); }}
          >Kayıt Ol</button>
        </div>

        <form onSubmit={mod === "giris" ? emailGiris : kayitOl} style={s.form}>
          {mod === "kayit" && (
            <>
              <label style={s.etiket}>Adın</label>
              <input
                style={s.input} type="text"
                value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Ad Soyad" required
              />
            </>
          )}

          <label style={s.etiket}>E-posta</label>
          <input
            style={s.input} type="email"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="ornek@mail.com" required
          />

          <label style={s.etiket}>Şifre</label>
          <input
            style={s.input} type="password"
            value={sifre} onChange={e => setSifre(e.target.value)}
            placeholder={mod === "kayit" ? "En az 6 karakter" : "••••••••"} required
          />

          {hata && <div style={s.hata}>{hata}</div>}

          <button style={s.btnAna} type="submit" disabled={yukleniyor}>
            {yukleniyor ? "Bekleniyor…" : mod === "giris" ? "Giriş Yap" : "Hesap Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}

function hataCevir(code) {
  const map = {
    "auth/user-not-found": "Bu e-posta ile kayıtlı hesap yok.",
    "auth/wrong-password": "Şifre yanlış.",
    "auth/email-already-in-use": "Bu e-posta zaten kullanımda.",
    "auth/weak-password": "Şifre en az 6 karakter olmalı.",
    "auth/invalid-email": "Geçersiz e-posta adresi.",
    "auth/too-many-requests": "Çok fazla deneme. Biraz bekle.",
    "auth/invalid-credential": "E-posta veya şifre hatalı.",
  };
  return map[code] || "Bir hata oluştu, tekrar dene.";
}

function googleHataCevir(code) {
  if (code === "auth/popup-closed-by-user") return "";
  if (code === "auth/cancelled-popup-request") return "";
  if (code === "auth/unauthorized-domain") return "Bu domain Firebase'de yetkili değil. Firebase Console → Authentication → Authorized Domains.";
  return `Google girişi başarısız (${code || "bilinmiyor"})`;
}

const s = {
  sayfa: {
    minHeight: "100vh", background: "#060f06", display: "flex",
    alignItems: "center", justifyContent: "center", padding: "1rem",
  },
  kart: {
    background: "#0b1e0b", borderRadius: 20, padding: "2rem 1.75rem",
    width: "100%", maxWidth: 400,
    border: "1px solid #1a3d1a",
  },
  logo: { fontSize: "1.5rem", fontWeight: 900, color: "#22c55e", marginBottom: "0.25rem", letterSpacing: "-0.02em" },
  baslik: { fontSize: "1.2rem", fontWeight: 700, color: "#ecfdf5", marginBottom: "0.5rem" },
  alt: { fontSize: "0.875rem", color: "#3b6040", marginBottom: "0.25rem" },
  btnGoogle: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    gap: "0.75rem", padding: "0.875rem", borderRadius: 12, border: "1px solid #1a3d1a",
    background: "#0f2a0f", fontSize: "0.95rem", fontWeight: 700, color: "#ecfdf5", cursor: "pointer",
  },
  ayirac: { display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0" },
  cizgi: { flex: 1, height: 1, background: "#1a3d1a" },
  ayiracYazi: { fontSize: "0.8rem", color: "#3b6040", flexShrink: 0 },
  tab: { display: "flex", background: "#060f06", borderRadius: 10, padding: 4, marginBottom: "1.25rem", border: "1px solid #1a3d1a" },
  tabBtn: {
    flex: 1, padding: "0.5rem", border: "none", background: "transparent",
    borderRadius: 7, fontSize: "0.875rem", fontWeight: 700, color: "#3b6040", cursor: "pointer",
  },
  tabAktif: { background: "#0f2a0f", color: "#22c55e" },
  form: { display: "flex", flexDirection: "column", gap: "0.6rem" },
  etiket: { fontSize: "0.82rem", fontWeight: 700, color: "#86efac" },
  input: {
    padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid #1a3d1a",
    fontSize: "0.95rem", outline: "none", color: "#ecfdf5", background: "#060f06",
  },
  hata: {
    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8,
    padding: "0.6rem 0.875rem", fontSize: "0.82rem", color: "#fca5a5",
  },
  btnAna: {
    marginTop: "0.5rem", padding: "0.9rem", borderRadius: 12, border: "none",
    background: "#22c55e", color: "#fff", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer",
    letterSpacing: "-0.01em",
  },
};