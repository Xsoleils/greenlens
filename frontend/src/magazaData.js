import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "./firebase";

export const ITEMLAR = [
  // Şapkalar
  { id: "sap_yaprak", emoji: "🌿", ad: "Yaprak Taç",     fiyat: 150,  slot: "sapka"    },
  { id: "sap_mezun",  emoji: "🎓", ad: "Mezun Şapkası",  fiyat: 200,  slot: "sapka"    },
  { id: "sap_kas",    emoji: "🪖", ad: "Kahraman Kaskı", fiyat: 500,  slot: "sapka"    },
  { id: "sap_fopor",  emoji: "🎩", ad: "Fötr Şapka",     fiyat: 300,  slot: "sapka"    },
  { id: "sap_tac",    emoji: "👑", ad: "Kral Tacı",       fiyat: 1000, slot: "sapka"    },
  // Kıyafetler
  { id: "kiy_yesil",  emoji: "🦺", ad: "Yeşilci Yeleği", fiyat: 150,  slot: "kiyafet"  },
  { id: "kiy_spor",   emoji: "🧥", ad: "Spor Ceket",      fiyat: 200,  slot: "kiyafet"  },
  { id: "kiy_dovus",  emoji: "🥋", ad: "Dövüş Üstadı",   fiyat: 400,  slot: "kiyafet"  },
  { id: "kiy_super",  emoji: "🎽", ad: "Süper Kahraman",  fiyat: 500,  slot: "kiyafet"  },
  // Aksesuarlar
  { id: "aks_geri",   emoji: "♻️", ad: "Geri Dönüşüm",   fiyat: 100,  slot: "aksesuar" },
  { id: "aks_dunya",  emoji: "🌍", ad: "Dünya Koruyucu",  fiyat: 800,  slot: "aksesuar" },
  { id: "aks_enrj",   emoji: "⚡", ad: "Enerji Aurası",   fiyat: 600,  slot: "aksesuar" },
];

export const BOOSTLAR = [
  { id: "boost_x15", ad: "XP x1.5", emoji: "🔥", aciklama: "48 saat boyunca görev XP'si 1.5 katı", sure: 48, fiyat: 200, carpan: 1.5 },
  { id: "boost_x2",  ad: "XP x2",   emoji: "⚡", aciklama: "24 saat boyunca görev XP'si 2 katı",   sure: 24, fiyat: 300, carpan: 2   },
];

export const SLOT_ETIKETLER = {
  sapka:    "Şapka",
  kiyafet:  "Kıyafet",
  aksesuar: "Aksesuar",
};

export function itemBul(id) {
  return ITEMLAR.find(i => i.id === id) || null;
}

export function aktifBoost(profil) {
  const b = profil?.aktif_boost;
  if (!b || !b.bitis || Date.now() > b.bitis) return null;
  return b;
}

export function boostKalanSure(bitis) {
  const ms = bitis - Date.now();
  if (ms <= 0) return "Süresi doldu";
  const saat = Math.floor(ms / 3600000);
  const dak  = Math.floor((ms % 3600000) / 60000);
  return saat > 0 ? `${saat}s ${dak}dk` : `${dak}dk`;
}

export async function itemSatinAl(userId, item, profil, setProfil) {
  if ((profil?.toplamPuan || 0) < item.fiyat) throw new Error("Yeterli XP yok");
  const sahip = profil?.sahip_itemlar || [];
  if (sahip.includes(item.id)) throw new Error("Zaten sahipsin");
  const yeniSahip = [...sahip, item.id];
  await updateDoc(doc(db, "users", userId), {
    toplamPuan: increment(-item.fiyat),
    sahip_itemlar: yeniSahip,
  });
  setProfil(prev => ({
    ...prev,
    toplamPuan: (prev.toplamPuan || 0) - item.fiyat,
    sahip_itemlar: yeniSahip,
  }));
}

export async function itemGiy(userId, item, profil, setProfil) {
  const giyili = { ...(profil?.giyili_itemlar || {}), [item.slot]: item.id };
  await updateDoc(doc(db, "users", userId), { giyili_itemlar: giyili });
  setProfil(prev => ({ ...prev, giyili_itemlar: giyili }));
}

export async function itemCikar(userId, slot, profil, setProfil) {
  const giyili = { ...(profil?.giyili_itemlar || {}) };
  delete giyili[slot];
  await updateDoc(doc(db, "users", userId), { giyili_itemlar: giyili });
  setProfil(prev => ({ ...prev, giyili_itemlar: giyili }));
}

export async function boostSatinAl(userId, boost, profil, setProfil) {
  if ((profil?.toplamPuan || 0) < boost.fiyat) throw new Error("Yeterli XP yok");
  const bitis = Date.now() + boost.sure * 3600 * 1000;
  const aktif = { boostId: boost.id, ad: boost.ad, emoji: boost.emoji, carpan: boost.carpan, bitis };
  await updateDoc(doc(db, "users", userId), {
    toplamPuan: increment(-boost.fiyat),
    aktif_boost: aktif,
  });
  setProfil(prev => ({
    ...prev,
    toplamPuan: (prev.toplamPuan || 0) - boost.fiyat,
    aktif_boost: aktif,
  }));
}
