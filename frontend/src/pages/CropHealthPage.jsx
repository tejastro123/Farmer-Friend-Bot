import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Leaf, MapPin, Droplets, Sun, CloudRain, TrendingUp, 
  AlertTriangle, Download, RefreshCw, Activity, Target,
  Calendar, ChevronLeft, Satellite, Settings, Layers
} from 'lucide-react';
import { satelliteService } from '../services/api';

const SATELLITES = {
  "sentinel-1-grd": { name: "Sentinel-1 GRD", type: "Radar", desc: "All-weather, day/night imaging" },
  "sentinel-2-l1c": { name: "Sentinel-2 L1C", type: "Optical", desc: "Top-of-atmosphere" },
  "sentinel-2-l2a": { name: "Sentinel-2 L2A", type: "Optical", desc: "Atmosphere corrected" },
  "landsat-tm-l1": { name: "Landsat 4-5 TM", type: "Optical", desc: "Thematic Mapper" },
  "landsat-tm-l2": { name: "Landsat 4-5 TM L2", type: "Optical", desc: "Surface reflectance" },
  "landsat-etm-l1": { name: "Landsat 7 ETM+", type: "Optical", desc: "Enhanced TM" },
  "landsat-etm-l2": { name: "Landsat 7 ETM+ L2", type: "Optical", desc: "Enhanced TM L2" },
  "landsat-ot-l1": { name: "Landsat 8-9 OLI", type: "Optical", desc: "Operational Land Imager" },
  "landsat-ot-l2": { name: "Landsat 8-9 OLI L2", type: "Optical", desc: "Surface reflectance" },
};

