# Plant AI - Explainable AI for ML-Driven Plant Disease Diagnosis

## 🌿 Project Overview

A full-stack, zero-cost web application for detecting plant diseases from leaf images using AI/ML, with multilingual support, voice output, and a smart chatbot.

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Auth & DB | Firebase Authentication + Firestore |
| Backend | FastAPI (Python) |
| ML Model | TensorFlow/Keras (MobileNetV2) |
| Voice | Web Speech API (Browser built-in) |
| Translation | Local JSON files |
| Chatbot | Rule-based knowledge base |

## 📁 Folder Structure

```
Plant-project/
├── frontend/
│   └── src/
│       ├── components/       # Navbar, ChatBot
│       ├── context/          # AuthContext (Firebase Auth)
│       ├── data/             # diseaseDatabase.js (PlantVillage knowledge base)
│       ├── locales/          # translations.json (EN, TA, HI, TE, KN)
│       └── pages/            # Home, Login, Register, Diagnoses, Result, History, Profile, Library
├── backend/
│   ├── app/main.py           # FastAPI server
│   ├── train.py              # MobileNetV2 training script
│   ├── model/                # (created after training) .h5 + class_indices.json
│   ├── dataset/PlantVillage/ # Kaggle dataset goes here
│   └── requirements.txt
└── firestore.rules           # Firestore security rules
```

---

## ⚡ Getting Started

### 1. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### 3. Train the ML Model

**Step 1:** Download the dataset from Kaggle:
- **URL**: https://www.kaggle.com/datasets/emmarex/plantdisease
- Extract and place the `PlantVillage` folder inside `backend/dataset/`

```
backend/dataset/PlantVillage/
    Apple___Apple_scab/       ← images here
    Apple___Black_rot/
    Tomato___healthy/
    ...
```

**Step 2:** Run training:
```bash
cd backend
python train.py
```

Training takes 20–60 minutes depending on your hardware. Output:
- `backend/model/plant_disease_model.h5`
- `backend/model/class_indices.json`

### 4. Start the Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
# Runs at http://localhost:8000
```

---

## 🗄️ Firestore Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `plant-project-330a0`
3. Go to **Firestore Database** → Create database (production mode)
4. Go to **Rules** tab and paste the contents of `firestore.rules`
5. Enable **Google Sign-In** in Authentication → Sign-in method

---

## 📊 Firestore DB Schema

**Collection: `users`**
```
{
  uid: string,
  name: string,
  email: string,
  createdAt: ISO string,
  profileImageUrl: string | null,
  totalDiagnoses: number
}
```

**Collection: `diagnoses`**
```
{
  uid: string,
  plantName: string,
  diseaseName: string,
  label: string,            ← raw model label
  confidence: number,       ← 0-100
  causes: string,
  symptoms: string,
  treatment: string,
  prevention: string,
  imageBase64: string,      ← base64 image data
  timestamp: ISO string
}
```

---

## 🌐 Multilingual Support

Languages supported: **English, Tamil (தமிழ்), Hindi (हिन्दी), Telugu (తెలుగు), Kannada (ಕನ್ನಡ)**

- UI labels translated via `src/locales/translations.json`
- Voice output uses the **Browser Web Speech API** (`SpeechSynthesis`)
- Available on Result page and in the Chatbot

---

## 🤖 ML Model Details

- **Architecture**: MobileNetV2 (pretrained on ImageNet)
- **Fine-tuned on**: PlantVillage dataset (~54,000 images, 38 classes)
- **Input**: 224×224 RGB image
- **Output**: 38-class softmax (disease categories)
- **Expected Accuracy**: ~90–95% on validation set

---

## ⚠️ Limitations (Free-Tier / No-Cost Approach)

1. **Model size**: MobileNetV2 is lightweight but may not match commercial solutions
2. **Firestore images**: Images stored as base64 strings (can increase storage usage)
3. **No cloud GPU**: Training runs locally — takes longer without GPU
4. **Speech synthesis quality**: Depends on browser/OS voice packs (Indian languages may vary)
5. **Dataset coverage**: Only covers PlantVillage dataset classes (38 diseases)
6. **No real-time updates**: History refreshes on page load

---

## 🚀 Deployment Plan

### Frontend → Firebase Hosting (Free)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Backend → Render.com (Free Tier)
1. Push `backend/` to GitHub
2. Create new Web Service on [render.com](https://render.com)
3. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Upload model files via Render disk or Git LFS

### Alternative Backend → Railway.app (Free Tier)
```bash
# Deploy via Railway CLI
railway login
railway init
railway up
```

---

## 📦 Kaggle Dataset

- **Primary**: https://www.kaggle.com/datasets/emmarex/plantdisease
- **Alternative**: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset
- **Classes**: 38 (14 plants × ~3 diseases + healthy variants)

---

## 🔑 Firebase Configuration

The Firebase config is already set in `src/firebase.js`. Your project:
- **Project ID**: `plant-project-330a0`
- **Auth Domain**: `plant-project-330a0.firebaseapp.com`
