# GreenLens — Akıllı Atık Asistanı

Fotoğraf veya video çekerek atıkları sınıflandıran, puanlama ve oyunlaştırma ile geri dönüşüm alışkanlığı kazandıran mobil-first web uygulaması. Hedef kitle: 18 yaş altı.

**Canlı:** [greenlens-ne6t.onrender.com](https://greenlens-ne6t.onrender.com) · Frontend: Vercel · Backend: Render

---

## Özellikler

- **AI Analiz** — Kamera veya galeriden fotoğraf/video yükle, Gemini Vision atığı tanır ve geri dönüşüm talimatı verir
- **Puanlama** — Her tarama XP kazandırır; takma adlar 8 seviyede yükselir (Yeni Başlayan → GreenLens Efsanesi)
- **Liderboard** — Mahalle / İlçe / İl / Türkiye bazlı sıralama
- **Görevler** — Günlük, haftalık, aylık XP ödüllü görevler
- **Klan** — Topluluk oluştur, klan görevleri yap, klan liderboard'u
- **Harita** — Yakındaki atık toplama noktalarını gör (Leaflet.js)
- **Mağaza** — XP ile avatar ve kıyafet satın al
- **Rehber** — Geri dönüşüm kategorileri ve ipuçları

---

## Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19, Vite, Axios |
| Backend | Python, Flask |
| AI | Google Gemini Vision API (`google-genai`) |
| Auth | Firebase Authentication (Google OAuth + e-posta) |
| Veritabanı | Firestore |
| Deploy | Vercel (frontend) · Render (backend) |

---

## Proje Yapısı

```
greenlens/
├── backend/
│   └── app.py              # Flask API (/scan, /video-analiz, /health)
└── frontend/
    └── src/
        ├── App.jsx          # Ana uygulama, kamera, tab yönetimi
        ├── App.css          # Tüm stiller (dark green tema)
        ├── Login.jsx        # Google OAuth + e-posta girişi, profil tamamlama
        ├── Onboarding.jsx   # İl/ilçe/mahalle seçimi
        ├── Liderboard.jsx   # Mahalle → Türkiye sıralama
        ├── Profil.jsx       # Kullanıcı profili, rozetler
        ├── Bilgi.jsx        # Geri dönüşüm rehberi
        ├── Gorevler.jsx     # Günlük/haftalık/aylık görevler
        ├── Klan.jsx         # Klan oluştur/katıl, klan görevleri
        ├── Harita.jsx       # Atık noktaları haritası
        ├── Magaza.jsx       # XP mağazası
        ├── takmaAdlar.js    # 8 seviye takma ad sistemi
        ├── AuthContext.jsx  # Firebase auth state
        └── firebase.js      # Firebase config
```

---

## Kurulum

### Gereksinimler

- Node.js 18+
- Python 3.10+
- Firebase projesi (Auth + Firestore etkin)
- Google Gemini API anahtarı

### Backend

```bash
cd backend
pip install -r requirements.txt
```

`.env` oluştur:

```env
GEMINI_API_KEY=your_key_here
```

```bash
python app.py
```

### Frontend

```bash
cd frontend
npm install
```

`.env` oluştur:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_BACKEND_URL=http://localhost:5000
```

```bash
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/scan` | Fotoğraf analizi (base64) |
| `POST` | `/video-analiz` | Video analizi |
| `GET` | `/health` | Sunucu sağlık kontrolü |

---

## Firestore Şeması

```
users/{uid}
  displayName, email, il, ilce, mahalle
  toplamPuan, taramaSayisi

taramalar/{id}
  userId, tip (fotograf | video), puan, nesne, tarih, mahalle
```

---

## Takma Ad Seviyeleri

| XP | Takma Ad |
|----|----------|
| 0 | Yeni Başlayan |
| 50 | Çevreci |
| 150 | Geri Dönüşçü |
| 300 | Eko Savaşçı |
| 600 | Yeşil Kahraman |
| 1000 | Doğa Koruyucu |
| 2000 | Çevre Ustası |
| 5000 | GreenLens Efsanesi |

---

## Katkıda Bulunma

1. Repo'yu fork'la
2. Feature branch aç: `git checkout -b feature/yeni-ozellik`
3. Commit at: `git commit -m 'feat: yeni özellik'`
4. Push at: `git push origin feature/yeni-ozellik`
5. Pull Request aç

---

## Lisans

MIT
