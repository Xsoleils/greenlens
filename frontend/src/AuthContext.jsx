// frontend/src/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [kullanici, setKullanici] = useState(undefined); // undefined = yükleniyor
  const [profil, setProfil] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setKullanici(user);
      if (user) {
        // Firestore'dan profil çek
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfil(snap.data());
        } else {
          setProfil(null); // Yeni kullanıcı — profil tamamlama gerekiyor
        }
      } else {
        setProfil(null);
      }
    });
    return unsub;
  }, []);

  const cikisYap = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ kullanici, profil, setProfil, cikisYap }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
