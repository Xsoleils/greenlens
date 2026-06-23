import { doc, setDoc, increment } from "firebase/firestore";
import { db } from "./firebase";

function bolgeKey(str) {
  return str.toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\s+/g, "_");
}

export async function bolgeGuncelle(il, mahalle, xp) {
  if (!il || xp <= 0) return;
  try {
    await setDoc(
      doc(db, "iller", bolgeKey(il)),
      { ad: il, toplamPuan: increment(xp) },
      { merge: true }
    );
    if (mahalle) {
      await setDoc(
        doc(db, "mahalleler", bolgeKey(il) + "__" + bolgeKey(mahalle)),
        { ad: mahalle, il, toplamPuan: increment(xp) },
        { merge: true }
      );
    }
  } catch (err) {
    console.error("Bölge güncelleme hatası:", err);
  }
}
