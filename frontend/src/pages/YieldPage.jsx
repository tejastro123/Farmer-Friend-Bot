import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Droplets, Thermometer, Map, Activity, Loader2, Sprout } from 'lucide-react';
import { predictionService } from '../services/api';

const YieldPage = () => {
  const [formData, setFormData] = useState({
    crop: 'wheat',
    soil_type: 'alluvial',
    area_acres: 5,
    avg_temp_c: 25,
    rainfall_mm: 500
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ["area_acres", "avg_temp_c", "rainfall_mm"].includes(name) ? Number(value) : value
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await predictionService.predictYield(formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content-pushed">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="text-secondary" size={32} />
            Yield Analytics Engine
          </h1>
          <p className="text-muted mt-2">A.I. Powered Crop Output Estimator</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form Column */}
        <Motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-3xl border border-white/10"
        >
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-secondary" />
            Simulation Parameters
          </h3>
          
          <form onSubmit={handlePredict} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-muted ml-1 flex items-center gap-2">
                  <Sprout size={14} /> Crop Type
                </label>
                <select 
                  name="crop" 
                  value={formData.crop} 
                  onChange={handleInputChange}
                  className="glass-input w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-secondary outline-none transition"
                >
                  <option value="wheat">Wheat</option>
                  <option value="rice">Rice</option>
                  <option value="tomato">Tomato</option>
                  <option value="onion">Onion</option>
                  <option value="cotton">Cotton</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted ml-1 flex items-center gap-2">
                  <Map size={14} /> Soil Profile
                </label>
                <select 
                  name="soil_type" 
                  value={formData.soil_type} 
                  onChange={handleInputChange}
                  className="glass-input w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-secondary outline-none transition"
                >
                  <option value="alluvial">Alluvial</option>
                  <option value="black">Black</option>
                  <option value="red">Red</option>
                  <option value="laterite">Laterite</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end ml-1">
                <label className="text-sm text-muted flex items-center gap-2">
                  <Map size={14} /> Area (Acres)
                </label>
                <span className="text-secondary font-mono bg-secondary/10 px-2 py-0.5 rounded text-sm">
                  {formData.area_acres}
                </span>
              </div>
              <input 
                type="range" 
                name="area_acres" 
                min="0.5" 
                max="100" 
                step="0.5"
                value={formData.area_acres} 
                onChange={handleInputChange}
                className="w-full accent-secondary"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end ml-1">
                <label className="text-sm text-muted flex items-center gap-2">
                  <Thermometer size={14} /> Expected Temperature (°C)
                </label>
                <span className="text-warning font-mono bg-warning/10 px-2 py-0.5 rounded text-sm px-2 py-0.5 rounded text-sm">
                  {formData.avg_temp_c}°C
                </span>
              </div>
              <input 
                type="range" 
                name="avg_temp_c" 
                min="10" 
                max="45" 
                step="0.5"
                value={formData.avg_temp_c} 
                onChange={handleInputChange}
                className="w-full transition"
                style={{ accentColor: 'var(--warning)' }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end ml-1">
                <label className="text-sm text-muted flex items-center gap-2">
                  <Droplets size={14} /> Total Expected Rainfall (mm)
                </label>
                <span className="text-info font-mono bg-info/10 px-2 py-0.5 rounded text-sm">
                  {formData.rainfall_mm} mm
                </span>
              </div>
              <input 
                type="range" 
                name="rainfall_mm" 
                min="0" 
                max="1500" 
                step="10"
                value={formData.rainfall_mm} 
                onChange={handleInputChange}
                className="w-full transition"
                style={{ accentColor: 'var(--info)' }}
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-secondary w-full flex justify-center items-center gap-2 !py-3 !rounded-xl text-lg font-medium shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all"
              >
                {loading ? <Loader2 className="lucide-spin" size={24} /> : <Activity size={24} />}
                {loading ? 'Synthesizing...' : 'Predict Farm Output'}
              </button>
            </div>
          </form>
          </Motion.div>

        {/* Results Column */}
        <div className="space-y-8 flex flex-col">
          <AnimatePresence mode="wait">
            {error && (
              <Motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key="error"
                className="glass p-6 rounded-2xl border border-danger/30 bg-danger/5 text-danger flex items-center gap-3"
              >
                <Activity size={24} />
                <div>
                  <h4 className="font-bold">Prediction Failed</h4>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </Motion.div>
            )}

            {!result && !loading && !error && (
              <Motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="empty"
                className="flex-1 glass rounded-3xl border border-white/5 flex flex-col items-center justify-center p-12 text-center opacity-60"
              >
                <Sprout size={64} className="mb-4 opacity-50" />
                <h3 className="text-xl mb-2 font-medium">Awaiting Data</h3>
                <p className="text-sm">Adjust the simulation parameters on the left and run the prediction engine to see estimated yield and A.I. insights.</p>
              </Motion.div>
            )}

            {loading && (
              <Motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="loading"
                className="flex-1 glass rounded-3xl border border-white/5 flex flex-col items-center justify-center p-12 text-center"
              >
                <Loader2 size={48} className="lucide-spin text-secondary mb-4" />
                <h3 className="text-xl font-medium animate-pulse text-secondary">Analyzing Environmental Model...</h3>
              </Motion.div>
            )}

            {result && !loading && (
              <Motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key="result"
                className="flex-1 flex flex-col gap-6"
              >
                <Motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="glass p-8 rounded-3xl border border-secondary/30 relative overflow-hidden group transition-all duration-500 bg-gradient-to-br from-secondary/5 to-transparent"
                >
                  <TrendingUp size={120} className="absolute -right-6 -top-6 text-secondary/10 group-hover:scale-110 group-hover:-rotate-12 transition duration-700" />
                  <h4 className="text-muted font-medium mb-2 uppercase tracking-widest text-sm text-secondary/80">Estimated Crop Yield</h4>
                  <div className="flex items-baseline gap-2 mt-4">
                    <Motion.span 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-6xl font-black tracking-tighter text-white"
                    >
                      {result.predict_tonnage.toFixed(2)}
                    </Motion.span>
                    <span className="text-xl text-muted font-medium">Metric Tons</span>
                  </div>
                  <div className="mt-4 px-3 py-1 bg-secondary/20 border border-secondary/30 rounded-full inline-block text-xs font-semibold text-secondary">
                    Based on proprietary XGBoost models
                  </div>
                </Motion.div>

                <Motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass p-8 rounded-3xl border border-info/30 flex-1 relative bg-gradient-to-b from-transparent to-info/5"
                >
                  <h4 className="text-info/80 font-medium mb-4 uppercase tracking-widest text-sm flex items-center gap-2">
                    <Activity size={16} /> A.I. Diagnostic Insight
                  </h4>
                  <p className="text-lg leading-relaxed text-slate-200">
                    "{result.explanation}"
                  </p>
                </Motion.div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default YieldPage;
