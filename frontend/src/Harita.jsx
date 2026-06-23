import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

function KonumGuncelle({ konum }) {
  const map = useMap();
  useEffect(() => {
    if (konum) map.flyTo([konum.lat, konum.lng], 15, { duration: 1.2 });
  }, [konum, map]);
  return null;
}

export default function Harita() {
  const { kullanici } = useAuth();
  const [konum, setKonum]           = useState(null);
  const [noktalar, setNoktalar]     = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [konumHata, setKonumHata]   = useState(null);

  const taramalariYukle = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "taramalar"), orderBy("tarih", "desc"), limit(500))
      );
      const pts = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(t => t.konum?.lat && t.konum?.lng);
      setNoktalar(pts);
    } catch (err) {
      console.error("Tarama noktaları yüklenemedi:", err);
    }
  }, []);

  const konumAl = useCallback(() => {
    if (!navigator.geolocation) {
      setKonumHata("Tarayıcın konum özelliğini desteklemiyor.");
      return;
    }
    setKonumHata(null);
    setYukleniyor(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setKonum({ lat: coords.latitude, lng: coords.longitude });
        await taramalariYukle();
        setYukleniyor(false);
      },
      () => {
        setKonumHata("Konum izni verilmedi. Tarayıcı ayarlarından izin ver.");
        setYukleniyor(false);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }, [taramalariYukle]);

  useEffect(() => { konumAl(); }, []);

  if (!konum && yukleniyor) return (
    <div className="harita-durum-ekran">
      <div className="spinner" />
      <div className="harita-durum-yazi">Konum alınıyor...</div>
      <div className="harita-durum-alt">Lütfen konum iznine izin ver</div>
    </div>
  );

  if (konumHata) return (
    <div className="harita-durum-ekran">
      <div className="harita-durum-ikon">📍</div>
      <div className="harita-durum-yazi">{konumHata}</div>
      <button className="btn-ana" style={{ maxWidth: 220 }} onClick={konumAl}>
        Tekrar Dene
      </button>
    </div>
  );

  if (!konum) return null;

  const beniimNoktalar = noktalar.filter(t => t.userId === kullanici?.uid);
  const digerNoktalar  = noktalar.filter(t => t.userId !== kullanici?.uid);

  return (
    <div className="harita-ekran">

      <div className="harita-wrap">
        <MapContainer
          center={[konum.lat, konum.lng]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <KonumGuncelle konum={konum} />

          {/* Kullanıcının mevcut konumu */}
          <CircleMarker
            center={[konum.lat, konum.lng]}
            radius={10}
            pathOptions={{ color: "#fff", weight: 2.5, fillColor: "#ef4444", fillOpacity: 1 }}
          >
            <Popup closeButton={false}>
              <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Buradasın</div>
            </Popup>
          </CircleMarker>

          {/* Diğer kullanıcıların taramaları — mavi */}
          {digerNoktalar.map(t => (
            <CircleMarker
              key={t.id}
              center={[t.konum.lat, t.konum.lng]}
              radius={6}
              pathOptions={{ color: "#fff", weight: 1, fillColor: "#3b82f6", fillOpacity: 0.75 }}
            >
              <Popup closeButton={false}>
                <div style={{ fontSize: "0.82rem", minWidth: 100 }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{t.nesne || "Atık"}</div>
                  <div style={{ color: "#555", fontSize: "0.75rem" }}>
                    {t.tip === "video" ? (t.dogru_mu ? "Doğru kutu" : "Yanlış kutu") : "Fotoğraf tarama"}
                    {" · "}{t.puan} puan
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Kendi taramalarım — yeşil (üstte görünsün) */}
          {beniimNoktalar.map(t => (
            <CircleMarker
              key={t.id}
              center={[t.konum.lat, t.konum.lng]}
              radius={8}
              pathOptions={{ color: "#fff", weight: 2, fillColor: "#22c55e", fillOpacity: 0.95 }}
            >
              <Popup closeButton={false}>
                <div style={{ fontSize: "0.82rem", minWidth: 100 }}>
                  <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 2 }}>Senin tarama</div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.nesne || "Atık"}</div>
                  <div style={{ color: "#555", fontSize: "0.75rem" }}>
                    {t.tip === "video" ? (t.dogru_mu ? "Doğru kutu" : "Yanlış kutu") : "Fotoğraf tarama"}
                    {" · "}{t.puan} puan
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Alt bilgi çubuğu */}
      <div className="harita-alt-bar">
        <div className="harita-alt-legend">
          <div className="harita-legend-item">
            <span className="harita-legend-nokta" style={{ background: "#22c55e" }} />
            <span>Senin ({beniimNoktalar.length})</span>
          </div>
          <div className="harita-legend-item">
            <span className="harita-legend-nokta" style={{ background: "#3b82f6" }} />
            <span>Topluluk ({digerNoktalar.length})</span>
          </div>
        </div>
        <div className="harita-alt-sag">
          <button
            className="harita-guncelle-btn"
            onClick={konumAl}
            disabled={yukleniyor}
          >
            {yukleniyor ? "..." : "Güncelle"}
          </button>
        </div>
      </div>

    </div>
  );
}
