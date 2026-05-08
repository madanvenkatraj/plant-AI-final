import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download, Volume2, VolumeX, Globe, ChevronDown,
  AlertTriangle, CheckCircle, ArrowLeft, Leaf, Loader2
} from 'lucide-react';
// import { GoogleGenerativeAI } from '@google/generative-ai';
import translations from '../locales/translations.json';

const LANGUAGES = [
  { code: 'en', name: 'English', voice: 'en-US' },
  { code: 'ta', name: 'தமிழ்', voice: 'ta-IN' },
  { code: 'hi', name: 'हिन्दी', voice: 'hi-IN' },
  { code: 'te', name: 'తెలుగు', voice: 'te-IN' },
  { code: 'kn', name: 'ಕನ್ನಡ', voice: 'kn-IN' },
];

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [langOpen, setLangOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const audioRef = useRef(null);

  const t = translations[lang] || translations.en;

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center px-4">
        <Leaf className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">No diagnosis data</h2>
        <p className="text-gray-500 mt-2">Please go to Diagnoses to analyze a plant.</p>
        <button onClick={() => navigate('/diagnoses')}
          className="mt-4 px-6 py-2 bg-plantGreen-600 text-white rounded-lg hover:bg-plantGreen-700 transition-colors">
          Go to Diagnoses
        </button>
      </div>
    );
  }

  const { plantName, diseaseName, confidence, causes, symptoms, treatment, prevention, imageBase64, timestamp } = state;
  const isHealthy = diseaseName?.toLowerCase() === 'healthy';
  const confPct = typeof confidence === 'number' ? (confidence > 1 ? confidence : confidence * 100).toFixed(1) : 'N/A';

  // Use translated content if available, otherwise fallback to English defaults
  // Use translated content if available, otherwise fallback to English defaults
  const displayPlantName = translatedContent?.plantName || plantName || 'Unknown';
  const displayDiseaseName = translatedContent?.diseaseName || diseaseName || 'Unknown';
  const displayCauses = translatedContent?.causes || causes || 'No data available';
  const displaySymptoms = translatedContent?.symptoms || symptoms || 'No data available';
  const displayTreatment = translatedContent?.treatment || treatment || 'No data available';
  const displayPrevention = translatedContent?.prevention || prevention || 'No data available';

  const translateContent = async (targetLangCode) => {
    if (targetLangCode === 'en') {
      setTranslatedContent(null);
      return;
    }
    
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

    setTranslating(true);
    try {
      const targetLangName = LANGUAGES.find(l => l.code === targetLangCode)?.name || 'English';
      const response = await fetch(`${baseUrl}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { plantName, diseaseName, causes, symptoms, treatment, prevention },
          target_language: targetLangName
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setTranslatedContent(data.translated_data);
    } catch (err) {
      console.error("Translation failed details:", err);
      // Fallback to original content
      setTranslatedContent(null);
    } finally {
      setTranslating(false);
    }
  };

  const handleLanguageChange = (code) => {
    setLang(code);
    setLangOpen(false);
    translateContent(code);
  };

  const getSpeechText = () =>
    `${t.plant}: ${displayPlantName}. ${t.disease}: ${displayDiseaseName}. ${t.confidence}: ${confPct} percent. ` +
    `${t.causes}: ${displayCauses}. ${t.symptoms}: ${displaySymptoms}. ${t.treatment}: ${displayTreatment}. ${t.prevention}: ${displayPrevention}.`;

  const handleListen = async () => {
    if (speaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setSpeaking(false);
      return;
    }
    
    try {
      setTtsLoading(true);
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const textToSpeak = getSpeechText();
      
      const response = await fetch(`${baseUrl}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, lang })
      });

      if (!response.ok) throw new Error("TTS failed");

      const data = await response.json();
      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      
      const audio = new Audio(audioSrc);
      audioRef.current = audio;
      
      audio.onplay = () => {
        setSpeaking(true);
        setTtsLoading(false);
      };

      audio.onended = () => {
        setSpeaking(false);
        audioRef.current = null;
      };

      audio.play();
    } catch (error) {
      console.error("TTS Error:", error);
      setSpeaking(false);
      setTtsLoading(false);
      alert("Speech failed. Please check backend.");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('result-content');
      const opt = {
        margin: 10,
        filename: `PlantAI_Diagnosis_${plantName}_${new Date().toLocaleDateString()}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF error:', err);
      alert('PDF generation failed. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Back */}
      <button onClick={() => navigate('/diagnoses')}
        className="flex items-center text-gray-500 hover:text-gray-800 transition-colors mb-6">
        <ArrowLeft className="h-5 w-5 mr-1" /> Back to Diagnoses
      </button>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6 justify-end">
        {/* Language Picker */}
        <div className="relative">
          <button onClick={() => setLangOpen(!langOpen)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors">
            <Globe className="h-4 w-4 mr-2 text-plantGreen-600" />
            {LANGUAGES.find(l => l.code === lang)?.name}
            <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-100 z-10 overflow-hidden">
              {LANGUAGES.map(l => (
                <button key={l.code}
                  onClick={() => handleLanguageChange(l.code)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-plantGreen-50 hover:text-plantGreen-700 transition-colors ${lang === l.code ? 'bg-plantGreen-50 text-plantGreen-700 font-semibold' : 'text-gray-700'}`}>
                  {l.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Listen Button */}
        <button 
          onClick={handleListen}
          disabled={ttsLoading}
          className={`flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-colors ${
            speaking ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-plantGreen-600 text-white hover:bg-plantGreen-700'
          } ${ttsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {ttsLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
          ) : (
            <>
              {speaking ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
              {speaking ? 'Stop' : t.listen}
            </>
          )}
        </button>

        {/* Download PDF */}
        <button onClick={handleDownloadPDF}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 transition-colors">
          <Download className="h-4 w-4 mr-2" />
          {t.download}
        </button>
      </div>

      {/* Main Result Card */}
      <div id="result-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Header Banner */}
          <div className={`px-8 py-5 ${isHealthy ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-orange-400 to-red-500'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium uppercase tracking-wider">{t.plant}</p>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{displayPlantName}</h1>
                  {translating && <Loader2 className="h-5 w-5 text-white animate-spin" />}
                </div>
              </div>
              {isHealthy
                ? <CheckCircle className="h-10 w-10 text-white/80" />
                : <AlertTriangle className="h-10 w-10 text-white/80" />}
            </div>
          </div>

          <div className="p-8">
            {/* Image + Disease Summary */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              {imageBase64 && (
                <div className="flex-shrink-0">
                  <img src={imageBase64} alt="Analyzed leaf"
                    className="w-full md:w-56 h-56 object-cover rounded-xl border-4 border-white shadow-lg" />
                  {timestamp && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      {new Date(timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              <div className="flex-grow">
                <div className="mb-4">
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{t.disease}</p>
                  <h2 className={`text-2xl font-bold mt-1 ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                    {displayDiseaseName}
                  </h2>
                </div>

                {/* Confidence Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 font-medium">{t.confidence}</span>
                    <span className={`font-bold text-lg ${isHealthy ? 'text-green-600' : 'text-orange-600'}`}>{confPct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(parseFloat(confPct), 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-orange-500'}`}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Affected: {confPct}%</p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            {!isHealthy && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
                {translating && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                    <Loader2 className="h-8 w-8 text-plantGreen-500 animate-spin" />
                  </div>
                )}
                {[
                  { label: t.causes, text: displayCauses, color: 'red', icon: '⚠️' },
                  { label: t.symptoms, text: displaySymptoms, color: 'orange', icon: '🔍' },
                  { label: t.treatment, text: displayTreatment, color: 'blue', icon: '💊' },
                  { label: t.prevention, text: displayPrevention, color: 'green', icon: '🛡️' },
                ].map(({ label, text, color, icon }) => (
                  <div key={label}
                    className={`bg-${color}-50 border border-${color}-100 rounded-xl p-5`}>
                    <h3 className={`text-sm font-bold text-${color}-700 uppercase tracking-wider mb-2 flex items-center`}>
                      <span className="mr-2">{icon}</span>{label}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            )}

            {isHealthy && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center relative">
                {translating && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                    <Loader2 className="h-8 w-8 text-plantGreen-500 animate-spin" />
                  </div>
                )}
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-700">{displayDiseaseName}</h3>
                <p className="text-green-600 mt-1 text-sm">{displayPrevention}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
