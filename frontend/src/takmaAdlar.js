export const TAKMA_ADLAR = [
  { min: 5000, unvan: "GreenLens Efsanesi", renk: "#f59e0b" },
  { min: 2000, unvan: "Çevre Ustası",       renk: "#a855f7" },
  { min: 1000, unvan: "Doğa Koruyucu",      renk: "#3b82f6" },
  { min: 600,  unvan: "Yeşil Kahraman",     renk: "#22c55e" },
  { min: 300,  unvan: "Eko Savaşçı",        renk: "#16a34a" },
  { min: 150,  unvan: "Geri Dönüşçü",       renk: "#0ea5e9" },
  { min: 50,   unvan: "Çevreci",            renk: "#84cc16" },
  { min: 0,    unvan: "Yeni Başlayan",       renk: "#3b6040" },
];

export function getTakmaAd(puan = 0) {
  return TAKMA_ADLAR.find(t => puan >= t.min) || TAKMA_ADLAR[TAKMA_ADLAR.length - 1];
}

export function getSonrakiTakmaAd(puan = 0) {
  const idx = TAKMA_ADLAR.findIndex(t => puan >= t.min);
  return idx > 0 ? TAKMA_ADLAR[idx - 1] : null;
}
