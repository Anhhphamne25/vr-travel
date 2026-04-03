# 🌏 VR Travel Demo (AI + FastAPI + WebVR)

Ứng dụng nhận diện địa danh từ ảnh bằng AI và hiển thị trải nghiệm VR 360°.
Frontend và Backend chạy chung trên **FastAPI (1 port duy nhất)**.

---

## 🚀 Features

* 📸 Nhận diện địa danh từ ảnh
* 🧠 Sử dụng CLIP
* 🔎 So sánh vector bằng NumPy (cosine similarity)
* 🌐 Hiển thị VR 360° (cube map)
* ⚡ Không sử dụng database (chỉ dùng `.npy`)

---

## 📁 Project Structure

```
vr-travel-main/
│
├── backend/
│   ├── main.py
│   ├── routes/
│   │   ├── recognize.py
│   │   └── place.py
│   ├── services/
│   │   ├── clip_service.py
│   │   ├── pipeline.py
│   │   └── vector_store.py
│
├── frontend/
│   ├── index.html
│   ├── places.json
│   └── assets/
│
├── data/
│   ├── places/          # dataset ảnh
│   ├── vectors.npy      # embedding
│   └── vr/              # ảnh VR 360
│
├── scripts/
│   └── ingest.py
│
├── requirements.txt
└── README.md
```

---

## ⚙️ Setup

### 1. Cài dependencies

```bash
pip install -r requirements.txt
```

---

### ⚠️ 2. Cài CLIP (bắt buộc)

Project sử dụng CLIP từ OpenAI.

Chạy lệnh sau:

```bash
pip install git+https://github.com/openai/CLIP.git
```

Ngoài ra cần đảm bảo có:

```bash
pip install torch torchvision
```

---

## 🧠 AI Model

* Model: `ViT-B/32` (CLIP)
* Encode ảnh → vector 512 chiều

👉 Lần đầu chạy sẽ tự động tải model (~400–500MB)

---

## 📁 Dataset Structure

Dữ liệu ảnh nằm trong:

```
data/places/
```

Cấu trúc:

```
data/
└── places/
    ├── halong/
    │   ├── 000.jpg
    │   ├── 001.jpg
    │   └── ... (~30 ảnh)
    │
    ├── hanoi/
    │   └── ...
    │
    └── danang/
        └── ...
```

### 📌 Quy tắc

* Mỗi folder = 1 địa danh
* Mỗi địa danh ≈ 30 ảnh khung cảnh
* Tên folder = label dùng để trả kết quả

---

## 🧠 Build Vector

Chạy script:

```bash
python scripts/ingest.py
```

Kết quả:

```
data/vectors.npy
```

* Shape: `(N, 512)`
* N = tổng số ảnh

---

## 🚀 Run Application

```bash
uvicorn backend.main:app --reload
```

---

## 🌐 Truy cập

```
http://localhost:8000
```

✔ Không cần chạy frontend riêng
✔ Không có port khác

---

## 🔌 API Endpoints

### 📸 POST /recognize

* Input: ảnh
* Output:

```json
{
  "place": "halong"
}
```

---

### 📍 GET /place/{name}

* Trả về thông tin từ `places.json`

---

## 🧩 System Flow

```
User chụp ảnh
        ↓
Frontend gửi /recognize
        ↓
Backend:
    - Encode ảnh bằng CLIP
    - Load vectors.npy
    - Tính cosine similarity
        ↓
Trả về place
        ↓
Frontend hiển thị VR
```

---

## 🧮 Vector Search

Không dùng database — dùng NumPy:

```python
sims = vectors @ query_vector
best_idx = sims.argmax()
```

---

## 🖼️ VR Data Format

Mỗi địa danh gồm 6 ảnh:

```
px.jpg  py.jpg  pz.jpg
nx.jpg  ny.jpg  nz.jpg
```

👉 Dùng để render không gian 360° (cube map)

---

## ⚠️ Common Issues

### ❌ 404 Not Found

* Sai đường dẫn frontend trong `main.py`
* Chưa mount StaticFiles đúng

---

### ❌ CLIP không load được

* Chưa cài:

```bash
pip install git+https://github.com/openai/CLIP.git
```

---

### ❌ Nhận diện sai

* Dataset ít / không đa dạng
* Ảnh input khác domain

---

## 💡 Notes

* Frontend được serve bằng:

```python
app.mount("/", StaticFiles(directory=FRONTEND_PATH, html=True))
```

* Không cần CORS vì cùng origin

---

## 🔥 Future Improvements

* Normalize vector để tăng accuracy
* Top-K prediction
* Dùng FAISS nếu dataset lớn
* Nâng cấp UI (Three.js / React)