const CropHealthPage = () => {
  const [location, setLocation] = useState({ lat: 17.3850, lon: 78.4867 });
  const [selectedSatellite, setSelectedSatellite] = useState("sentinel-2-l2a");
  const [settings, setSettings] = useState({ days: 30, cloudCover: 20 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("features");
  const [data, setData] = useState(null);
  const [satellites, setSatellites] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSatellites();
  }, []);

  useEffect(() => {
    if (activeTab === "features") {
      fetchFeatures();
    } else if (activeTab === "search") {
      fetchSearch();
    }
  }, [selectedSatellite, settings.days, settings.cloudCover]);

  const loadSatellites = async () => {
    try {
      const res = await satelliteService.listSatellites();
      setSatellites(res.data.satellites || {});
    } catch (e) {
      console.error("Failed to load satellites", e);
    }
  };

  const fetchFeatures = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await satelliteService.getSatelliteFeatures({
        lat: location.lat,
        lon: location.lon,
        satellite: selectedSatellite,
        crop: "general"
      });
      setData(response.data.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch features');
    } finally {
      setLoading(false);
    }
  };

  const fetchSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await satelliteService.searchSatellite({
        lat: location.lat,
        lon: location.lon,
        satellite: selectedSatellite,
        days: settings.days,
        cloud_cover: settings.cloudCover
      });
      setData(response.data.data);
    } catch (err) {
      setError(err.message || 'Failed to search');
    } finally {
      setLoading(false);
    }
  };

  const renderFeatureValue = (featureKey, featureData) => {
    if (!featureData) return "-";
    if (typeof featureData === "object") {
      if (featureData.value !== undefined) {
        const val = typeof featureData.value === "number" ? featureData.value.toFixed(2) : featureData.value;
        const unit = featureData.unit || "";
        return (
          <span>
            {val} {unit}
            {featureData.status && (
              <span className={`status-tag ${featureData.status}`}>{featureData.status}</span>
            )}
          </span>
        );
      }
      return JSON.stringify(featureData);
    }
    return featureData;
  };

  const getFeatureCategory = (featureKey) => {
    const categories = {
      vegetation: ["ndvi", "ndwi", "evi", "vegetation_health", "vegetation_vigor", "crop_health", "vegetation_index", "vegetation_analysis", "vegetation_stress"],
      water: ["soil_moisture", "ndwi", "water_quality", "canopy_water", "crop_water", "water_stress", "evapotranspiration", "drought_index", "drought_monitor", "drought_severity"],
      temperature: ["land_surface_temp", "surface_temperature", "thermal_mapping", "thermal_anomaly", "thermal_ir", "surface_temp_calibrated", "urban_heat"],
      crop: ["crop_classification", "crop_monitor", "crop_yield_model", "precision_ag", "yield_prediction", "agricultural"],
      radar: ["flood_detection", "soil_moisture_radar", "crop_structure", "surface_roughness", "polarimetry", "wetland_detection", "ice_detection", "deformation"],
      other: []
    };
    for (const [cat, keys] of Object.entries(categories)) {
      if (keys.includes(featureKey)) return cat;
    }
    return "other";
  };

  const renderFeatures = () => {
    if (!data || !data.features) return null;
    
    const features = data.features;
    const categories = {
      vegetation: {},
      water: {},
      temperature: {},
      crop: {},
      radar: {},
      other: {}
    };

    for (const [key, value] of Object.entries(features)) {
      const cat = getFeatureCategory(key);
      categories[cat][key] = value;
    }

    return (
      <div className="features-grid">
        {Object.entries(categories).map(([cat, items]) => {
          if (Object.keys(items).length === 0) return null;
          return (
            <div key={cat} className={`feature-category ${cat}`}>
              <h4>
                {cat === "vegetation" && <Leaf size={18} />}
                {cat === "water" && <Droplets size={18} />}
                {cat === "temperature" && <Sun size={18} />}
                {cat === "crop" && <Target size={18} />}
                {cat === "radar" && <Satellite size={18} />}
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </h4>
              <div className="feature-list">
                {Object.entries(items).map(([key, value]) => (
                  <div key={key} className="feature-item">
                    <span className="feature-name">{key.replace(/_/g, " ")}</span>
                    <span className="feature-value">{renderFeatureValue(key, value)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const tabs = [
    { id: "features", label: "Features", icon: Layers },
    { id: "search", label: "Search", icon: Satellite },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/farm" className="back-link">
          <ChevronLeft size={20} />
          Back to Farm
        </Link>
        <h1>
          <Satellite size={24} />
          Satellite Data Center
        </h1>
        <p>Advanced satellite imagery and analysis for Indian agriculture</p>
      </div>

      <div className="settings-grid">
        <div className="card location-input">
          <MapPin size={18} />
          <input
            type="number"
            placeholder="Latitude"
            value={location.lat}
            onChange={(e) => setLocation({ ...location, lat: parseFloat(e.target.value) })}
            step="0.0001"
          />
          <input
            type="number"
            placeholder="Longitude"
            value={location.lon}
            onChange={(e) => setLocation({ ...location, lon: parseFloat(e.target.value) })}
            step="0.0001"
          />
        </div>

        <div className="card">
          <label>
            <Satellite size={16} />
            Satellite Dataset
          </label>
          <select
            value={selectedSatellite}
            onChange={(e) => setSelectedSatellite(e.target.value)}
            className="satellite-select"
          >
            {Object.entries(SATELLITES).map(([id, sat]) => (
              <option key={id} value={id}>
                {sat.name} - {sat.desc}
              </option>
            ))}
          </select>
        </div>

        <div className="card settings-card">
          <label>
            <Settings size={16} />
            Settings
          </label>
          <div className="settings-row">
            <div className="setting">
              <span>Days Back</span>
              <input
                type="number"
                value={settings.days}
                onChange={(e) => setSettings({ ...settings, days: parseInt(e.target.value) })}
                min={1}
                max={365}
              />
            </div>
            <div className="setting">
              <span>Cloud Cover %</span>
              <input
                type="number"
                value={settings.cloudCover}
                onChange={(e) => setSettings({ ...settings, cloudCover: parseFloat(e.target.value) })}
                min={0}
                max={100}
              />
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={activeTab === "features" ? fetchFeatures : fetchSearch}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading">
          <RefreshCw className="spin" size={32} />
          <p>Loading satellite data...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {!loading && !error && data && activeTab === "features" && (
        <div className="satellite-info">
          <div className="info-header">
            <h2>{data.name}</h2>
            <div className="info-badges">
              <span className="badge type">{data.type}</span>
              <span className="badge res">{data.resolution}</span>
            </div>
          </div>
          {renderFeatures()}
        </div>
      )}

      {!loading && !error && data && activeTab === "search" && (
        <div className="search-results">
          <h3>Search Results</h3>
          <p className="results-count">{data.count || 0} images found</p>
          {data.items && data.items.length > 0 && (
            <div className="items-list">
              {data.items.slice(0, 10).map((item, i) => (
                <div key={i} className="item-card">
                  <div className="item-id">{item.id}</div>
                  <div className="item-details">
                    <span>Acquired: {item.acquired?.split("T")[0]}</span>
                    <span>Cloud: {item.cloud_cover}%</span>
                    <span>Provider: {item.provider}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.items?.length === 0 && (
            <p className="no-results">No imagery found. Try adjusting settings.</p>
          )}
        </div>
      )}

      <div className="satellites-info">
        <h4>Available Satellite Datasets</h4>
        <div className="satellites-grid">
          {Object.entries(SATELLITES).map(([id, sat]) => (
            <div key={id} className={`sat-card ${selectedSatellite === id ? 'active' : ''}`}>
              <strong>{sat.name}</strong>
              <span>{sat.type}</span>
              <small>{sat.desc}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CropHealthPage;