import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  Bug, Droplets, Thermometer, Wind, Sprout, 
  Activity, Loader2, AlertTriangle, ShieldCheck, 
  History, Info, ChevronRight, Gauge, Zap
} from 'lucide-react';
import { predictionService } from '../services/api';

const PestForecastPage = () => {
  const [formData, setFormData] = useState({
    crop: 'cotton',
    humidity_pct: 65,
    temp_c: 28,
    wind_speed_kph: 15,
    soil_moisture: 45,
    ndvi_index: 0.72,
    historical_pressure: 0.3,
    leaf_wetness_hrs: 6,
    last_24h_rainfall: 12
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
      const res = await predictionService.predictPest(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Cloud forecasting engine failure.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'var(--danger)';
      case 'HIGH': return '#f59e0b';
      case 'MODERATE': return '#3b82f6';
      default: return 'var(--secondary)';
    }
  };

  return (
    <div className="main-content-pushed">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bug className="text-secondary" size={36} />
            Bio-Intelligence Forecaster
          </h1>
          <p className="text-muted mt-2">Next-Level Pest & Pathogen Outbreak Prediction Engine</p>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="glass px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">Real-time Satellite Sync</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Parameters Panel */}
        <div className="lg:col-span-7 space-y-6">
          <Motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-8 rounded-3xl border border-white/10"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <Activity size={22} className="text-secondary" />
                Environmental Observables
              </h3>
              <select 
                name="crop" 
                value={formData.crop} 
                onChange={handleInputChange}
                className="glass-input !w-auto !py-1 !text-xs !bg-secondary/10 border-none font-bold"
              >
                <option value="wheat">Wheat</option>
                <option value="rice">Rice</option>
                <option value="tomato">Tomato</option>
                <option value="onion">Onion</option>
                <option value="cotton">Cotton</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              
              {/* Observable Row: Humidity */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Droplets size={12}/> Humidity</span>
                  <span className="text-white">{formData.humidity_pct}%</span>
                </div>
                <input type="range" name="humidity_pct" min="0" max="100" value={formData.humidity_pct} onChange={handleInputChange} className="w-full accent-secondary h-1.5" />
              </div>

              {/* Observable Row: Temp */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Thermometer size={12}/> Temperature</span>
                  <span className="text-white">{formData.temp_c}°C</span>
                </div>
                <input type="range" name="temp_c" min="0" max="50" step="0.5" value={formData.temp_c} onChange={handleInputChange} className="w-full h-1.5" style={{accentColor: '#f59e0b'}} />
              </div>

              {/* Observable Row: Wind */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Wind size={12}/> Wind Speed</span>
                  <span className="text-white">{formData.wind_speed_kph} km/h</span>
                </div>
                <input type="range" name="wind_speed_kph" min="0" max="80" value={formData.wind_speed_kph} onChange={handleInputChange} className="w-full h-1.5 opacity-80" />
              </div>

              {/* Observable Row: Soil */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Droplets size={12}/> Soil Moisture</span>
                  <span className="text-white">{formData.soil_moisture}%</span>
                </div>
                <input type="range" name="soil_moisture" min="0" max="100" value={formData.soil_moisture} onChange={handleInputChange} className="w-full h-1.5 accent-info" />
              </div>

              {/* Observable Row: NDVI */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Sprout size={12}/> NDVI Index</span>
                  <span className="text-white">{formData.ndvi_index.toFixed(2)}</span>
                </div>
                <input type="range" name="ndvi_index" min="0" max="1" step="0.01" value={formData.ndvi_index} onChange={handleInputChange} className="w-full h-1.5" style={{accentColor: '#10b981'}} />
              </div>

              {/* Observable Row: Pressure */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><History size={12}/> Hist. Pressure</span>
                  <span className="text-white">{(formData.historical_pressure * 100).toFixed(0)}%</span>
                </div>
                <input type="range" name="historical_pressure" min="0" max="1" step="0.01" value={formData.historical_pressure} onChange={handleInputChange} className="w-full h-1.5 accent-danger" />
              </div>

              {/* Observable Row: Wetness */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Droplets size={12}/> Leaf Wetness</span>
                  <span className="text-white">{formData.leaf_wetness_hrs} h/d</span>
                </div>
                <input type="range" name="leaf_wetness_hrs" min="0" max="24" value={formData.leaf_wetness_hrs} onChange={handleInputChange} className="w-full h-1.5 opacity-90" />
              </div>

              {/* Observable Row: Rain */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="flex items-center gap-2"><Droplets size={12}/> 24h Rainfall</span>
                  <span className="text-white">{formData.last_24h_rainfall} mm</span>
                </div>
                <input type="range" name="last_24h_rainfall" min="0" max="200" value={formData.last_24h_rainfall} onChange={handleInputChange} className="w-full h-1.5" />
              </div>

            </div>

            <div className="mt-12">
              <button 
                onClick={handlePredict}
                disabled={loading}
                className="btn btn-secondary w-full flex justify-center items-center gap-3 !py-4 !rounded-2xl text-xl font-black shadow-[0_10px_30px_rgba(82,183,136,0.3)] hover:shadow-[0_15px_40px_rgba(82,183,136,0.5)] transition-all"
              >
                {loading ? <Loader2 className="lucide-spin" size={28} /> : <Zap size={28} />}
                {loading ? 'CALCULATING BIO-RISK...' : 'RUN FORECAST ENGINE'}
              </button>
            </div>
          </Motion.div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {error && (
              <Motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key="error"
                className="glass p-6 rounded-3xl border border-danger/30 bg-danger/5 text-danger flex items-center gap-4"
              >
                <div className="p-3 bg-danger/20 rounded-full"><AlertTriangle size={24} /></div>
                <div>
                  <h4 className="font-bold text-lg">System Error</h4>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
              </Motion.div>
            )}

            {!result && !loading && !error && (
              <Motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="empty"
                className="flex-1 glass rounded-3xl border border-white/5 flex flex-col items-center justify-center p-12 text-center opacity-40"
              >
                <Gauge size={80} className="mb-6 stroke-[1px] opacity-20" />
                <h3 className="text-2xl font-light mb-2">Engine Standby</h3>
                <p className="text-sm">Configure observables and trigger the neural simulation to receive a site-specific risk profile.</p>
              </Motion.div>
            )}

            {loading && (
              <Motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="loading"
                className="flex-1 glass rounded-3xl border border-white/5 flex flex-col items-center justify-center p-12 text-center"
              >
                <Loader2 size={64} className="lucide-spin text-secondary mb-6" />
                <h3 className="text-2xl font-bold text-secondary animate-pulse">Analyzing Neural Pathways...</h3>
                <p className="text-muted mt-2">Correlating multi-factor weather patterns with historical pest migration datasets.</p>
              </Motion.div>
            )}

            {result && !loading && (
              <Motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                key="result"
                className="flex-1 flex flex-col gap-6"
              >
                {/* Risk Circle */}
                <div 
                  className="glass p-10 rounded-3xl border-2 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-700"
                  style={{ borderColor: `${getRiskColor(result.risk_level)}44`, background: `linear-gradient(135deg, ${getRiskColor(result.risk_level)}11, transparent)` }}
                >
                  <Bug size={140} className="absolute -right-10 -bottom-10 opacity-5" />
                  
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
                      <Motion.circle 
                        cx="96" cy="96" r="88" 
                        stroke={getRiskColor(result.risk_level)} 
                        strokeWidth="12" 
                        fill="transparent" 
                        strokeDasharray={552} 
                        initial={{ strokeDashoffset: 552 }}
                        animate={{ strokeDashoffset: 552 - (552 * result.risk_score) / 100 }}
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
                        {result.risk_score.toFixed(0)}%
                      </Motion.span>
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">Risk Prob.</span>
                    </div>
                  </div>

                  <Motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", delay: 0.8 }}
                    className="mt-6 px-6 py-2 rounded-full font-black text-sm tracking-widest"
                    style={{ background: getRiskColor(result.risk_level), color: '#000' }}
                  >
                    {result.risk_level} ALERT
                  </Motion.div>
                </div>

                {/* Advisory Card */}
                <Motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="glass p-8 rounded-3xl border border-white/10 flex-1 relative flex flex-col justify-center"
                >
                  <div className="flex items-center gap-3 mb-4 text-info font-bold uppercase tracking-widest text-xs">
                    <ShieldCheck size={16} /> Neural Advisory Insight
                  </div>
                  <p className="text-xl leading-relaxed text-slate-100 font-medium">
                    "{result.advisory}"
                  </p>
                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center opacity-60">
                    <div className="text-[10px] flex items-center gap-2">
                       <History size={12}/> Next update in 6h
                    </div>
                    <Motion.button 
                        whileHover={{ x: 5, color: "var(--secondary)" }}
                        className="text-[10px] flex items-center gap-1 font-bold"
                    >
                      View Full Bio-History <ChevronRight size={10}/>
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

export default PestForecastPage;
