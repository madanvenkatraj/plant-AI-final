# 🚀 Deployment Guide — Plant AI

Follow these steps to deploy your application while keeping your **Gemini API Key** secure.

---

## 1. Backend (Render)
The backend is configured to run on [Render](https://render.com).

1.  **Push to GitHub**: Ensure your code is pushed to a GitHub repository.
2.  **Create Web Service**:
    *   Go to **Render Dashboard** -> **New** -> **Web Service**.
    *   Connect your GitHub repo.
    *   Select the `backend` directory (or set "Root Directory" to `backend`).
    *   **Runtime**: Python.
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3.  **Environment Variables**:
    *   In Render, go to **Environment** tab.
    *   Add `GEMINI_API_KEY`: `(Your New Gemini Key from AI Studio)`
4.  **Get URL**: Copy the Render URL (e.g., `https://plant-ai-backend.onrender.com`).

---

## 2. Frontend (Firebase)
The frontend is configured for **Firebase Hosting**.

1.  **Configure API URL**:
    *   Open `frontend/.env`.
    *   Set `VITE_API_URL` to your **Render URL** (e.g., `VITE_API_URL=https://plant-ai-backend.onrender.com`).
2.  **Build Frontend**:
    *   `cd frontend`
    *   `npm install`
    *   `npm run build` (This creates the `dist` folder).
3.  **Deploy**:
    *   `cd ..` (Return to root)
    *   `firebase login`
    *   `firebase init` (Select **Hosting** and **Firestore** if not done).
    *   `firebase deploy`

---

## 🔐 Security Checklist
- [x] **Gemini Key Secure**: No Gemini keys are in the frontend code or `dist` folder.
- [x] **Environment Variables**: Key is only stored in Render's secure environment.
- [x] **.gitignore**: `.env` files are ignored and won't be pushed to GitHub.
- [x] **Server-side calls**: All AI logic happens in the backend.

---

## 📄 Database (Firebase Firestore)
Make sure your Firestore rules allow the frontend to save diagnoses:
1.  Go to **Firebase Console** -> **Firestore** -> **Rules**.
2.  Paste the contents of `firestore.rules`.
