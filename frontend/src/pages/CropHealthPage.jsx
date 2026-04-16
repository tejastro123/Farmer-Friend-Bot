import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, RefreshCw, ChevronLeft, Satellite,
  Thermometer, Waves, Sprout, Radar, Target,
  AlertTriangle, Maximize2, Eye, Crosshair
} from 'lucide-react';
import { satelliteService } from '../services/api';

const SATELLITE_INFO = {
  "sentinel-1-grd": { name: "Sentinel-1 GRD", type: "SAR Radar", desc: "All-weather C-band imaging", color: "#9C27B0", icon: Radar },
  "sentinel-2-l1c": { name: "Sentinel-2 L1C", type: "Optical", desc: "Top-of-atmosphere", color: "#4CAF50", icon: Sprout },
  "sentinel-2-l2a": { name: "Sentinel-2 L2A", type: "Optical", desc: "Atmosphere-corrected", color: "#4CAF50", icon: Sprout },
  "landsat-tm-l1": { name: "Landsat 4-5 TM", type: "Optical", desc: "Thematic Mapper L1", color: "#FF9800", icon: Sprout },
  "landsat-tm-l2": { name: "Landsat 4-5 TM L2", type: "Optical", desc: "Surface reflectance", color: "#FF9800", icon: Sprout },
  "landsat-etm-l1": { name: "Landsat 7 ETM+", type: "Optical", desc: "Enhanced TM", color: "#FF9800", icon: Sprout },
  "landsat-etm-l2": { name: "Landsat 7 ETM+ L2", type: "Optical", desc: "Enhanced TM L2", color: "#FF9800", icon: Sprout },
  "landsat-ot-l1": { name: "Landsat 8-9 OLI", type: "Optical", desc: "Land Imager", color: "#00B0FF", icon: Sprout },
  "landsat-ot-l2": { name: "Landsat 8-9 OLI L2", type: "Optical", desc: "Surface Refl L2", color: "#00B0FF", icon: Sprout },
};

const CATEGORY_CONFIG = {
  vegetation: { label: "Vegetation & Crops", icon: Sprout, color: "#4CAF50" },
  water: { label: "Water & Moisture", icon: Waves, color: "#00B0FF" },
  temperature: { label: "Temperature & Thermal", icon: Thermometer, color: "#FF9800" },
  crop: { label: "Agriculture & Yield", icon: Target, color: "#FFD54F" },
  radar: { label: "Radar & SAR", icon: Radar, color: "#9C27B0" },
  other: { label: "Other Features", icon: Maximize2, color: "#607D8B" },
};

