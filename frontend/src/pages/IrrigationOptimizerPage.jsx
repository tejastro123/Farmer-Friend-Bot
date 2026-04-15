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
      [name]: name === "crop" || name === "water_source" ? value : Number(value)
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
      case 'URGENT': return 'var(--warning)';
      case 'MODERATE': return 'var(--info)';
      default: return 'var(--sage)';
    }
  };

  const getStatusLevelClass = (status) => {
    switch (status) {
      case 'CRITICAL': return 'critical';
      case 'URGENT': return 'high';
      case 'MODERATE': return 'moderate';
      default: return 'low';
    }
  };

  const waterSourceIcons = {
    canal: '🌊',
    tubewell: '⚙️',
    pond: '💧'
  };

  return (
    <div className="prediction-page irrigation-page">
      <div className="prediction-params">
        <div className="prediction-header">
          <Droplets size={24} />
          <div>
            <div className="prediction-header-title">Hydro-A.I. Optimizer</div>
            <div className="prediction-header-desc">Precision water lifecycle management</div>
          </div>
        </div>

        <form onSubmit={handlePredict}>
          <div className="water-source-selector">
            {['canal', 'tubewell', 'pond'].map(source => (
              <button
                key={source}
                type="button"
                onClick={() => setFormData(p => ({ ...p, water_source: source }))}
                className={`water-source-btn ${formData.water_source === source ? 'active' : ''}`}
              >
                <span>{waterSourceIcons[source]}</span>
                <span>{source}</span>
              </button>
            ))}
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Droplets size={14} /> Soil Moisture</span>
              <span className="slider-value">{formData.soil_moisture}%</span>
            </div>
            <input type="range" name="soil_moisture" min="0" max="100" value={formData.soil_moisture} onChange={handleInputChange} className="slider-track sage" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Waves size={14} /> Water Source Stock</span>
              <span className="slider-value">{(formData.water_availability * 100).toFixed(0)}%</span>
            </div>
            <input type="range" name="water_availability" min="0" max="1" step="0.01" value={formData.water_availability} onChange={handleInputChange} className="slider-track info" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Thermometer size={14} /> Temperature</span>
              <span className="slider-value">{formData.temp_c}°C</span>
            </div>
            <input type="range" name="temp_c" min="15" max="50" step="0.5" value={formData.temp_c} onChange={handleInputChange} className="slider-track warning" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Sun size={14} /> Solar Intensity</span>
              <span className="slider-value">{(formData.solar_intensity * 100).toFixed(0)}%</span>
            </div>
            <input type="range" name="solar_intensity" min="0" max="1" step="0.01" value={formData.solar_intensity} onChange={handleInputChange} className="slider-track" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Wind size={14} /> Wind (Evap. Force)</span>
              <span className="slider-value">{formData.wind_speed_kph} km/h</span>
            </div>
            <input type="range" name="wind_speed_kph" min="0" max="60" value={formData.wind_speed_kph} onChange={handleInputChange} className="slider-track" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Droplets size={14} /> Rain Forecast</span>
              <span className="slider-value">{formData.rainfall_forecast_mm} mm</span>
            </div>
            <input type="range" name="rainfall_forecast_mm" min="0" max="100" value={formData.rainfall_forecast_mm} onChange={handleInputChange} className="slider-track sage" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Sprout size={14} /> Crop Lifecycle</span>
              <span className="slider-value">{formData.crop_age_days} Days</span>
            </div>
            <input type="range" name="crop_age_days" min="1" max="180" value={formData.crop_age_days} onChange={handleInputChange} className="slider-track gold" />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Activity size={14} /> Leaf Area Index</span>
              <span className="slider-value">{formData.leaf_area_index.toFixed(1)}</span>
            </div>
            <input type="range" name="leaf_area_index" min="0.5" max="6" step="0.1" value={formData.leaf_area_index} onChange={handleInputChange} className="slider-track" />
          </div>

          <button 
            onClick={handlePredict}
            disabled={loading}
            className="btn btn-primary run-btn"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Droplets size={20} />}
            {loading ? 'Analyzing Hydraulics...' : 'Optimize Water Cycle'}
          </button>
        </form>
      </div>

      <div className="prediction-results">
        <AnimatePresence mode="wait">
          {error && (
            <Motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="result-card"
              style={{ borderColor: 'var(--danger)', background: 'rgba(224,82,82,0.1)' }}
            >
              <p className="text-danger">{error}</p>
            </Motion.div>
          )}

          {!result && !loading && !error && (
            <div className="result-card result-empty">
              <Waves size={64} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
              <h3 className="mb-sm">Engines Ready</h3>
              <p>Input sensor data to determine optimal watering windows.</p>
            </div>
          )}

          {loading && (
            <div className="result-card result-loading">
              <div className="loading-drops"></div>
              <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>Running neural fluid dynamics...</p>
            </div>
          )}

          {result && !loading && (
            <Motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="result-card">
                <div className="water-level-container">
                  <div className="water-circle">
                    <div 
                      className="water-wave"
                      style={{ height: `${result.irrigation_probability}%` }}
                    />
                  </div>
                  <div className="water-level-percent">
                    {result.irrigation_probability.toFixed(0)}%
                  </div>
                </div>
                <div className="mt-lg">
                  <span className={`risk-level-badge ${getStatusLevelClass(result.status)}`}>
                    {result.status}
                  </span>
                </div>
              </div>
              <div className="result-card mt-lg">
                <div className="flex items-center gap-sm mb-md" style={{ color: 'var(--info)' }}>
                  <Clock size={16} />
                  <span className="label">Optimal Watering Window</span>
                </div>
                <p className="yield-explanation">"{result.recommendation}"</p>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default IrrigationOptimizerPage;
