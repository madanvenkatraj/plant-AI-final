import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { DISEASE_DB } from '../data/diseaseDatabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImagePlus, Loader2, AlertCircle, Leaf, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function findDiseaseInfo(label) {
  if (!label) return null;
  // Direct match
  if (DISEASE_DB[label]) return DISEASE_DB[label];
  // Fuzzy match - normalize and compare
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const norm = normalize(label);
  for (const [key, val] of Object.entries(DISEASE_DB)) {
    if (normalize(key) === norm) return val;
  }
  // Partial match
  for (const [key, val] of Object.entries(DISEASE_DB)) {
    if (norm.includes(normalize(key)) || normalize(key).includes(norm)) return val;
  }
  return null;
}
function compressImage(base64Str, maxWidth = 800, maxHeight = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality
    };
  });
}

export default function Diagnoses() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB.');
      return;
    }
    setError('');
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 85) { clearInterval(progressInterval); return 85; }
        return p + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      const label = data.label || data.predicted_class || '';
      const confidence = data.confidence || data.confidence_score || 0;

      const diseaseInfo = findDiseaseInfo(label) || {
        plant: label.split('___')[0]?.replace(/_/g, ' ') || 'Unknown',
        disease: label.split('___')[1]?.replace(/_/g, ' ') || 'Unknown',
        causes: 'No information available.',
        symptoms: 'No information available.',
        treatment: 'Consult a local agricultural expert.',
        prevention: 'Practice good agricultural hygiene.'
      };

      // Compress image to ensure it fits in Firestore (1MB limit)
      const compressedImage = await compressImage(preview);

      // Save to Firestore
      const diagnosisData = {
        uid: currentUser.uid,
        plantName: diseaseInfo.plant,
        diseaseName: diseaseInfo.disease,
        label: label,
        confidence: Math.round(confidence * 100) / 100,
        causes: diseaseInfo.causes,
        symptoms: diseaseInfo.symptoms,
        treatment: diseaseInfo.treatment,
        prevention: diseaseInfo.prevention,
        imageBase64: compressedImage,
        timestamp: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'diagnoses'), diagnosisData);

      // Increment user's total diagnoses (Create if missing)
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { totalDiagnoses: increment(1) }, { merge: true });

      navigate('/result', { state: { ...diagnosisData, id: docRef.id } });
    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      console.error('Prediction error:', err);
      setError(`Analysis failed: ${err.message}. Make sure the backend is running on ${API_URL}.`);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setError('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Diagnose Your Plant</h1>
        <p className="mt-2 text-gray-500">Upload a clear photo of a plant leaf to detect diseases</p>
      </motion.div>

      {/* Upload Area */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 ${
          dragOver ? 'border-plantGreen-500 bg-plantGreen-50' : 'border-gray-300 bg-white hover:border-plantGreen-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="relative p-4">
              <button onClick={clearImage}
                className="absolute top-3 right-3 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow">
                <X className="h-4 w-4" />
              </button>
              <img src={preview} alt="Selected leaf" className="w-full max-h-80 object-contain rounded-xl mx-auto" />
              <p className="text-center text-sm text-gray-500 mt-3">{selectedFile?.name}</p>
            </motion.div>
          ) : (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 px-6 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}>
              <div className="bg-plantGreen-100 rounded-full p-6 mb-4">
                <ImagePlus className="h-10 w-10 text-plantGreen-500" />
              </div>
              <p className="text-lg font-medium text-gray-700">Drop your leaf image here</p>
              <p className="text-sm text-gray-500 mt-1">or <span className="text-plantGreen-600 font-medium">click to browse</span></p>
              <p className="text-xs text-gray-400 mt-2">PNG, JPG, JPEG up to 10MB</p>
            </motion.div>
          )}
        </AnimatePresence>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg flex items-start text-red-700">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}

      {/* Upload Progress */}
      {loading && uploadProgress > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Analyzing...</span><span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div className="bg-plantGreen-500 h-2 rounded-full"
              initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || loading}
          className="w-full py-4 px-6 bg-plantGreen-600 hover:bg-plantGreen-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-plantGreen-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] flex items-center justify-center"
        >
          {loading ? (
            <><Loader2 className="h-6 w-6 animate-spin mr-3" />Analyzing your plant...</>
          ) : (
            <><Leaf className="h-6 w-6 mr-3" />Analyze Plant</>
          )}
        </button>
      </motion.div>

      {/* Tips */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mt-8 bg-blue-50 rounded-xl p-5 border border-blue-100">
        <h3 className="text-sm font-semibold text-blue-700 mb-2">📸 Tips for best results</h3>
        <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
          <li>Take a close-up photo of a single leaf</li>
          <li>Ensure good lighting — avoid shadows</li>
          <li>Include the whole leaf in the frame</li>
          <li>Use a plain background if possible</li>
        </ul>
      </motion.div>
    </div>
  );
}
