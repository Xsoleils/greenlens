import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { useAuth } from "./AuthContext";
import Login, { ProfilTamamla } from "./Login";
import Liderboard from "./Liderboard";
import Profil from "./Profil";
import Bilgi from "./Bilgi";
import Harita from "./Harita";
import Gorevler from "./Gorevler";
import { gorevGuncelle } from "./gorevData";
import { klanGorevGuncelle } from "./klanData";
import { bolgeGuncelle } from "./bolgeData";
import { db } from "./firebase";
import Onboarding from "./Onboarding";
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";

const API = "https://greenlens-ne6t.onrender.com";

const KUTU_RENK = {
  Mavi:     { bg: "#1d4ed8", label: "Mavi Kutu",     emoji: "🔵" },
  Yesil:    { bg: "#15803d", label: "Yeşil Kutu",    emoji: "🟢" },
  Sari:     { bg: "#b45309", label: "Sarı Kutu",     emoji: "🟡" },
  Gri:      { bg: "#374151", label: "Gri Kutu",      emoji: "⚫" },
  Kirmizi:  { bg: "#b91c1c", label: "Kırmızı Kutu",  emoji: "🔴" },
  Belirsiz: { bg: "#374151", label: "Belirsiz",       emoji: "❓" },
};

// ── SVG İkonlar ──────────────────────────────────────────────────────────────
const IkonKamera = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IkonSiralama = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IkonProfil = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IkonGaleri = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);
const IkonFlip = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);
const IkonBilgi = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" strokeLinecap="round"/>
    <line x1="12" y1="12" x2="12" y2="16"/>
  </svg>
);
const IkonGorev = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const IkonHarita = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// ── Yardımcı fonksiyonlar ─────────────────────────────────────────────────────
async function videodenKareAl(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.addEventListener("loadedmetadata", () => {
      const dur = video.duration || 1;
      const zamanlar = [dur * 0.1, dur * 0.5, dur * 0.9];
      const kareler = [];
      let i = 0;
      const sonraki = () => { video.currentTime = zamanlar[i]; };
      video.addEventListener("seeked", () => {
        const c = document.createElement("canvas");
        c.width = video.videoWidth; c.height = video.videoHeight;
        c.getContext("2d").drawImage(video, 0, 0);
        kareler.push(c.toDataURL("image/jpeg", 0.7));
        i++;
        if (i < zamanlar.length) sonraki();
        else { URL.revokeObjectURL(url); resolve(kareler); }
      });
      sonraki();
    });
    video.addEventListener("error", () => { URL.revokeObjectURL(url); reject(new Error("Video okunamadı")); });
  });
}

