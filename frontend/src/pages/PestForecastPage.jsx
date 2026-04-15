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
      case 'HIGH': return 'var(--warning)';
      case 'MODERATE': return 'var(--info)';
      default: return 'var(--sage)';
    }
  };

  const getRiskLevelClass = (level) => {
    switch (level) {
      case 'CRITICAL': return 'critical';
      case 'HIGH': return 'high';
      case 'MODERATE': return 'moderate';
      default: return 'low';
    }
  };

  return (
    <div className="prediction-page pest-page">
      <div className="prediction-params">
        <div className="prediction-header">
          <Bug size={24} />
          <div>
            <div className="prediction-header-title">Bio-Risk Forecaster</div>
            <div className="prediction-header-desc">Advanced pest and pathogen outbreak prediction</div>
          </div>
        </div>

        <form onSubmit={handlePredict}>
          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Sprout size={14} /> Crop</span>
            </div>
            <select 
              name="crop" 
              value={formData.crop} 
              onChange={handleInputChange}
              className="input"
            >
              <option value="wheat">Wheat</option>
              <option value="rice">Rice</option>
              <option value="tomato">Tomato</option>
              <option value="onion">Onion</option>
              <option value="cotton">Cotton</option>
            </select>
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Droplets size={14} /> Humidity</span>
              <span className="slider-value">{formData.humidity_pct}%</span>
            </div>
            <input type="range" name="humidity_pct" min="0" max="100" value={formData.humidity_pct} onChange={handleInputChange} className="slider-track sage" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Thermometer size={14} /> Temperature</span>
              <span className="slider-value">{formData.temp_c}°C</span>
            </div>
            <input type="range" name="temp_c" min="0" max="50" step="0.5" value={formData.temp_c} onChange={handleInputChange} className="slider-track warning" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Wind size={14} /> Wind Speed</span>
              <span className="slider-value">{formData.wind_speed_kph} km/h</span>
            </div>
            <input type="range" name="wind_speed_kph" min="0" max="80" value={formData.wind_speed_kph} onChange={handleInputChange} className="slider-track" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Droplets size={14} /> Soil Moisture</span>
              <span className="slider-value">{formData.soil_moisture}%</span>
            </div>
            <input type="range" name="soil_moisture" min="0" max="100" value={formData.soil_moisture} onChange={handleInputChange} className="slider-track info" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Sprout size={14} /> NDVI Index</span>
              <span className="slider-value">{formData.ndvi_index.toFixed(2)}</span>
            </div>
            <input type="range" name="ndvi_index" min="0" max="1" step="0.01" value={formData.ndvi_index} onChange={handleInputChange} className="slider-track sage" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><History size={14} /> Historical Pressure</span>
              <span className="slider-value">{(formData.historical_pressure * 100).toFixed(0)}%</span>
            </div>
            <input type="range" name="historical_pressure" min="0" max="1" step="0.01" value={formData.historical_pressure} onChange={handleInputChange} className="slider-track danger" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Droplets size={14} /> Leaf Wetness</span>
              <span className="slider-value">{formData.leaf_wetness_hrs} h/d</span>
            </div>
            <input type="range" name="leaf_wetness_hrs" min="0" max="24" value={formData.leaf_wetness_hrs} onChange={handleInputChange} className="slider-track" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Droplets size={14} /> 24h Rainfall</span>
              <span className="slider-value">{formData.last_24h_rainfall} mm</span>
            </div>
            <input type="range" name="last_24h_rainfall" min="0" max="200" value={formData.last_24h_rainfall} onChange={handleInputChange} className="slider-track" />
          </div>

          <button 
            onClick={handlePredict}
            disabled={loading}
            className="btn btn-primary run-btn"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
            {loading ? 'Calculating Bio-Risk...' : 'Run Forecast'}
          </button>
        </form>
      </div>

      <div className="prediction-results">
        <AnimatePresence mode="wait">
          {error && (
            <Motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="result-card"
              style={{ borderColor: 'var(--danger)', background: 'rgba(224,82,82,0.1)' }}
            >
              <p className="text-danger">{error}</p>
            </Motion.div>
          )}

          {!result && !loading && !error && (
            <div className="result-card result-empty">
              <Gauge size={64} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
              <h3 className="mb-sm">Engine Standby</h3>
              <p>Configure parameters and trigger the forecast to receive a risk profile.</p>
            </div>
          )}

          {loading && (
            <div className="result-card result-loading">
              <div className="loading-magnify">
                <Bug size={48} style={{ color: 'var(--gold)' }} />
              </div>
              <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>Analyzing neural pathways...</p>
            </div>
          )}

          {result && !loading && (
            <Motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="result-card">
                <div className="risk-gauge">
                  <div className="thermometer">
                    <div 
                      className="thermometer-fill" 
                      style={{ height: `${result.risk_score}%` }}
                    />
                  </div>
                  <div>
                    <div className="stat-number lg mb-sm">{result.risk_score.toFixed(0)}%</div>
                    <span className={`risk-level-badge ${getRiskLevelClass(result.risk_level)}`}>
                      {result.risk_level} Risk
                    </span>
                  </div>
                </div>
              </div>
              <div className="result-card mt-lg">
                <div className="flex items-center gap-sm mb-md" style={{ color: 'var(--info)' }}>
                  <ShieldCheck size={16} />
                  <span className="label">Neural Advisory</span>
                </div>
                <p className="yield-explanation">"{result.advisory}"</p>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PestForecastPage;
