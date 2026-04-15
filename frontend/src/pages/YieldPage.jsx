import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Droplets, Thermometer, Map, Activity, Loader2, Sprout, Wheat } from 'lucide-react';
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
    <div className="prediction-page yield-page">
      <div className="prediction-params">
        <div className="prediction-header">
          <Wheat size={24} />
          <div>
            <div className="prediction-header-title">Yield Simulator</div>
            <div className="prediction-header-desc">Precision harvest forecasting powered by XGBoost regression analysis</div>
          </div>
        </div>
        
        <form onSubmit={handlePredict}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="custom-slider">
              <div className="slider-label">
                <span className="slider-name"><Sprout size={14} /> Crop Type</span>
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
                <span className="slider-name"><Map size={14} /> Soil Profile</span>
              </div>
              <select 
                name="soil_type" 
                value={formData.soil_type} 
                onChange={handleInputChange}
                className="input"
              >
                <option value="alluvial">Alluvial</option>
                <option value="black">Black</option>
                <option value="red">Red</option>
                <option value="laterite">Laterite</option>
              </select>
            </div>
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Map size={14} /> Area (Acres)</span>
              <span className="slider-value">{formData.area_acres}</span>
            </div>
            <input 
              type="range" 
              name="area_acres" 
              min="0.5" 
              max="100" 
              step="0.5"
              value={formData.area_acres} 
              onChange={handleInputChange}
              className="slider-track gold"
            />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Thermometer size={14} /> Expected Temperature (°C)</span>
              <span className="slider-value">{formData.avg_temp_c}°C</span>
            </div>
            <input 
              type="range" 
              name="avg_temp_c" 
              min="10" 
              max="45" 
              step="0.5"
              value={formData.avg_temp_c} 
              onChange={handleInputChange}
              className="slider-track warning"
            />
          </div>

          <div className="custom-slider">
            <div className="slider-label">
              <span className="slider-name"><Droplets size={14} /> Total Expected Rainfall (mm)</span>
              <span className="slider-value">{formData.rainfall_mm} mm</span>
            </div>
            <input 
              type="range" 
              name="rainfall_mm" 
              min="0" 
              max="1500" 
              step="10"
              value={formData.rainfall_mm} 
              onChange={handleInputChange}
              className="slider-track info"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary run-btn"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Activity size={20} />}
            {loading ? 'Calculating...' : 'Predict Farm Output'}
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
              <Sprout size={64} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
              <h3 className="mb-sm">Awaiting Data</h3>
              <p>Adjust the simulation parameters and run the prediction to see estimated yield.</p>
            </div>
          )}

          {loading && (
            <div className="result-card result-loading">
              <div className="loading-wheat"></div>
              <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>Analyzing environmental model...</p>
            </div>
          )}

          {result && !loading && (
            <Motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="result-card">
                <div className="harvest-field">
                  {Array.from({ length: 40 }).map((_, i) => {
                    const fillPercent = (result.predict_tonnage / 20) * 100;
                    const threshold = (i / 40) * 100;
                    return (
                      <div 
                        key={i}
                        className={`harvest-cell ${threshold < fillPercent ? 'filled' : ''}`}
                        style={{ transitionDelay: `${i * 30}ms` }}
                      />
                    );
                  })}
                </div>
                <div className="yield-number">{result.predict_tonnage.toFixed(2)}</div>
                <div className="yield-unit">Metric Tons</div>
                <p className="yield-explanation mt-md">"{result.explanation}"</p>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default YieldPage;
