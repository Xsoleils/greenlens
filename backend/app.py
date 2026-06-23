from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types
import base64
import os
import json
import time

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError(".env dosyasinda GEMINI_API_KEY bulunamadi!")

client = genai.Client(api_key=API_KEY)

# 2026 güncel ücretsiz modeller — sırayla denenir
MODELLER = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
]

ATIK_PROMPT = """Sen bir geri dönüşüm uzmanısın. Bu görüntüdeki atığı analiz et.

SADECE şu JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "nesne": "görüntüdeki nesnenin adı (Türkçe)",
  "kategori": "Plastik veya Cam veya Kagit-Karton veya Metal veya Organik veya Elektronik veya Tibbi veya Karisik",
  "kutu_rengi": "Mavi veya Yesil veya Sari veya Gri veya Kirmizi",
  "kutu_adi": "Kağıt Kutusu veya Cam Kutusu veya Plastik-Metal Kutusu veya Karışık Çöp veya Tehlikeli Atık",
  "aciklama": "tek cümle Türkçe açıklama"
}

Kutu rengi (Türkiye standardı):
Mavi=kağıt/karton, Yeşil=cam, Sarı=plastik/metal, Gri=karışık, Kırmızı=tehlikeli/elektronik"""

VIDEO_PROMPT = """Sen bir geri dönüşüm hakemi ve uzmanısın.
Bu video kareleri bir kullanıcının çöp atma eylemini gösteriyor.

SADECE şu JSON formatında yanıt ver:
{
  "nesne": "atılan nesnenin adı",
  "dogru_kutu": "Mavi veya Yesil veya Sari veya Gri veya Kirmizi",
  "kullanilan_kutu": "Mavi veya Yesil veya Sari veya Gri veya Kirmizi veya Belirsiz",
  "dogru_mu": true veya false,
  "puan": sayı,
  "mesaj": "Türkçe geri bildirim",
  "aciklama": "Türkçe açıklama"
}

PUAN KURALLARI (kesinlikle uygula):
- Çöp kutusu görünmüyorsa → kullanilan_kutu=Belirsiz, dogru_mu=false, puan=0
- Doğru kutuya attıysa → puan 80-100
- Yanlış kutuya attıysa → puan 0-10
- Belirsiz/anlaşılamıyorsa → puan 0
Asla 50 puan verme — ya doğru (80+) ya yanlış (0-10) ya belirsiz (0)."""


def gemini_cagir_gorsel(image_bytes, prompt):
    """Görsel analizi - rate limit yönetimi ile"""
    son_hata = None
    for model in MODELLER:
        try:
            response = client.models.generate_content(
                model=model,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_bytes(
                                data=image_bytes,
                                mime_type="image/jpeg"
                            ),
                            types.Part.from_text(text=prompt),
                        ]
                    )
                ]
            )
            print(f"[OK] Model: {model}")
            return response.text
        except Exception as e:
            hata_str = str(e)
            print(f"[HATA] {model}: {hata_str[:100]}")
            if "429" in hata_str:
                # Rate limit — bir sonraki modeli dene
                time.sleep(1)
                son_hata = e
                continue
            elif "503" in hata_str or "unavailable" in hata_str.lower():
                son_hata = e
                continue
            else:
                raise e
    raise son_hata


def gemini_cagir_coklu_gorsel(kareler, prompt):
    """Birden fazla görsel gönder (video kareleri için)"""
    son_hata = None
    for model in MODELLER:
        try:
            parts = []
            for kare in kareler:
                parts.append(types.Part.from_bytes(
                    data=kare,
                    mime_type="image/jpeg"
                ))
            parts.append(types.Part.from_text(text=prompt))

            response = client.models.generate_content(
                model=model,
                contents=[
                    types.Content(role="user", parts=parts)
                ]
            )
            print(f"[OK] Video analizi - Model: {model}")
            return response.text
        except Exception as e:
            hata_str = str(e)
            print(f"[HATA] {model}: {hata_str[:100]}")
            if "429" in hata_str or "503" in hata_str:
                time.sleep(2)
                son_hata = e
                continue
            else:
                raise e
    raise son_hata


def json_temizle(text):
    """API yanıtından JSON çıkar"""
    text = text.strip()
    if "```" in text:
        parcalar = text.split("```")
        for parca in parcalar:
            parca = parca.strip()
            if parca.startswith("json"):
                parca = parca[4:].strip()
            if parca.startswith("{"):
                return parca
    return text


@app.route("/scan", methods=["POST"])
def scan():
    """Tek fotoğraf analizi — atığın nereye gideceğini söyler"""
    try:
        data = request.get_json()
        if not data or "image" not in data:
            return jsonify({"error": "Görüntü bulunamadı"}), 400

        image_data = data["image"]
        if "," in image_data:
            image_data = image_data.split(",")[1]
        image_bytes = base64.b64decode(image_data)

        text = gemini_cagir_gorsel(image_bytes, ATIK_PROMPT)
        text = json_temizle(text)
        result = json.loads(text)
        return jsonify(result)

    except json.JSONDecodeError as e:
        return jsonify({"error": "JSON parse hatası", "ham": text}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        hata = str(e)
        if "429" in hata:
            return jsonify({"error": "API limiti doldu, lütfen 1 dakika bekle ve tekrar dene."}), 429
        return jsonify({"error": hata}), 500


@app.route("/video-analiz", methods=["POST"])
def video_analiz():
    """Video karelerini analiz et — doğru kutuya atıldı mı?"""
    try:
        data = request.get_json()
        if not data or "kareler" not in data:
            return jsonify({"error": "Video kareleri bulunamadı"}), 400

        kareler_b64 = data["kareler"]  # max 3 kare bekliyoruz
        if len(kareler_b64) == 0:
            return jsonify({"error": "En az 1 kare gerekli"}), 400

        # Base64 → bytes
        kareler_bytes = []
        for kare in kareler_b64[:3]:  # max 3 kare (kota tasarrufu)
            if "," in kare:
                kare = kare.split(",")[1]
            kareler_bytes.append(base64.b64decode(kare))

        text = gemini_cagir_coklu_gorsel(kareler_bytes, VIDEO_PROMPT)
        text = json_temizle(text)
        result = json.loads(text)
        return jsonify(result)

    except json.JSONDecodeError as e:
        return jsonify({"error": "JSON parse hatası", "ham": text}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        hata = str(e)
        if "429" in hata:
            return jsonify({"error": "API limiti doldu, lütfen 1 dakika bekle ve tekrar dene."}), 429
        return jsonify({"error": hata}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "mesaj": "GreenLens backend çalışıyor"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)