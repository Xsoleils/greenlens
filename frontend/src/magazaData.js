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
  // İsim Renkleri
  { id: "renk_kirmizi", ad: "Kırmızı",   fiyat: 250,  slot: "isim_renk", renk: "#ef4444" },
  { id: "renk_mavi",    ad: "Mavi",       fiyat: 250,  slot: "isim_renk", renk: "#3b82f6" },
  { id: "renk_mor",     ad: "Mor",        fiyat: 300,  slot: "isim_renk", renk: "#a855f7" },
  { id: "renk_turuncu", ad: "Turuncu",    fiyat: 300,  slot: "isim_renk", renk: "#f97316" },
  { id: "renk_pembe",   ad: "Pembe",      fiyat: 350,  slot: "isim_renk", renk: "#ec4899" },
  { id: "renk_altin",   ad: "Altın",      fiyat: 700,  slot: "isim_renk", gradient: "linear-gradient(90deg,#f59e0b,#fcd34d,#f59e0b)" },
  { id: "renk_gokusg",  ad: "Gökkuşağı",  fiyat: 1500, slot: "isim_renk", gradient: "linear-gradient(90deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#a855f7)" },
  { id: "renk_holo",    ad: "Hologram",   fiyat: 3000, slot: "isim_renk", gradient: "linear-gradient(90deg,#67e8f9,#a78bfa,#f0abfc,#67e8f9)" },
  // İsim Yazı Tipi
  { id: "font_kalin",   ad: "Kalın",        fiyat: 150, slot: "isim_font", fontWeight: "900" },
  { id: "font_italik",  ad: "İtalik",       fiyat: 150, slot: "isim_font", fontStyle: "italic" },
  { id: "font_super",   ad: "Kalın İtalik", fiyat: 250, slot: "isim_font", fontWeight: "900", fontStyle: "italic" },
];

export const BOOSTLAR = [
  { id: "boost_x15", ad: "XP x1.5", emoji: "🔥", aciklama: "48 saat boyunca görev XP'si 1.5 katı", sure: 48, fiyat: 200, carpan: 1.5 },
  { id: "boost_x2",  ad: "XP x2",   emoji: "⚡", aciklama: "24 saat boyunca görev XP'si 2 katı",   sure: 24, fiyat: 300, carpan: 2   },
];

export const SLOT_ETIKETLER = {
  sapka:     "Şapka",
  kiyafet:   "Kıyafet",
  aksesuar:  "Aksesuar",
  isim_renk: "İsim Rengi",
  isim_font: "İsim Yazısı",
};

export function itemBul(id) {
  return ITEMLAR.find(i => i.id === id) || null;
}

export function getIsimStili(giyiliItemlar) {
  const renkItem = itemBul(giyiliItemlar?.isim_renk);
  const fontItem = itemBul(giyiliItemlar?.isim_font);
  const style = {};
  if (renkItem?.gradient) {
    style.background           = renkItem.gradient;
    style.WebkitBackgroundClip = "text";
    style.WebkitTextFillColor  = "transparent";
    style.backgroundClip       = "text";
  } else if (renkItem?.renk) {
    style.color = renkItem.renk;
  }
  if (fontItem?.fontWeight) style.fontWeight = fontItem.fontWeight;
  if (fontItem?.fontStyle)  style.fontStyle  = fontItem.fontStyle;
  return style;
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