async function videoHashHesapla(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function gorselDosyayiDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function taramaKaydet(userId, mahalle, sehir, taramaData, konum) {
  try {
    const veri = {
      userId, mahalle: mahalle || "", sehir: sehir || "",
      tarih: serverTimestamp(), ...taramaData,
    };
    if (konum?.lat && konum?.lng) veri.konum = konum;
    await addDoc(collection(db, "taramalar"), veri);
    await updateDoc(doc(db, "users", userId), {
      toplamPuan: increment(taramaData.puan || 0),
      taramaSayisi: increment(1),
    });
  } catch (err) { console.error("Firestore hatası:", err); }
}

function KutuBadge({ renk }) {
  const info = KUTU_RENK[renk] || KUTU_RENK.Gri;
  return (
    <span style={{
      background: info.bg, color: "#fff", borderRadius: 99,
      padding: "0.35rem 0.875rem", fontSize: "0.82rem", fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      {info.emoji} {info.label}
    </span>
  );
}

function PuanDairesi({ puan }) {
  const renk = puan >= 70 ? "#22c55e" : puan >= 40 ? "#f59e0b" : "#ef4444";
  const emoji = puan >= 70 ? "🎉" : puan >= 40 ? "😐" : "❌";
  return (
    <div style={{ textAlign: "center", padding: "0.75rem 0" }}>
      <div style={{
        width: 90, height: 90, borderRadius: "50%",
        border: `5px solid ${renk}`, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", margin: "0 auto 0.5rem",
        background: renk + "18",
      }}>
        <span style={{ fontSize: "1.4rem" }}>{emoji}</span>
        <span style={{ fontSize: "1.3rem", fontWeight: 900, color: renk }}>{puan}</span>
      </div>
      <span style={{ fontSize: "0.75rem", color: "var(--soluk)" }}>puan</span>
    </div>
  );
}

// ── Ana Bileşen ───────────────────────────────────────────────────────────────
export default function App() {
  const { kullanici, profil, setProfil } = useAuth();

  const [aktifTab, setAktifTab]     = useState("tara");
  const [ekran, setEkran]           = useState("kamera"); // kamera | yukleniyor | sonuc
  const [mod, setMod]               = useState("fotograf"); // fotograf | video
  const [sonuc, setSonuc]           = useState(null);
  const [hata, setHata]             = useState(null);
  const [toplamPuan, setToplamPuan] = useState(0);
  const [taramaSayisi, setTaramaSayisi] = useState(0);
  const [kayitVar, setKayitVar]       = useState(false);
  const [kayitSuresi, setKayitSuresi] = useState(0);
  const [gorevBildirim, setGorevBildirim] = useState([]);
  const [bilgiAcik, setBilgiAcik]     = useState(false);
  const [onboardingAcik, setOnboardingAcik] = useState(
    () => !localStorage.getItem("gl_onboarding_done")
  );

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const galerisecRef = useRef(null);
  const kayitRef    = useRef(null);
  const streamRef   = useRef(null);
  const timerRef    = useRef(null);
  const tarafRef    = useRef("environment");
  const konumRef    = useRef(null);

  // ── Kamera ───────────────────────────────────────────────────────────────────
  const kameraKapat = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    clearInterval(timerRef.current);
    kayitRef.current = null;
  }, []);

  const kameraAc = useCallback(async (taraf) => {
    const t = taraf || tarafRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: t }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setHata(null);
    } catch {
      setHata("Kamera açılamadı — galerinizden dosya seçin.");
    }
  }, []);

  const kameraFlip = useCallback(async () => {
    const yeni = tarafRef.current === "environment" ? "user" : "environment";
    tarafRef.current = yeni;
    kameraKapat();
    setTimeout(() => kameraAc(yeni), 100);
  }, [kameraKapat, kameraAc]);

  // Kamera ekranına gelince otomatik aç + GPS arka planda al
  useEffect(() => {
    if (aktifTab === "tara" && ekran === "kamera") {
      setTimeout(() => kameraAc(), 100);
      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => { konumRef.current = { lat: coords.latitude, lng: coords.longitude }; },
        () => {},
        { timeout: 8000, maximumAge: 30000, enableHighAccuracy: false }
      );
    }
  }, [aktifTab, ekran]);

  useEffect(() => () => { kameraKapat(); }, [kameraKapat]);

  // ── Tab değiştir ──────────────────────────────────────────────────────────────
  const tabDegistir = (tab) => {
    if (tab === aktifTab) return;
    if (aktifTab === "tara") {
      kameraKapat();
      clearInterval(timerRef.current);
      setKayitVar(false);
    }
    setAktifTab(tab);
  };

  // ── Video analiz gönder ───────────────────────────────────────────────────────
  const videoAnalizeGonder = useCallback(async (kareler, videoHash = null) => {
    if (!kareler.length) { setHata("Kare alınamadı."); setEkran("kamera"); return; }
    setEkran("yukleniyor");
    try {
      const res = await axios.post(`${API}/video-analiz`, { kareler });
      const data = res.data;
      const puan = data.puan || 0;
      setSonuc({ tip: "video", ...data });
      setTaramaSayisi(s => s + 1);
      if (kullanici) {
        await taramaKaydet(kullanici.uid, profil?.mahalle, profil?.sehir, {
          tip: "video", nesne: data.nesne || "",
          dogru_kutu: data.dogru_kutu || "", kullanilan_kutu: data.kullanilan_kutu || "",
          dogru_mu: data.dogru_mu || false, puan,
        }, konumRef.current);
        if (videoHash) {
          await setDoc(doc(db, "video_hashes", videoHash), {
            userId: kullanici.uid, tarih: serverTimestamp(),
          });
        }
        const sayaclar = { tarama: 1, video_dogru: data.dogru_mu ? 1 : 0 };
        const { tamamlananlar, xpKazanildi } = await gorevGuncelle(
          kullanici.uid, sayaclar, setProfil, profil
        );
        if (puan > 0) bolgeGuncelle(profil?.il, profil?.mahalle, puan);
        setToplamPuan(p => p + puan + xpKazanildi);
        if (tamamlananlar.length > 0) setGorevBildirim(tamamlananlar);
        if (profil?.klanId) klanGorevGuncelle(profil.klanId, sayaclar);
      }
      setEkran("sonuc");
    } catch (e) {
      setHata(e.response?.data?.error || "Bağlantı hatası");
      setEkran("kamera");
      kameraAc();
    }
  }, [kameraAc, kullanici, profil]);

  // ── Fotoğraf çek ─────────────────────────────────────────────────────────────
  const fotografCek = useCallback(async () => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    kameraKapat();
    setEkran("yukleniyor");
    try {
      const res  = await axios.post(`${API}/scan`, { image: dataUrl });
      const data = res.data;
      setSonuc({ tip: "fotograf", ...data });
      setTaramaSayisi(s => s + 1);
      if (kullanici) {
        await taramaKaydet(kullanici.uid, profil?.mahalle, profil?.sehir, {
          tip: "fotograf", nesne: data.nesne || "", kategori: data.kategori || "",
          kutu_rengi: data.kutu_rengi || "", dogru_mu: true, puan: 0,
        }, konumRef.current);
        const { tamamlananlar, xpKazanildi } = await gorevGuncelle(
          kullanici.uid, { tarama: 1 }, setProfil, profil
        );
        setToplamPuan(p => p + xpKazanildi);
        if (tamamlananlar.length > 0) setGorevBildirim(tamamlananlar);
        if (profil?.klanId) klanGorevGuncelle(profil.klanId, { tarama: 1 });
      }
      setEkran("sonuc");
    } catch (e) {
      setHata(e.response?.data?.error || "Bağlantı hatası");
      setEkran("kamera");
      kameraAc();
    }
  }, [kameraKapat, kameraAc, kullanici, profil, setProfil]);

  // ── Video kayıt ───────────────────────────────────────────────────────────────
  const kayitBaslat = useCallback(() => {
    if (!streamRef.current) return;
    const kareler = [];
    setKayitVar(true); setKayitSuresi(0);
    let sure = 0;
    timerRef.current = setInterval(() => {
      sure += 1; setKayitSuresi(sure);
      if (sure % 2 === 0 && kareler.length < 3) {
        const c = document.createElement("canvas"), v = videoRef.current;
        c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0);
        kareler.push(c.toDataURL("image/jpeg", 0.7));
      }
      if (sure >= 6) {
        clearInterval(timerRef.current);
        setKayitVar(false);
        kameraKapat();
        videoAnalizeGonder(kareler);
      }
    }, 1000);
    kayitRef.current = {
      durdur: () => {
        clearInterval(timerRef.current);
        setKayitVar(false);
        kameraKapat();
        videoAnalizeGonder(kareler);
      }
    };
  }, [kameraKapat, videoAnalizeGonder]);

  const kayitDurdur = useCallback(() => { kayitRef.current?.durdur(); }, []);

  // ── Galeriden seç (foto veya video) ──────────────────────────────────────────
  const galeriden = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    kameraKapat();
    setHata(null); setSonuc(null); setEkran("yukleniyor");
    try {
      if (file.type.startsWith("video/")) {
        let videoHash = null;
        try {
          videoHash = await videoHashHesapla(file);
          const hashDoc = await getDoc(doc(db, "video_hashes", videoHash));
          if (hashDoc.exists()) {
            setHata("Bu video daha önce sisteme yüklendi, tekrar yükleyemezsin.");
            setEkran("kamera");
            setTimeout(() => kameraAc(), 100);
            return;
          }
        } catch {
          // hash hesabı başarısız olursa engel koyma, devam et
        }
        const kareler = await videodenKareAl(file);
        await videoAnalizeGonder(kareler, videoHash);
      } else {
        const dataUrl = await gorselDosyayiDataUrl(file);
        const res  = await axios.post(`${API}/scan`, { image: dataUrl });
        const data = res.data;
        setSonuc({ tip: "fotograf", ...data });
        setTaramaSayisi(s => s + 1);
        if (kullanici) {
          await taramaKaydet(kullanici.uid, profil?.mahalle, profil?.sehir, {
            tip: "fotograf", nesne: data.nesne || "", kategori: data.kategori || "",
            kutu_rengi: data.kutu_rengi || "", dogru_mu: true, puan: 0,
          }, konumRef.current);
          const { tamamlananlar, xpKazanildi } = await gorevGuncelle(
            kullanici.uid, { tarama: 1 }, setProfil, profil
          );
          setToplamPuan(p => p + xpKazanildi);
          if (tamamlananlar.length > 0) setGorevBildirim(tamamlananlar);
          if (profil?.klanId) klanGorevGuncelle(profil.klanId, { tarama: 1 });
        }
        setEkran("sonuc");
      }
    } catch {
      setHata("Dosya işlenemedi.");
      setEkran("kamera");
      setTimeout(() => kameraAc(), 100);
    }
  }, [kameraKapat, kameraAc, videoAnalizeGonder, kullanici, profil]);

  const yeniTarama = () => {
    setSonuc(null); setHata(null); setGorevBildirim([]);
    setEkran("kamera");
  };

  // ── Capture butonu ────────────────────────────────────────────────────────────
  const captureAl = () => {
    if (mod === "fotograf") {
      fotografCek();
    } else {
      if (kayitVar) kayitDurdur();
      else kayitBaslat();
    }
  };

  // ── Auth Guard ────────────────────────────────────────────────────────────────
  if (kullanici === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div className="spinner" />
      </div>
    );
  }
  if (!kullanici) return <Login />;
  if (!profil?.mahalle) return <ProfilTamamla onTamamla={p => setProfil(p)} />;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="logo-alan">
          <div className="logo-img-wrap">
            <img src="/logo.png" alt="GreenLens" className="logo-img" />
          </div>
          <span className="logo-yazi">GreenLens</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="header-rehber-btn" onClick={() => setBilgiAcik(true)} title="Rehber">
            <IkonBilgi size={18} />
          </button>
          <div className="puan-chip">
            {(profil?.toplamPuan || 0) + toplamPuan} XP
          </div>
        </div>
      </header>

      {/* İlk açılış onboarding */}
      {onboardingAcik && (
        <Onboarding onBitti={() => {
          localStorage.setItem("gl_onboarding_done", "1");
          setOnboardingAcik(false);
        }} />
      )}

      {/* Rehber modal */}
      {bilgiAcik && (
        <div className="modal-overlay" onClick={() => setBilgiAcik(false)}>
          <div className="modal-icerik" onClick={e => e.stopPropagation()}>
            <div className="modal-kapat-btn" onClick={() => setBilgiAcik(false)}>✕</div>
            <Bilgi />
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="main">

        {/* ── TARA TAB ── */}
        {aktifTab === "tara" && (
          <div className="tara-wrap">

            {/* KAMERA */}
            {ekran === "kamera" && (
              <>
                {hata && <div className="kamera-hata-bar">{hata}</div>}

                <div className="kamera-alan">
                  <video ref={videoRef} autoPlay playsInline muted className="video-el" />

                  {/* Köşe çerçevesi */}
                  <div className="kose">
                    <span /><span />
                  </div>

                  {/* Mod toggle */}
                  {!kayitVar && (
                    <div className="mod-toggle">
                      <button className={`mod-toggle-btn ${mod === "fotograf" ? "aktif" : ""}`} onClick={() => setMod("fotograf")}>FOTO</button>
                      <button className={`mod-toggle-btn ${mod === "video" ? "aktif" : ""}`} onClick={() => setMod("video")}>VİDEO</button>
                    </div>
                  )}

                  {/* Kayıt göstergesi */}
                  {kayitVar && (
                    <div className="kayit-indicator">
                      <span className="kayit-nokta" />
                      <span className="kayit-sure">{kayitSuresi}s / 6s</span>
                    </div>
                  )}
                </div>

                <canvas ref={canvasRef} style={{ display: "none" }} />

                {/* Kamera kontrolleri */}
                <div className="kamera-kontroller">
                  <button
                    className="kamera-btn-yan"
                    onClick={() => galerisecRef.current?.click()}
                    title="Galeriden seç"
                  >
                    <IkonGaleri size={20} />
                  </button>
                  <input
                    ref={galerisecRef}
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    onChange={galeriden}
                  />

                  <button
                    className={`kamera-btn-cek ${kayitVar ? "video-aktif" : ""}`}
                    onClick={captureAl}
                    title={mod === "fotograf" ? "Fotoğraf çek" : kayitVar ? "Durdur" : "Kayıt başlat"}
                  />

                  <button className="kamera-btn-yan" onClick={kameraFlip} title="Kamera çevir">
                    <IkonFlip size={20} />
                  </button>
                </div>
              </>
            )}

            {/* YÜKLENİYOR */}
            {ekran === "yukleniyor" && (
              <div className="yukleniyor-ekran">
                <div className="spinner" />
                <div className="yukleniyor-yazi">{mod === "video" ? "Video analiz ediliyor..." : "Atık tanınıyor..."}</div>
                <div className="yukleniyor-alt">Yapay zeka inceliyor</div>
              </div>
            )}

            {/* SONUÇ */}
            {ekran === "sonuc" && sonuc && (
              <div className="sonuc-ekran">
                <div className="sonuc-baslik-alan">
                  <div className="sonuc-baslik">
                    {sonuc.tip === "video"
                      ? (sonuc.dogru_mu ? "🎉 Doğru Attın!" : "❌ Yanlış Kutu")
                      : "✅ Analiz Tamamlandı"}
                  </div>
                </div>

                {sonuc.tip === "fotograf" && (
                  <>
                    <div className="nesne-kart">
                      <div className="nesne-etiket">Tespit Edilen Nesne</div>
                      <div className="nesne-adi">{sonuc.nesne}</div>
                    </div>
                    <div className="kutu-kart" style={{ background: (KUTU_RENK[sonuc.kutu_rengi] || KUTU_RENK.Gri).bg }}>
                      <div className="kutu-kart-ic">
                        <span className="kutu-kart-ikon">🗑️</span>
                        <div>
                          <div className="kutu-kart-label">Bu kutuya at</div>
                          <div className="kutu-kart-adi">{sonuc.kutu_adi || sonuc.kutu_rengi + " Kutu"}</div>
                        </div>
                      </div>
                    </div>
                    <div className="aciklama-kart">
                      <div className="aciklama-metin">{sonuc.aciklama}</div>
                    </div>
                    {gorevBildirim.length > 0 && (
                      <div className="gorev-tamamlandi-banner">
                        {gorevBildirim.map(g => (
                          <div key={g.id} className="gorev-tamamlandi-satir">
                            <span>Görev tamamlandı: {g.baslik}</span>
                            <span className="gorev-tamamlandi-xp">+{g.xp} XP</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {sonuc.tip === "video" && (
                  <>
                    <PuanDairesi puan={sonuc.puan || 0} />
                    <div className="karsilastirma">
                      <div className="k-satir"><span className="k-etiket">Atılan Nesne</span><span className="k-deger">{sonuc.nesne}</span></div>
                      <div className="k-satir"><span className="k-etiket">Doğru Kutu</span><KutuBadge renk={sonuc.dogru_kutu} /></div>
                      <div className="k-satir"><span className="k-etiket">Kullanılan Kutu</span><KutuBadge renk={sonuc.kullanilan_kutu} /></div>
                    </div>
                    <div className="aciklama-kart" style={{ borderLeftColor: sonuc.dogru_mu ? "#22c55e" : "#ef4444" }}>
                      <div className="aciklama-metin">{sonuc.mesaj}</div>
                      {sonuc.aciklama && <div className="aciklama-alt">{sonuc.aciklama}</div>}
                    </div>
                  </>
                )}

                {gorevBildirim.length > 0 && (
                  <div className="gorev-tamamlandi-banner">
                    {gorevBildirim.map(g => (
                      <div key={g.id} className="gorev-tamamlandi-satir">
                        <span>Görev tamamlandı: {g.baslik}</span>
                        <span className="gorev-tamamlandi-xp">+{g.xp} XP</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="sonuc-butonlar">
                  <button className="btn-ana" onClick={yeniTarama}>Tekrar Tara</button>
                  <button className="btn-ikincil" onClick={() => tabDegistir("siralama")}>Sıralamayı Gör</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SIRALAMA TAB ── */}
        {aktifTab === "siralama" && <Liderboard />}

        {/* ── GÖREVLER TAB ── */}
        {aktifTab === "gorevler" && <Gorevler />}

        {/* ── HARİTA TAB ── */}
        {aktifTab === "harita" && <Harita />}

        {/* ── PROFİL TAB ── */}
        {aktifTab === "profil" && (
          <Profil oturum={{ toplamPuan, taramaSayisi }} />
        )}

      </main>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        {[
          { key: "tara",     label: "Tara",    Ikon: IkonKamera },
          { key: "gorevler", label: "Görevler",Ikon: IkonGorev },
          { key: "siralama", label: "Sıralama",Ikon: IkonSiralama },
          { key: "harita",   label: "Harita",  Ikon: IkonHarita },
          { key: "profil",   label: "Profil",  Ikon: IkonProfil },
        ].map(({ key, label, Ikon }) => (
          <button
            key={key}
            className={`nav-item ${aktifTab === key ? "aktif" : ""}`}
            onClick={() => tabDegistir(key)}
          >
            <Ikon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
