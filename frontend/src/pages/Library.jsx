import { useState } from 'react';
import { motion } from 'framer-motion';
import { PLANT_LIBRARY, DISEASE_DB } from '../data/diseaseDatabase';
import { Search, Leaf, ChevronDown, ChevronUp, X } from 'lucide-react';

export default function Library() {
  const [search, setSearch] = useState('');
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const filtered = PLANT_LIBRARY.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  const getDiseasesForPlant = (plantName) =>
    Object.entries(DISEASE_DB).filter(([, v]) => v.plant === plantName);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Plant Disease Library</h1>
        <p className="text-gray-500 mt-2">Browse plants and learn about diseases, symptoms, and treatments</p>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md mx-auto mb-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search plants..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-plantGreen-400 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Plant Grid */}
      {!selectedPlant ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {filtered.map((plant, i) => (
            <motion.div key={plant.name}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedPlant(plant)}
              className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100 hover:border-plantGreen-300 text-center group"
            >
              <div className="text-5xl mb-3">{plant.emoji}</div>
              <h3 className="font-semibold text-gray-800 group-hover:text-plantGreen-600 transition-colors text-sm">{plant.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{plant.type}</p>
              <p className="text-xs text-gray-500 mt-1">{plant.commonDiseases.length} disease{plant.commonDiseases.length !== 1 ? 's' : ''}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          {/* Back */}
          <button onClick={() => { setSelectedPlant(null); setSelectedDisease(null); setExpanded(null); }}
            className="flex items-center text-gray-500 hover:text-gray-800 transition-colors mb-6">
            <X className="h-4 w-4 mr-1" /> Close
          </button>

          {/* Plant Header */}
          <div className="bg-gradient-to-r from-plantGreen-500 to-plantGreen-700 rounded-2xl p-8 mb-6 text-white">
            <div className="flex items-center gap-6">
              <span className="text-7xl">{selectedPlant.emoji}</span>
              <div>
                <p className="text-plantGreen-200 text-sm font-medium uppercase tracking-wider">{selectedPlant.type}</p>
                <h2 className="text-3xl font-bold">{selectedPlant.name}</h2>
                <p className="text-sm text-plantGreen-100 italic">{selectedPlant.scientific}</p>
                <p className="mt-2 text-plantGreen-50 text-sm max-w-xl">{selectedPlant.description}</p>
                <div className="mt-3 bg-white/20 rounded-lg px-4 py-2 inline-block">
                  <p className="text-xs font-medium">💡 Tip: {selectedPlant.tips}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Diseases */}
          <h3 className="text-xl font-bold text-gray-800 mb-4">Known Diseases</h3>
          <div className="space-y-3">
            {getDiseasesForPlant(selectedPlant.name).map(([key, disease]) => {
              const isHealthy = disease.disease.toLowerCase() === 'healthy';
              const isOpen = expanded === key;
              return (
                <div key={key}
                  className={`bg-white rounded-xl border transition-all ${isOpen ? 'border-plantGreen-300 shadow-md' : 'border-gray-100 shadow-sm'}`}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : key)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="font-semibold text-gray-800">{disease.disease}</span>
                    </div>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-5"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                        {[
                          { label: '⚠️ Causes', text: disease.causes, color: 'red' },
                          { label: '🔍 Symptoms', text: disease.symptoms, color: 'orange' },
                          { label: '💊 Treatment', text: disease.treatment, color: 'blue' },
                          { label: '🛡️ Prevention', text: disease.prevention, color: 'green' },
                        ].map(({ label, text, color }) => (
                          <div key={label} className={`bg-${color}-50 rounded-lg p-4`}>
                            <p className={`text-xs font-bold text-${color}-700 uppercase tracking-wider mb-2`}>{label}</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
