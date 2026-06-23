import { useState } from "react";
import { useAuth } from "./AuthContext";
import { GUNLUK_GOREVLER, HAFTALIK_GOREVLER, AYLIK_GOREVLER } from "./gorevData";

const SEKMELER = [
  { key: "gunluk",   label: "Günlük"   },
  { key: "haftalik", label: "Haftalık" },
  { key: "aylik",    label: "Aylık"    },
];

function IlerlemeBar({ mevcut, hedef }) {
  const yuzde = Math.min(100, Math.round((mevcut / hedef) * 100));
  return (
    <div className="gorev-bar-wrap">
      <div className="gorev-bar" style={{ width: `${yuzde}%` }} />
    </div>
  );
}

function GorevKart({ gorev, ilerleme }) {
  const mevcut    = ilerleme?.[gorev.sayac] || 0;
  const tamamlandi = ilerleme?.bitis?.includes(gorev.id) || false;
  const yuzde     = Math.min(100, Math.round((mevcut / gorev.hedef) * 100));

  return (
    <div className={`gorev-kart ${tamamlandi ? "tamamlandi" : ""}`}>
      <div className="gorev-kart-ust">
        <div className="gorev-kart-sol">
          <div className="gorev-baslik">{gorev.baslik}</div>
          <div className="gorev-aciklama">{gorev.aciklama}</div>
        </div>
        <div className={`gorev-xp-chip ${tamamlandi ? "kazanildi" : ""}`}>
          {tamamlandi ? "✓" : `+${gorev.xp} XP`}
        </div>
      </div>
      {!tamamlandi && (
        <div className="gorev-alt">
          <IlerlemeBar mevcut={mevcut} hedef={gorev.hedef} />
          <div className="gorev-sayac">
            <span style={{ color: "var(--yesil)", fontWeight: 800 }}>{mevcut}</span>
            {" / "}{gorev.hedef}
            <span style={{ marginLeft: 6, color: "var(--soluk)" }}>({yuzde}%)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Gorevler() {
  const { profil } = useAuth();
  const [sekme, setSekme] = useState("gunluk");

  const harita = {
    gunluk:   { gorevler: GUNLUK_GOREVLER,   ilerleme: profil?.gorev_g },
    haftalik: { gorevler: HAFTALIK_GOREVLER, ilerleme: profil?.gorev_h },
    aylik:    { gorevler: AYLIK_GOREVLER,    ilerleme: profil?.gorev_a },
  };
  const { gorevler, ilerleme } = harita[sekme];
  const tamamSayisi = gorevler.filter(g => ilerleme?.bitis?.includes(g.id)).length;
  const toplamXP    = gorevler.reduce((s, g) => s + g.xp, 0);
  const kazanilmisXP = gorevler
    .filter(g => ilerleme?.bitis?.includes(g.id))
    .reduce((s, g) => s + g.xp, 0);

  return (
    <div className="gorevler-ekran">

      <div className="gorevler-baslik-alan">
        <div className="gorevler-baslik">Görevler</div>
        <div className="gorevler-altbaslik">
          {tamamSayisi}/{gorevler.length} tamamlandı · {kazanilmisXP}/{toplamXP} XP
        </div>
      </div>

      <div className="lider-sekmeler">
        {SEKMELER.map(s => (
          <button
            key={s.key}
            className={`sekme-btn ${sekme === s.key ? "aktif" : ""}`}
            onClick={() => setSekme(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="gorevler-liste">
        {gorevler.map(g => (
          <GorevKart key={g.id} gorev={g} ilerleme={ilerleme} />
        ))}

        <div className="gorev-reset-bilgi">
          {sekme === "gunluk"   && "Her gece yarısı sıfırlanır"}
          {sekme === "haftalik" && "Her Pazartesi sıfırlanır"}
          {sekme === "aylik"    && "Her ayın 1'inde sıfırlanır"}
        </div>
      </div>

    </div>
  );
}