const SATELLITE_FEATURES = {
  "sentinel-1-grd": {
    radar: [
      { key: "flood_detection", label: "Flood Detection", desc: "Water accumulation detection" },
      { key: "soil_moisture_radar", label: "Soil Moisture", desc: "Radar-based soil moisture", unit: "%" },
      { key: "crop_structure", label: "Crop Structure", desc: "Canopy structure analysis" },
      { key: "surface_roughness", label: "Surface Roughness", desc: "Sigma-0 roughness" },
      { key: "polarimetry", label: "Polarimetry", desc: "VV/VH polarization" },
      { key: "wetland_detection", label: "Wetland Detection", desc: "Wetland mapping" },
      { key: "ice_detection", label: "Ice Detection", desc: "Ice/snow detection" },
      { key: "ship_detection", label: "Ship Detection", desc: "Maritime vessel detection" },
      { key: "oil_spill", label: "Oil Spill", desc: "Oil spill detection" },
      { key: "deformation", label: "Deformation", desc: "Ground deformation", unit: "mm" },
    ],
    vegetation: [],
    water: [],
    temperature: [],
    crop: [],
  },
  "sentinel-2-l1c": {
    vegetation: [
      { key: "ndvi", label: "NDVI", desc: "Normalized Difference Vegetation Index" },
      { key: "evi", label: "EVI", desc: "Enhanced Vegetation Index" },
      { key: "chlorophyll", label: "Chlorophyll", desc: "Chlorophyll-a concentration", unit: "μg/L" },
      { key: "vegetation_health", label: "Vegetation Health", desc: "Overall vegetation condition" },
      { key: "leaf_area_index", label: "LAI", desc: "Leaf Area Index", unit: "m²/m²" },
      { key: "canopy_water", label: "Canopy Water", desc: "Vegetation water content", unit: "%" },
    ],
    water: [
      { key: "ndwi", label: "NDWI", desc: "Normalized Difference Water Index" },
      { key: "burn_index", label: "Burn Index", desc: "Fire burn severity" },
      { key: "ndsi", label: "NDSI", desc: "Normalized Difference Snow Index" },
    ],
    temperature: [],
    crop: [
      { key: "crop_classification", label: "Crop Classification", desc: "Land cover type" },
    ],
  },
  "sentinel-2-l2a": {
    vegetation: [
      { key: "ndvi", label: "NDVI", desc: "Normalized Difference Vegetation Index" },
      { key: "evi", label: "EVI", desc: "Enhanced Vegetation Index" },
      { key: "chlorophyll_index", label: "Chlorophyll Index", desc: "Chlorophyll fluorescence", unit: "CI" },
      { key: "vegetation_vigor", label: "Vegetation Vigor", desc: "Plant vigor assessment" },
      { key: "vegetation_health", label: "Vegetation Health", desc: "Overall vegetation condition" },
      { key: "forest_health", label: "Forest Health", desc: "Forest condition" },
    ],
    water: [
      { key: "ndwi", label: "NDWI", desc: "Normalized Difference Water Index" },
      { key: "soil_moisture", label: "Soil Moisture", desc: "Surface soil water", unit: "%" },
      { key: "water_quality", label: "Water Quality", desc: "Inland water status" },
    ],
    temperature: [
      { key: "land_surface_temp", label: "Land Surface Temp", desc: "Surface temperature", unit: "°C" },
    ],
    crop: [
      { key: "crop_health", label: "Crop Health Score", desc: "Crop condition (0-100)" },
      { key: "crop_classification", label: "Crop Classification", desc: "Land cover type" },
      { key: "land_cover", label: "Land Cover", desc: "Surface classification" },
    ],
  },
  "landsat-tm-l1": {
    vegetation: [
      { key: "ndvi", label: "NDVI", desc: "Normalized Difference Vegetation Index" },
      { key: "vegetation_index", label: "Vegetation Index", desc: "Vegetation vigor" },
      { key: "vegetation_health", label: "Vegetation Health", desc: "Plant condition" },
    ],
    water: [
      { key: "water_quality", label: "Water Quality", desc: "Surface water status" },
      { key: "moisture_stress", label: "Moisture Stress", desc: "Water stress level" },
    ],
    temperature: [
      { key: "land_surface_temp", label: "Land Surface Temp", desc: "Surface temperature", unit: "°C" },
      { key: "thermal_anomaly", label: "Thermal Anomaly", desc: "Heat detection" },
    ],
    crop: [
      { key: "crop_yield_model", label: "Crop Yield Model", desc: "Yield estimation" },
      { key: "erosion_indicator", label: "Erosion Indicator", desc: "Soil erosion risk" },
    ],
    other: [
      { key: "urban_growth", label: "Urban Growth", desc: "Urban expansion" },
      { key: "snow_cover", label: "Snow Cover", desc: "Snow extent" },
      { key: "cloud_detection", label: "Cloud Cover", desc: "Cloud percentage", unit: "%" },
      { key: "geology", label: "Geology", desc: "Geological formation" },
    ],
  },
  "landsat-tm-l2": {
    vegetation: [
      { key: "ndvi_corrected", label: "NDVI Corrected", desc: "Atmosphere-corrected NDVI" },
      { key: "vegetation_index", label: "Vegetation Index", desc: "Vegetation vigor" },
    ],
    water: [
      { key: "water_stress", label: "Water Stress", desc: "Crop water demand" },
      { key: "algal_bloom", label: "Algal Bloom", desc: "Water quality", unit: "μg/L" },
    ],
    temperature: [
      { key: "surface_temperature", label: "Surface Temp", desc: "Land surface temperature", unit: "°C" },
      { key: "evapotranspiration", label: "Evapotranspiration", desc: "Daily ET rate", unit: "mm/day" },
    ],
    crop: [
      { key: "crop_yield_model", label: "Yield Model", desc: "Yield prediction" },
      { key: "soil_erosion", label: "Soil Erosion", desc: "Erosion risk" },
      { key: "drought_index", label: "Drought Index", desc: "Drought severity" },
      { key: "land_use", label: "Land Use", desc: "Land cover type" },
      { key: "biomass", label: "Biomass", desc: "Aboveground biomass", unit: "t/ha" },
    ],
  },
  "landsat-etm-l1": {
    vegetation: [
      { key: "ndvi", label: "NDVI", desc: "Normalized Difference Vegetation Index" },
      { key: "vegetation_analysis", label: "Vegetation Analysis", desc: "Vegetation index" },
      { key: "forest_health", label: "Forest Health", desc: "Forest condition" },
    ],
    water: [
      { key: "water_quality", label: "Water Quality", desc: "Surface water status" },
      { key: "wetland", label: "Wetland", desc: "Wetland mapping" },
    ],
    temperature: [
      { key: "thermal_mapping", label: "Thermal Mapping", desc: "Thermal imaging", unit: "°C" },
    ],
    crop: [
      { key: "agricultural", label: "Agricultural", desc: "Farming activity" },
      { key: "crop_yield_model", label: "Yield Model", desc: "Yield prediction" },
    ],
    other: [
      { key: "pan_chromatic", label: "Panchromatic", desc: "15m panchromatic band" },
      { key: "urban_change", label: "Urban Change", desc: "Built-up changes" },
      { key: "geological", label: "Geological", desc: "Geological mapping" },
      { key: "snow_detection", label: "Snow Detection", desc: "Snow cover" },
    ],
  },
  "landsat-etm-l2": {
    vegetation: [
      { key: "vegetation_index", label: "Vegetation Index", desc: "Vegetation vigor" },
      { key: "vegetation_health", label: "Vegetation Health", desc: "Plant condition" },
    ],
    water: [
      { key: "water_quality", label: "Water Quality", desc: "Surface water status" },
      { key: "flood_mapping", label: "Flood Mapping", desc: "Flood extent" },
    ],
    temperature: [
      { key: "surface_temp", label: "Surface Temp", desc: "Land temperature", unit: "°C" },
    ],
    crop: [
      { key: "crop_monitor", label: "Crop Monitor", desc: "Growth stage" },
      { key: "precision_ag", label: "Precision Ag", desc: "Variable rate" },
      { key: "yield_prediction", label: "Yield Prediction", desc: "Expected yield" },
      { key: "drought_monitor", label: "Drought Monitor", desc: "Drought conditions" },
    ],
    other: [
      { key: "surface_reflectance", label: "Surface Reflectance", desc: "Atmospheric corrected", unit: "SR" },
      { key: "pan_stretch", label: "Panchromatic", desc: "Resolution enhancement" },
      { key: "urban_expansion", label: "Urban Expansion", desc: "City growth" },
      { key: "fire_assessment", label: "Fire Assessment", desc: "Burned area" },
    ],
  },
  "landsat-ot-l1": {
    vegetation: [
      { key: "ndvi", label: "NDVI", desc: "Normalized Difference Vegetation Index" },
      { key: "vegetation_health", label: "Vegetation Health", desc: "Plant condition" },
      { key: "vegetation_index", label: "Vegetation Index", desc: "Vegetation vigor" },
    ],
    water: [
      { key: "water_quality", label: "Water Quality", desc: "Surface water status" },
      { key: "water_vapor", label: "Water Vapor", desc: "Atmospheric water", unit: "g/cm²" },
    ],
    temperature: [
      { key: "thermal_ir", label: "Thermal IR", desc: "Thermal imaging", unit: "°C" },
    ],
    crop: [
      { key: "crop_health", label: "Crop Health", desc: "Crop condition" },
      { key: "crop_yield_model", label: "Yield Model", desc: "Yield prediction" },
      { key: "invasive_species", label: "Invasive Species", desc: "Invasive plants" },
    ],
    other: [
      { key: "coastal_aerosol", label: "Coastal Aerosol", desc: "Coastal band" },
      { key: "nbr", label: "NBR", desc: "Normalized Burn Ratio" },
      { key: "carbon_index", label: "Carbon Index", desc: "Carbon estimation", unit: "C" },
      { key: "cloud_quality", label: "Cloud Quality", desc: "Image clarity", unit: "%" },
      { key: "pan_stretch", label: "Panchromatic", desc: "Resolution boost" },
      { key: "habitat_mapping", label: "Habitat", desc: "Ecosystem mapping" },
    ],
  },
  "landsat-ot-l2": {
    vegetation: [
      { key: "ndvi", label: "NDVI", desc: "Normalized Difference Vegetation Index" },
      { key: "vegetation_index", label: "Vegetation Index", desc: "Vegetation vigor" },
      { key: "vegetation_stress", label: "Vegetation Stress", desc: "Plant water stress" },
      { key: "vegetation_health", label: "Vegetation Health", desc: "Plant condition" },
    ],
    water: [
      { key: "soil_moisture", label: "Soil Moisture", desc: "Surface soil water", unit: "%" },
      { key: "crop_water", label: "Crop Water", desc: "Available water", unit: "%" },
      { key: "water_quality", label: "Water Quality", desc: "Surface water status" },
    ],
    temperature: [
      { key: "surface_temp_calibrated", label: "Surface Temp", desc: "Calibrated temperature", unit: "°C" },
      { key: "urban_heat", label: "Urban Heat", desc: "Heat island effect", unit: "°C" },
      { key: "evapotranspiration", label: "Evapotranspiration", desc: "Actual ET", unit: "mm/day" },
    ],
    crop: [
      { key: "crop_health", label: "Crop Health", desc: "Crop condition" },
      { key: "crop_yield_model", label: "Yield Model", desc: "Yield prediction" },
      { key: "precision_ag", label: "Precision Ag", desc: "Site-specific" },
      { key: "drought_severity", label: "Drought Severity", desc: "PDSI drought index" },
      { key: "fire_risk", label: "Fire Risk", desc: "Fire danger" },
    ],
    other: [
      { key: "surface_reflectance", label: "Surface Reflectance", desc: "Bottom-of-atmosphere", unit: "SR" },
      { key: "biodiversity", label: "Biodiversity", desc: "Species richness" },
      { key: "carbon_stock", label: "Carbon Stock", desc: "Aboveground carbon", unit: "tC/ha" },
    ],
  },
};

