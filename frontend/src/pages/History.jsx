import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Clock, Leaf, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';

export default function History() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  async function fetchHistory() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'diagnoses'),
        where('uid', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort client-side to avoid needing composite indices in Firestore
      data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setDiagnoses(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this diagnosis?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'diagnoses', id));
      setDiagnoses(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(null);
    }
  }

  function handleCardClick(diagnosis) {
    navigate('/result', { state: diagnosis });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-plantGreen-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Diagnosis History</h1>
        <p className="text-gray-500 mt-1">Your past plant disease diagnoses — click a card to view details</p>
      </motion.div>

      {diagnoses.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <Leaf className="h-14 w-14 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No diagnoses yet</h3>
          <p className="text-gray-400 mt-1">Upload a leaf image to get started</p>
          <button onClick={() => navigate('/diagnoses')}
            className="mt-6 px-6 py-2 bg-plantGreen-600 text-white rounded-lg hover:bg-plantGreen-700 transition-colors font-medium">
            Start Diagnosing
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {diagnoses.map((d, i) => {
              const isHealthy = d.diseaseName?.toLowerCase() === 'healthy';
              const confPct = typeof d.confidence === 'number'
                ? (d.confidence > 1 ? d.confidence : d.confidence * 100).toFixed(1)
                : 'N/A';

              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleCardClick(d)}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden group border border-gray-100 hover:border-plantGreen-200"
                >
                  {/* Image */}
                  <div className="relative h-44 bg-gray-100">
                    {d.imageBase64 ? (
                      <img src={d.imageBase64} alt={d.plantName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className={`absolute top-3 left-3 flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow ${
                      isHealthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isHealthy
                        ? <CheckCircle className="h-3 w-3 mr-1" />
                        : <AlertCircle className="h-3 w-3 mr-1" />}
                      {isHealthy ? 'Healthy' : 'Diseased'}
                    </div>
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(e, d.id)}
                      disabled={deleting === d.id}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{d.plantName}</p>
                        <h3 className={`text-base font-bold mt-0.5 ${isHealthy ? 'text-green-600' : 'text-gray-800'}`}>
                          {d.diseaseName}
                        </h3>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-plantGreen-500 transition-colors mt-1" />
                    </div>

                    {/* Confidence */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Confidence</span>
                        <span className="font-semibold">{confPct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${Math.min(parseFloat(confPct) || 0, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center text-xs text-gray-400 mt-3">
                      <Clock className="h-3 w-3 mr-1" />
                      {d.timestamp ? new Date(d.timestamp).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
