import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "./firebase";
import { aktifBoost } from "./magazaData";
import { bolgeGuncelle } from "./bolgeData";

const bugunTarih = () => new Date().toISOString().slice(0, 10);
const buAy       = () => new Date().toISOString().slice(0, 7);
function buHafta() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return d.getUTCFullYear() + "-W" + Math.ceil((((d - y) / 86400000) + 1) / 7);
}

export const GUNLUK_GOREVLER = [
  { id: "g1", baslik: "Günlük Tarama",  aciklama: "3 atık tara",          hedef: 3,  xp: 0,    sayac: "tarama"      },
  { id: "g2", baslik: "Video Ustası",   aciklama: "1 video doğru atma",   hedef: 1,  xp: 100,  sayac: "video_dogru" },
];

export const HAFTALIK_GOREVLER = [
  { id: "h1", baslik: "Haftalık Çevreci", aciklama: "20 atık tara",        hedef: 20, xp: 0,   sayac: "tarama"      },
  { id: "h2", baslik: "Video Serisi",     aciklama: "5 doğru video atma",  hedef: 5,  xp: 500, sayac: "video_dogru" },
];

export const AYLIK_GOREVLER = [
  { id: "a1", baslik: "Aylık Kahraman",  aciklama: "80 atık tara",         hedef: 80, xp: 0,    sayac: "tarama"      },
  { id: "a2", baslik: "Aylık Efsane",    aciklama: "20 doğru video atma",  hedef: 20, xp: 2000, sayac: "video_dogru" },
];

function taze(mevcut, donemKey, buDonem) {
  if (!mevcut || mevcut[donemKey] !== buDonem)
    return { [donemKey]: buDonem, tarama: 0, video_dogru: 0, bitis: [] };
  return { ...mevcut, bitis: Array.isArray(mevcut.bitis) ? [...mevcut.bitis] : [] };
}

function yeniTamamlananlar(ilerleme, gorevler) {
  const yeni = [];
  for (const g of gorevler) {
    if (!ilerleme.bitis.includes(g.id) && (ilerleme[g.sayac] || 0) >= g.hedef) {
      ilerleme.bitis.push(g.id);
      yeni.push(g);
    }
  }
  return yeni;
}

export async function gorevGuncelle(userId, sayaclar, setProfil, mevcutProfil) {
  const g = taze(mevcutProfil?.gorev_g, "tarih", bugunTarih());
  const h = taze(mevcutProfil?.gorev_h, "hafta",  buHafta());
  const a = taze(mevcutProfil?.gorev_a, "ay",     buAy());

  const t = sayaclar.tarama      || 0;
  const v = sayaclar.video_dogru || 0;
  g.tarama += t; g.video_dogru += v;
  h.tarama += t; h.video_dogru += v;
  a.tarama += t; a.video_dogru += v;

  const tamamlananlar = [
    ...yeniTamamlananlar(g, GUNLUK_GOREVLER),
    ...yeniTamamlananlar(h, HAFTALIK_GOREVLER),
    ...yeniTamamlananlar(a, AYLIK_GOREVLER),
  ];
  const boost = aktifBoost(mevcutProfil);
  const xpHam = tamamlananlar.reduce((s, go) => s + go.xp, 0);
  const xp    = boost && xpHam > 0 ? Math.round(xpHam * boost.carpan) : xpHam;

  const guncelleme = { gorev_g: g, gorev_h: h, gorev_a: a };
  if (xp > 0) {
    guncelleme.toplamPuan = increment(xp);
    bolgeGuncelle(mevcutProfil?.il, mevcutProfil?.mahalle, xp);
  }
  await updateDoc(doc(db, "users", userId), guncelleme);

  setProfil(prev => ({
    ...prev,
    gorev_g: g, gorev_h: h, gorev_a: a,
    toplamPuan: (prev?.toplamPuan || 0) + xp,
  }));

  return { tamamlananlar, xpKazanildi: xp };
}