const CropHealthPage = () => {
  const [location, setLocation] = useState({ lat: 17.3850, lon: 78.4867 });
  const [locationName, setLocationName] = useState("");
  const [selectedSatellite, setSelectedSatellite] = useState("sentinel-2-l2a");
  const [days, setDays] = useState(30);
  const [cloudCover, setCloudCover] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [locating, setLocating] = useState(false);

  const satelliteFeatures = SATELLITE_FEATURES[selectedSatellite] || {};
  const categories = Object.keys(satelliteFeatures).filter(k => satelliteFeatures[k]?.length > 0);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: parseFloat(position.coords.latitude.toFixed(6)),
          lon: parseFloat(position.coords.longitude.toFixed(6))
        });
        setLocating(false);
        fetchData();
      },
      (err) => {
        setError("Unable to get location: " + err.message);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [featuresRes, geoRes] = await Promise.all([
        satelliteService.getSatelliteFeatures({
          lat: location.lat,
          lon: location.lon,
          satellite: selectedSatellite,
          crop: "general"
        }),
        satelliteService.reverseGeocode(location.lat, location.lon).catch(() => ({ data: { success: false } }))
      ]);
      
      const result = featuresRes.data;
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load data");
      }
      
      if (geoRes.data?.success) {
        setLocationName(geoRes.data.data.formatted || geoRes.data.data.display_name || "");
      }
    } catch (err) {
      setError(err.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSatellite, location.lat, location.lon]);

  const formatValue = (feature, value) => {
    if (!value) return "-";
    
    // Handle objects like {vv: 0.x, vh: 0.y} - display as JSON
    if (typeof value === "object") {
      // Extract the primary numeric value - check value, score, index, vv keys
      const numVal = value.value ?? value.score ?? value.index ?? value.vv;
      
      if (numVal !== undefined && typeof numVal === "number" && !isNaN(numVal)) {
        return numVal > 10 ? Math.round(numVal) : numVal.toFixed(2);
      }
      
      // No numeric value found - display status or other field
      if (value.status) return value.status;
      if (value.risk) return value.risk;
      if (value.classification) return value.classification;
      if (value.type) return value.type;
      
      // Fallback - display object as string
      return Object.keys(value).length > 0 ? JSON.stringify(value) : "-";
    }
    
    // Handle primitive values
    if (typeof value === "number" && !isNaN(value)) {
      return value > 10 ? Math.round(value) : value.toFixed(2);
    }
    return String(value);
  };

  const getStatus = (value) => {
    return value?.status || value?.risk || value?.classification || null;
  };

  const getUnit = (feature, value) => {
    return value?.unit || feature.unit || "";
  };

  const getStatusClass = (status) => {
    if (!status) return "";
    const good = ["healthy", "good", "optimal", "vigorous", "low", "normal", "clear", "no_snow", "no_fire", "none", "stable", "adequate", "dry", "active"];
    const bad = ["stressed", "high", "critical", "severe"];
    
    if (good.includes(status)) return "status-good";
    if (bad.includes(status)) return "status-bad";
    return "status-neutral";
  };

  return (
    <div className="sc-page">
      <div className="sc-header">
        <Link to="/farm" className="back-link">
          <ChevronLeft size={18} />
          Back to Farm
        </Link>
        
        <div className="sc-title">
          <Satellite size={28} />
          <div>
            <h1>Satellite Data Center</h1>
            <p>Advanced remote sensing for precision agriculture</p>
          </div>
        </div>
      </div>

      <div className="sc-controls">
        <div className="ctrl-group">
          <label><MapPin size={14} /> Location</label>
          <div className="inputs-row">
            <input
              type="number"
              placeholder="Latitude"
              value={location.lat || ""}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setLocation({ ...location, lat: val });
              }}
              step="0.0001"
            />
            <input
              type="number"
              placeholder="Longitude"
              value={location.lon || ""}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setLocation({ ...location, lon: val });
              }}
              step="0.0001"
            />
            <button 
              className="btn-locate" 
              onClick={getCurrentLocation}
              disabled={locating}
              title="Use current location"
            >
              <Crosshair size={14} className={locating ? "spinning" : ""} />
              {locating ? "Locating..." : "Live"}
            </button>
          </div>
          {locationName && (
            <div className="location-name">
              <MapPin size={12} /> {locationName}
            </div>
          )}
        </div>

        <div className="ctrl-group">
          <label><Satellite size={14} /> Satellite</label>
          <select
            value={selectedSatellite}
            onChange={(e) => setSelectedSatellite(e.target.value)}
          >
            {Object.entries(SATELLITE_INFO).map(([id, info]) => (
              <option key={id} value={id}>{info.name}</option>
            ))}
          </select>
        </div>

        <div className="ctrl-group">
          <label><Maximize2 size={14} /> Range</label>
          <div className="inputs-row small">
            <div className="input-wrap">
              <span>Days</span>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                min={1}
                max={365}
              />
            </div>
            <div className="input-wrap">
              <span>Cloud</span>
              <input
                type="number"
                value={cloudCover}
                onChange={(e) => setCloudCover(parseInt(e.target.value))}
                min={0}
                max={100}
              />
            </div>
          </div>
        </div>

        <button className="btn-refresh" onClick={fetchData}>
          <RefreshCw size={18} className={loading ? "spinning" : ""} />
        </button>
      </div>

      {loading && (
        <div className="sc-loading">
          <div className="loader"></div>
          <p>Loading satellite data...</p>
        </div>
      )}

      {error && (
        <div className="sc-error">
          <AlertTriangle size={24} />
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={fetchData}>Retry</button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="sc-info">
            <div className="info-badge">
              <span className="name">{data.name}</span>
              <span className="type">{data.type}</span>
              <span className="res">{data.resolution}</span>
            </div>
            <div className="location-info">
              <MapPin size={14} />
              {data.location?.lat?.toFixed(4)}°N, {data.location?.lon?.toFixed(4)}°E
            </div>
          </div>

          <div className="features-container">
            <h2><Maximize2 size={20} /> Features by Category</h2>
            
            {categories.map((cat) => {
              const catConfig = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
              const features = satelliteFeatures[cat] || [];
              const Icon = catConfig.icon;
              
              return (
                <div key={cat} className={`category-section ${cat}`}>
                  <div className="category-header" style={{ "--cat-color": catConfig.color }}>
                    <Icon size={20} />
                    <h3>{catConfig.label}</h3>
                    <span className="cat-count">{features.length} features</span>
                  </div>
                  
                  <div className="features-grid-full">
                    {features.map((feature) => {
                      const value = data.features?.[feature.key];
                      const status = getStatus(value);
                      const unit = getUnit(feature, value);
                      const val = formatValue(feature, value);
                      
                      return (
                        <div key={feature.key} className={`feature-tile ${status ? getStatusClass(status) : ""}`}>
                          <div className="feature-header">
                            <span className="feature-title">{feature.label}</span>
                            {status && <span className="status-pill">{status}</span>}
                          </div>
                          <div className="feature-val">
                            {val}
                            {unit && <span className="feature-unit">{unit}</span>}
                          </div>
                          <div className="feature-desc">{feature.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && !error && !data && (
        <div className="sc-empty">
          <Satellite size={48} />
          <p>Select a satellite to view features</p>
        </div>
      )}

      <div className="sc-footer">
        <h3>Available Satellite Datasets</h3>
        <div className="sat-list">
          {Object.entries(SATELLITE_INFO).map(([id, info]) => (
            <div 
              key={id} 
              className={`sat-card ${selectedSatellite === id ? "active" : ""}`}
              onClick={() => setSelectedSatellite(id)}
              style={{ "--sat-color": info.color }}
            >
              <strong>{info.name}</strong>
              <span className="type">{info.type}</span>
              <span className="desc">{info.desc}</span>
              <span className="feat-count">{Object.values(SATELLITE_FEATURES[id] || {}).reduce((a, b) => a + (b?.length || 0), 0)} features</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CropHealthPage;