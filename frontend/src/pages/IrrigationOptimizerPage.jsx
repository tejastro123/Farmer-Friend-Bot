import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, Thermometer, Wind, Sprout, Sun, 
  Activity, Loader2, AlertTriangle, ShieldCheck, 
  Clock, Waves, ChevronRight, Zap, Target
} from 'lucide-react';
import { predictionService } from '../services/api';

const IrrigationOptimizerPage = () => {
  const [formData, setFormData] = useState({
    crop: 'rice',
    soil_moisture: 35,
    temp_c: 32,
    humidity_pct: 45,
    wind_speed_kph: 12,
    solar_intensity: 0.8,
    water_availability: 0.6,
    crop_age_days: 45,
    rainfall_forecast_mm: 2,
    soil_type_drying_const: 1.0,
    leaf_area_index: 2.5,
    water_source: 'tubewell'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "crop" ? value : Number(value)
    }));
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await predictionService.predictIrrigation(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Hydraulic logic engine failure.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return 'var(--danger)';
      case 'URGENT': return '#f59e0b';
      case 'MODERATE': return '#3b82f6';
      default: return 'var(--secondary)';
    }
  };

  return (
    <div className="main-content-pushed">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Droplets className="text-secondary" size={36} />
            Hydro-A.I. Optimizer
          </h1>
          <p className="text-muted mt-2">Precision Water Lifecycle Management & Scheduling</p>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="glass px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
             <Target className="text-secondary animate-pulse" size={16} />
             <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">Field Sensor Sync (Active)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Parameters Panel */}
        <div className="lg:col-span-7 space-y-6">
          <Motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 rounded-3xl border border-white/10"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <Activity size={22} className="text-secondary" />
                Hydraulic Parameters
              </h3>
              <select 
                name="crop" 
                value={formData.crop} 
                onChange={handleInputChange}
                className="glass-input !w-auto !py-1 !text-xs !bg-secondary/10 border-none font-bold"
              >
                <option value="wheat">Wheat</option>
                <option value="rice">Rice (Water Intensive)</option>
                <option value="tomato">Tomato</option>
                <option value="onion">Onion</option>
                <option value="cotton">Cotton</option>
              </select>
            </div>

            {/* Water Source Selector */}
            <div className="mb-10 p-2 glass bg-white/5 rounded-2xl flex gap-2">
              {['canal', 'tubewell', 'pond'].map(source => (
                <Motion.button
                  key={source}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData(p => ({ ...p, water_source: source }))}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    formData.water_source === source 
                    ? 'bg-secondary text-black shadow-lg shadow-secondary/20' 
                    : 'hover:bg-white/5 text-muted'
                  }`}
                >
                  {source}
                </Motion.button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              
              {/* Soil Moisture */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Droplets size={12}/> Soil Moisture</span>
                  <span className="text-white">{formData.soil_moisture}%</span>
                </div>
                <input type="range" name="soil_moisture" min="0" max="100" value={formData.soil_moisture} onChange={handleInputChange} className="w-full accent-secondary h-1.5" />
              </div>

              {/* Water Stock */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Waves size={12}/> Water Source Stock</span>
                  <span className="text-white">{(formData.water_availability * 100).toFixed(0)}%</span>
                </div>
                <input type="range" name="water_availability" min="0" max="1" step="0.01" value={formData.water_availability} onChange={handleInputChange} className="w-full h-1.5 accent-info" />
              </div>

              {/* Temp */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Thermometer size={12}/> Temperature</span>
                  <span className="text-white">{formData.temp_c}°C</span>
                </div>
                <input type="range" name="temp_c" min="15" max="50" step="0.5" value={formData.temp_c} onChange={handleInputChange} className="w-full h-1.5" style={{accentColor: '#f59e0b'}} />
              </div>

              {/* Sun */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Sun size={12}/> Solar Intensity</span>
                  <span className="text-white">{(formData.solar_intensity * 100).toFixed(0)}%</span>
                </div>
                <input type="range" name="solar_intensity" min="0" max="1" step="0.01" value={formData.solar_intensity} onChange={handleInputChange} className="w-full h-1.5 accent-warning" />
              </div>

              {/* Wind */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Wind size={12}/> Wind (Evap. Force)</span>
                  <span className="text-white">{formData.wind_speed_kph} km/h</span>
                </div>
                <input type="range" name="wind_speed_kph" min="0" max="60" value={formData.wind_speed_kph} onChange={handleInputChange} className="w-full h-1.5 opacity-80" />
              </div>

              {/* Forecast */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Droplets size={12}/> Rain Forecast</span>
                  <span className="text-white">{formData.rainfall_forecast_mm} mm</span>
                </div>
                <input type="range" name="rainfall_forecast_mm" min="0" max="100" value={formData.rainfall_forecast_mm} onChange={handleInputChange} className="w-full h-1.5 accent-secondary" />
              </div>

              {/* Crop Age */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Sprout size={12}/> Crop Lifecycle</span>
                  <span className="text-white">{formData.crop_age_days} Days</span>
                </div>
                <input type="range" name="crop_age_days" min="1" max="180" value={formData.crop_age_days} onChange={handleInputChange} className="w-full h-1.5" />
              </div>

              {/* LAI */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Activity size={12}/> Leaf Area Index</span>
                  <span className="text-white">{formData.leaf_area_index.toFixed(1)}</span>
                </div>
                <input type="range" name="leaf_area_index" min="0.5" max="6" step="0.1" value={formData.leaf_area_index} onChange={handleInputChange} className="w-full h-1.5 accent-secondary" />
              </div>

            </div>

            <div className="mt-12">
              <Motion.button 
                whileHover={{ scale: 1.02, boxShadow: "0 15px 40px rgba(82,183,136,0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePredict}
                disabled={loading}
                className="btn btn-secondary w-full flex justify-center items-center gap-3 !py-4 !rounded-2xl text-xl font-black shadow-[0_10px_30px_rgba(82,183,136,0.3)] transition-all"
              >
                {loading ? <Loader2 className="lucide-spin" size={28} /> : <Droplets size={28} />}
                {loading ? 'ANALYZING HYDRAULICS...' : 'OPTIMIZE WATER CYCLE'}
              </Motion.button>
            </div>
          </Motion.div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {error && (
              <Motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-3xl border border-danger/30 bg-danger/5 text-danger flex items-center gap-4"
              >
                <AlertTriangle size={24} />
                <p className="text-sm font-bold">{error}</p>
              </Motion.div>
            )}

            {!result && !loading && !error && (
              <Motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 glass rounded-3xl border border-white/5 flex flex-col items-center justify-center p-12 text-center opacity-40"
              >
                <Waves size={80} className="mb-6 stroke-[1px] opacity-20" />
                <h3 className="text-2xl font-light mb-2">Engines Ready</h3>
                <p className="text-sm">Input sensor data to determine optimal watering windows and avoid resource waste.</p>
              </Motion.div>
            )}

            {loading && (
              <Motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 glass rounded-3xl border border-white/5 flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="relative mb-10">
                   <Droplets size={80} className="text-secondary animate-bounce opacity-20" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={40} className="lucide-spin text-secondary" />
                   </div>
                </div>
                <h3 className="text-2xl font-bold text-secondary animate-pulse">Running Neural Fluid Dynamics...</h3>
                <p className="text-muted mt-2">Computing transpiration curves and weather-dependent moisture retention.</p>
              </Motion.div>
            )}

            {result && !loading && (
              <Motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col gap-6"
              >
                {/* Status Card */}
                <div 
                  className="glass p-10 rounded-3xl border-2 flex flex-col items-center justify-center text-center relative overflow-hidden"
                  style={{ borderColor: `${getStatusColor(result.status)}44`, background: `linear-gradient(135deg, ${getStatusColor(result.status)}22, transparent)` }}
                >
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
                      <Motion.circle 
                        cx="96" cy="96" r="88" 
                        stroke={getStatusColor(result.status)} 
                        strokeWidth="12" 
                        fill="transparent" 
                        strokeDasharray={552} 
                        initial={{ strokeDashoffset: 552 }}
                        animate={{ strokeDashoffset: 552 - (552 * result.irrigation_probability) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Motion.span 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ delay: 0.5 }}
                         className="text-5xl font-black"
                      >
                        {result.irrigation_probability.toFixed(0)}%
                      </Motion.span>
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">Water Deficit</span>
                    </div>
                  </div>

                  <Motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", delay: 0.8 }}
                    className="mt-6 px-6 py-2 rounded-full font-black text-sm tracking-widest uppercase"
                    style={{ background: getStatusColor(result.status), color: '#000' }}
                  >
                    {result.status} STATUS
                  </Motion.div>
                </div>

                {/* Recommendation Card */}
                <Motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="glass p-8 rounded-3xl border border-white/10 flex-1 relative flex flex-col justify-center overflow-hidden"
                >
                  <Waves className="absolute -right-10 -bottom-10 opacity-5" size={200} />
                  <div className="flex items-center gap-3 mb-4 text-info font-bold uppercase tracking-widest text-xs">
                    <Clock size={16} /> Optimal Watering Window
                  </div>
                  <p className="text-xl leading-relaxed text-slate-100 font-medium z-10">
                    "{result.recommendation}"
                  </p>
                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center opacity-60 z-10">
                    <div className="text-[10px] flex items-center gap-2">
                       <Zap size={12} className="text-warning"/> Projected Saving: 15%
                    </div>
                    <Motion.button 
                        whileHover={{ x: 5, color: "var(--secondary)" }}
                        className="text-[10px] flex items-center gap-1 font-bold"
                    >
                      Full Schedule <ChevronRight size={10}/>
                    </Motion.button>
                  </div>
                </Motion.div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default IrrigationOptimizerPage;
