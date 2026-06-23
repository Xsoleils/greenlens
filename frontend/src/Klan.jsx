import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { KLAN_HAFTALIK, KLAN_AYLIK, klanOlustur, klanaKatil, klantanAyril } from "./klanData";

function IlerlemeBar({ mevcut, hedef }) {
  const yuzde = Math.min(100, Math.round((mevcut / hedef) * 100));
  return (
    <div className="gorev-bar-wrap">
      <div className="gorev-bar" style={{ width: `${yuzde}%` }} />
    </div>
  );
}

function KlanGorevKart({ gorev, ilerleme }) {
  const mevcut     = ilerleme?.[gorev.sayac] || 0;
  const tamamlandi = ilerleme?.bitis?.includes(gorev.id) || false;
  return (
    <div className={`gorev-kart ${tamamlandi ? "tamamlandi" : ""}`} style={{ padding: "0.75rem 1rem" }}>
      <div className="gorev-kart-ust">
        <div className="gorev-kart-sol">
          <div className="gorev-baslik" style={{ fontSize: "0.83rem" }}>{gorev.baslik}</div>
          <div className="gorev-aciklama">{gorev.aciklama}</div>
        </div>
        <div className={`gorev-xp-chip ${tamamlandi ? "kazanildi" : ""}`}>
          {tamamlandi ? "✓" : ""}
        </div>
      </div>
      {!tamamlandi && (
        <div className="gorev-alt">
          <IlerlemeBar mevcut={mevcut} hedef={gorev.hedef} />
          <div className="gorev-sayac">
            <span style={{ color: "var(--yesil)", fontWeight: 800 }}>{mevcut}</span>
            {" / "}{gorev.hedef}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Klan Detay (üye olduğum klan) ── */
function KlanDetay({ onAyril }) {
  const { kullanici, profil, setProfil } = useAuth();
  const [klan, setKlan]           = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [ayrilyior, setAyriliyor] = useState(false);

  useEffect(() => {
    const yukle = async () => {
      const snap = await getDoc(doc(db, "klanlar", profil.klanId));
      if (snap.exists()) setKlan({ id: snap.id, ...snap.data() });
      setYukleniyor(false);
    };
    yukle();
  }, [profil.klanId]);

  const ayril = async () => {
    setAyriliyor(true);
    await klantanAyril(kullanici.uid, profil.klanId, setProfil);
    onAyril();
  };

  if (yukleniyor) return <div className="klan-yukleniyor"><div className="spinner" /></div>;
  if (!klan) return null;

  return (
    <div className="klan-detay">
      <div className="klan-detay-hero">
        <div className="klan-tag-buyuk">[{klan.tag}]</div>
        <div className="klan-adi-buyuk">{klan.ad}</div>
        {klan.aciklama && <div className="klan-aciklama">{klan.aciklama}</div>}
        <div className="klan-meta">
          <span>{klan.uyeSayisi} üye</span>
          <span className="klan-meta-nokta">·</span>
          <span style={{ color: "var(--yesil)", fontWeight: 800 }}>
            {(klan.toplamPuan || 0).toLocaleString("tr-TR")} XP
          </span>
        </div>
      </div>

      <div className="klan-gorevler-bolum">
        <div className="klan-gorevler-baslik">Haftalık Klan Görevleri</div>
        {KLAN_HAFTALIK.map(g => <KlanGorevKart key={g.id} gorev={g} ilerleme={klan.gorev_h} />)}
      </div>

      <div className="klan-gorevler-bolum">
        <div className="klan-gorevler-baslik">Aylık Klan Görevleri</div>
        {KLAN_AYLIK.map(g => <KlanGorevKart key={g.id} gorev={g} ilerleme={klan.gorev_a} />)}
      </div>

      <button
        className="klan-ayril-btn"
        onClick={ayril}
        disabled={ayrilyior}
      >
        {ayrilyior ? "Ayrılıyor..." : "Klandan Ayrıl"}
      </button>
    </div>
  );
}

/* ── Klan Ara & Katıl ── */
function KlanAra({ onKatil }) {
  const { kullanici, setProfil } = useAuth();
  const [klanlar, setKlanlar]       = useState([]);
  const [aramaTermi, setAramaTermi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [katiliyorId, setKatiliyorId] = useState(null);

  useEffect(() => {
    const yukle = async () => {
      const snap = await getDocs(
        query(collection(db, "klanlar"), orderBy("toplamPuan", "desc"), limit(50))
      );
      setKlanlar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setYukleniyor(false);
    };
    yukle();
  }, []);

  const katil = async (klan) => {
    setKatiliyorId(klan.id);
    await klanaKatil(kullanici.uid, klan, setProfil);
    onKatil();
  };

  const filtre = aramaTermi.trim().toLowerCase();
  const liste  = klanlar.filter(k =>
    !filtre ||
    k.ad.toLowerCase().includes(filtre) ||
    k.tag.toLowerCase().includes(filtre)
  );

  return (
    <div className="klan-ara">
      <input
        className="klan-ara-input"
        placeholder="Klan adı veya tag ara..."
        value={aramaTermi}
        onChange={e => setAramaTermi(e.target.value)}
      />
      {yukleniyor ? (
        <div className="klan-yukleniyor"><div className="spinner" /></div>
      ) : liste.length === 0 ? (
        <div className="klan-bos">Klan bulunamadı.</div>
      ) : (
        <div className="klan-ara-liste">
          {liste.map(k => (
            <div key={k.id} className="klan-ara-satir">
              <div className="klan-ara-bilgi">
                <div className="klan-ara-adi">
                  <span className="klan-tag-kucuk">[{k.tag}]</span> {k.ad}
                </div>
                <div className="klan-ara-meta">
                  {k.uyeSayisi} üye · {(k.toplamPuan || 0).toLocaleString("tr-TR")} XP
                </div>
              </div>
              <button
                className="klan-katil-btn"
                onClick={() => katil(k)}
                disabled={!!katiliyorId}
              >
                {katiliyorId === k.id ? "..." : "Katıl"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Klan Oluştur ── */
function KlanOlustur({ onOlustur }) {
  const { kullanici, profil, setProfil } = useAuth();
  const [form, setForm]           = useState({ ad: "", tag: "", aciklama: "" });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata]           = useState("");

  const olustur = async () => {
    if (!form.ad.trim()) { setHata("Klan adı gerekli."); return; }
    if (!form.tag.trim() || form.tag.trim().length < 2) { setHata("Tag en az 2 karakter olmalı."); return; }
    setHata(""); setYukleniyor(true);
    try {
      await klanOlustur(kullanici.uid, profil?.displayName || "Kullanıcı", form, setProfil);
      onOlustur();
    } catch {
      setHata("Klan oluşturulamadı, tekrar dene.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="klan-form">
      <div className="klan-form-alan">
        <label className="klan-form-etiket">Klan Adı</label>
        <input
          className="klan-form-input"
          placeholder="Yeşil Aslanlar"
          maxLength={30}
          value={form.ad}
          onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
        />
      </div>
      <div className="klan-form-alan">
        <label className="klan-form-etiket">Tag (2-5 karakter)</label>
        <input
          className="klan-form-input klan-tag-input"
          placeholder="YA"
          maxLength={5}
          value={form.tag}
          onChange={e => setForm(f => ({ ...f, tag: e.target.value.toUpperCase() }))}
        />
      </div>
      <div className="klan-form-alan">
        <label className="klan-form-etiket">Açıklama (isteğe bağlı)</label>
        <input
          className="klan-form-input"
          placeholder="Klanın hakkında kısa bir açıklama..."
          maxLength={80}
          value={form.aciklama}
          onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
        />
      </div>
      {hata && <div className="klan-hata">{hata}</div>}
      <button className="btn-ana" onClick={olustur} disabled={yukleniyor}>
        {yukleniyor ? "Oluşturuluyor..." : "Klan Oluştur"}
      </button>
    </div>
  );
}

/* ── Ana Klan Modal ── */
export default function Klan({ acik, onKapat }) {
  const { profil } = useAuth();
  const [gorunum, setGorunum] = useState("ana"); // ana | olustur | ara

  useEffect(() => {
    if (acik) setGorunum("ana");
  }, [acik]);

  if (!acik) return null;

  const baslik = {
    ana:     profil?.klanId ? "Klanım" : "Klan",
    olustur: "Klan Oluştur",
    ara:     "Klana Katıl",
  }[gorunum];

  return (
    <div className="modal-overlay" onClick={onKapat}>
      <div className="modal-icerik" onClick={e => e.stopPropagation()}>

        {/* Modal başlık */}
        <div className="klan-modal-header">
          {gorunum !== "ana" && (
            <button className="klan-geri-btn" onClick={() => setGorunum("ana")}>←</button>
          )}
          <div className="klan-modal-baslik">{baslik}</div>
          <button className="modal-kapat-btn" style={{ position: "static" }} onClick={onKapat}>✕</button>
        </div>

        <div className="klan-modal-icerik">
          {/* Kullanıcının klanı varsa */}
          {profil?.klanId && gorunum === "ana" && (
            <KlanDetay onAyril={onKapat} />
          )}

          {/* Klanı yoksa, seçim ekranı */}
          {!profil?.klanId && gorunum === "ana" && (
            <div className="klan-secim">
              <div className="klan-secim-aciklama">
                Bir klana katıl veya kendi klanını oluştur. Klan görevlerini birlikte tamamla, topluluk sıralamasına gir!
              </div>
              <button className="btn-ana" onClick={() => setGorunum("olustur")}>
                Klan Oluştur
              </button>
              <button className="btn-ikincil" onClick={() => setGorunum("ara")}>
                Klana Katıl
              </button>
            </div>
          )}

          {gorunum === "olustur" && (
            <KlanOlustur onOlustur={onKapat} />
          )}

          {gorunum === "ara" && (
            <KlanAra onKatil={onKapat} />
          )}
        </div>

      </div>
    </div>
  );
}
