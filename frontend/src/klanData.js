import { doc, updateDoc, getDoc, addDoc, collection, serverTimestamp, increment, deleteField } from "firebase/firestore";
import { db } from "./firebase";

function buHafta() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return d.getUTCFullYear() + "-W" + Math.ceil((((d - y) / 86400000) + 1) / 7);
}
const buAy = () => new Date().toISOString().slice(0, 7);

export const KLAN_HAFTALIK = [
  { id: "kh1", baslik: "Klan Tarama Fırtınası", aciklama: "50 atık tara",      hedef: 50, xp: 1000, sayac: "tarama"      },
  { id: "kh2", baslik: "Klan Video Şampiyonu",  aciklama: "10 doğru video at", hedef: 10, xp: 1500, sayac: "video_dogru" },
];

export const KLAN_AYLIK = [
  { id: "ka1", baslik: "Klan Aylık Maratonu",  aciklama: "200 atık tara",      hedef: 200, xp: 5000, sayac: "tarama"      },
  { id: "ka2", baslik: "Klan Video Efsanesi",  aciklama: "40 doğru video at",  hedef: 40,  xp: 8000, sayac: "video_dogru" },
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

export async function klanGorevGuncelle(klanId, sayaclar) {
  const snap = await getDoc(doc(db, "klanlar", klanId));
  if (!snap.exists()) return { tamamlananlar: [], xpKazanildi: 0 };
  const klan = snap.data();

  const h = taze(klan.gorev_h, "hafta", buHafta());
  const a = taze(klan.gorev_a, "ay", buAy());

  const t = sayaclar.tarama      || 0;
  const v = sayaclar.video_dogru || 0;
  h.tarama += t; h.video_dogru += v;
  a.tarama += t; a.video_dogru += v;

  const tamamlananlar = [
    ...yeniTamamlananlar(h, KLAN_HAFTALIK),
    ...yeniTamamlananlar(a, KLAN_AYLIK),
  ];
  const xp = tamamlananlar.reduce((s, g) => s + g.xp, 0);

  const guncelleme = { gorev_h: h, gorev_a: a };
  if (xp > 0) guncelleme.toplamPuan = increment(xp);
  await updateDoc(doc(db, "klanlar", klanId), guncelleme);

  return { tamamlananlar, xpKazanildi: xp };
}

export async function klanOlustur(userId, userAdi, form, setProfil) {
  const klanRef = await addDoc(collection(db, "klanlar"), {
    ad: form.ad.trim(),
    tag: form.tag.trim().toUpperCase(),
    aciklama: form.aciklama.trim(),
    kurucuId: userId,
    kurucuAdi: userAdi,
    olusturmaTarihi: serverTimestamp(),
    uyeSayisi: 1,
    toplamPuan: 0,
  });
  await updateDoc(doc(db, "users", userId), {
    klanId: klanRef.id,
    klanAdi: form.ad.trim(),
    klanTag: form.tag.trim().toUpperCase(),
  });
  setProfil(prev => ({
    ...prev,
    klanId: klanRef.id,
    klanAdi: form.ad.trim(),
    klanTag: form.tag.trim().toUpperCase(),
  }));
  return klanRef.id;
}

export async function klanaKatil(userId, klan, setProfil) {
  await updateDoc(doc(db, "klanlar", klan.id), { uyeSayisi: increment(1) });
  await updateDoc(doc(db, "users", userId), {
    klanId: klan.id, klanAdi: klan.ad, klanTag: klan.tag,
  });
  setProfil(prev => ({ ...prev, klanId: klan.id, klanAdi: klan.ad, klanTag: klan.tag }));
}

export async function klantanAyril(userId, klanId, setProfil) {
  await updateDoc(doc(db, "klanlar", klanId), { uyeSayisi: increment(-1) });
  await updateDoc(doc(db, "users", userId), {
    klanId: deleteField(), klanAdi: deleteField(), klanTag: deleteField(),
  });
  setProfil(prev => {
    const yeni = { ...prev };
    delete yeni.klanId; delete yeni.klanAdi; delete yeni.klanTag;
    return yeni;
  });
}
