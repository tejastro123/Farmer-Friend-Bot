import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, RefreshCw, ChevronLeft, Satellite, Calendar,
  Cloud, Layers, Grid, Clock, Filter, ZoomIn, ZoomOut,
  Move, Play, Pause, Eye, Download, Info, Map
} from 'lucide-react';
import { satelliteService } from '../services/api';

const SATELLITE_INFO = {
  "sentinel-1-grd": { name: "Sentinel-1 GRD", type: "SAR Radar", color: "#9C27B0" },
  "sentinel-2-l1c": { name: "Sentinel-2 L1C", type: "Optical", color: "#4CAF50" },
  "sentinel-2-l2a": { name: "Sentinel-2 L2A", type: "Optical", color: "#4CAF50" },
  "landsat-ot-l1": { name: "Landsat 8-9 OLI", type: "Optical", color: "#00B0FF" },
  "landsat-ot-l2": { name: "Landsat 8-9 OLI L2", type: "Optical", color: "#00B0FF" },
};

const SatelliteImageryPage = () => {
  const [location, setLocation] = useState({ lat: 17.3850, lon: 78.4867 });
  const [zoom, setZoom] = useState(10);
  const [selectedSatellite, setSelectedSatellite] = useState("sentinel-2-l2a");
  const [dateRange, setDateRange] = useState(30);
  const [cloudCover, setCloudCover] = useState(20);
  const [loading, setLoading] = useState(false);
  const [imagery, setImagery] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [mapErrors, setMapErrors] = useState([]);
  const mapRef = useRef(null);

  // Simulated imagery data - in production this would come from the API
  const generateImagery = () => {
    const images = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 3));
      
      images.push({
        id: `img_${Date.now()}_${i}`,
        date: date.toISOString().split('T')[0],
        cloud_cover: Math.random() * 30,
        provider: "ESA",
        type: selectedSatellite,
        bounds: {
          north: location.lat + 0.1,
          south: location.lat - 0.1,
          east: location.lon + 0.1,
          west: location.lon - 0.1
        }
      });
    }
    return images;
  };

  const fetchImagery = async () => {
    setLoading(true);
    try {
      const response = await satelliteService.searchSatellite({
        lat: location.lat,
        lon: location.lon,
        satellite: selectedSatellite,
        days: dateRange,
        cloud_cover: cloudCover
      });
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        if (data.items && data.items.length > 0) {
          setImagery(data.items);
          setSelectedImage(data.items[0]);
        } else {
          // Use generated data if API returns empty
          setImagery(generateImagery());
        }
      } else {
        setImagery(generateImagery());
      }
    } catch (e) {
      setImagery(generateImagery());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImagery();
  }, [selectedSatellite, location.lat, location.lon, dateRange, cloudCover]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getCloudColor = (cover) => {
    if (cover < 10) return '#4CAF50';
    if (cover < 20) return '#FF9800';
    return '#f44336';
  };

  return (
    <div className="si-page">
      <div className="si-header">
        <Link to="/crop-health" className="back-link">
          <ChevronLeft size={18} />
          Back to Data
        </Link>
        
        <div className="si-title">
          <Layers size={28} />
          <div>
            <h1>Satellite Imagery</h1>
            <p>Browse historical satellite imagery for your location</p>
          </div>
        </div>
      </div>

      <div className="si-layout">
        <div className="si-sidebar">
          <div className="sidebar-section">
            <h3><MapPin size={16} /> Location</h3>
            <div className="location-inputs">
              <input
                type="number"
                placeholder="Latitude"
                value={location.lat || ""}
                onChange={(e) => setLocation({ ...location, lat: parseFloat(e.target.value) || 0 })}
                step="0.0001"
              />
              <input
                type="number"
                placeholder="Longitude"
                value={location.lon || ""}
                onChange={(e) => setLocation({ ...location, lon: parseFloat(e.target.value) || 0 })}
                step="0.0001"
              />
            </div>
            
            <div className="zoom-controls">
              <button onClick={() => setZoom(Math.max(1, zoom - 1))}>
                <ZoomOut size={16} />
              </button>
              <span>Zoom: {zoom}x</span>
              <button onClick={() => setZoom(Math.min(18, zoom + 1))}>
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3><Filter size={16} /> Filters</h3>
            <div className="filter-group">
              <label>Satellite</label>
              <select 
                value={selectedSatellite}
                onChange={(e) => setSelectedSatellite(e.target.value)}
              >
                {Object.entries(SATELLITE_INFO).map(([id, info]) => (
                  <option key={id} value={id}>{info.name}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Time Range</label>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(parseInt(e.target.value))}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 6 months</option>
                <option value={365}>Last year</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Max Cloud Cover</label>
              <input
                type="range"
                min={0}
                max={100}
                value={cloudCover}
                onChange={(e) => setCloudCover(parseInt(e.target.value))}
              />
              <span className="range-value">{cloudCover}%</span>
            </div>

            <button className="btn btn-primary" onClick={fetchImagery}>
              <RefreshCw size={16} /> Search
            </button>
          </div>

          <div className="sidebar-section">
            <h3><Grid size={16} /> View</h3>
            <div className="view-toggles">
              <button 
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
              >
                <Grid size={16} /> Grid
              </button>
              <button 
                className={viewMode === "timeline" ? "active" : ""}
                onClick={() => setViewMode("timeline")}
              >
                <Clock size={16} /> Timeline
              </button>
            </div>
          </div>
        </div>

        <div className="si-main">
          <div className="map-container">
            <div className="map-placeholder">
              <Map size={64} />
              <h3>Interactive Map</h3>
              <p>Location: {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E</p>
              <p>Zoom: {zoom}x</p>
              <div className="map-overlay-info">
                <span>Satellite: {SATELLITE_INFO[selectedSatellite]?.name}</span>
                <span>Images: {imagery.length}</span>
              </div>
            </div>
            
            <div className="map-controls">
              <button title="Move up"><Move size={16} /></button>
              <div className="move-buttons">
                <button title="Move left"><Move size={16} /></button>
                <button title="Center"><MapPin size={16} /></button>
                <button title="Move right"><Move size={16} /></button>
              </div>
              <button title="Move down"><Move size={16} /></button>
            </div>
          </div>

          <div className="imagery-results">
            <div className="results-header">
              <h3>Available Imagery ({imagery.length})</h3>
              <span className="results-info">
                {location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°E
              </span>
            </div>

            {loading ? (
              <div className="loading-state">
                <RefreshCw className="spin" size={24} />
                <p>Loading imagery...</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="imagery-grid">
                {imagery.map((img, idx) => (
                  <div 
                    key={img.id || idx}
                    className={`imagery-card ${selectedImage?.id === img.id ? 'selected' : ''}`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <div className="card-preview">
                      <Layers size={24} />
                    </div>
                    <div className="card-info">
                      <span className="card-date">{img.date || formatDate(new Date())}</span>
                      <span 
                        className="card-cloud"
                        style={{ color: getCloudColor(img.cloud_cover || 0) }}
                      >
                        <Cloud size={12} /> {(img.cloud_cover || 0).toFixed(0)}%
                      </span>
                    </div>
                    <div className="card-provider">{img.provider || "ESA"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="imagery-timeline">
                {imagery.map((img, idx) => (
                  <div 
                    key={img.id || idx}
                    className={`timeline-item ${selectedImage?.id === img.id ? 'selected' : ''}`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <span className="timeline-date">{img.date || formatDate(new Date())}</span>
                      <span className="timeline-sat">{SATELLITE_INFO[selectedSatellite]?.name}</span>
                      <span 
                        className="timeline-cloud"
                        style={{ color: getCloudColor(img.cloud_cover || 0) }}
                      >
                        {(img.cloud_cover || 0).toFixed(0)}% cloud
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedImage && (
        <div className="image-details-panel">
          <div className="detail-header">
            <h3><Info size={18} /> Image Details</h3>
            <button className="close-btn" onClick={() => setSelectedImage(null)}>×</button>
          </div>
          
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">Date</span>
              <span className="value">{selectedImage.date || formatDate(new Date())}</span>
            </div>
            <div className="detail-item">
              <span className="label">Satellite</span>
              <span className="value">{SATELLITE_INFO[selectedSatellite]?.name}</span>
            </div>
            <div className="detail-item">
              <span className="label">Cloud Cover</span>
              <span className="value">{(selectedImage.cloud_cover || 0).toFixed(1)}%</span>
            </div>
            <div className="detail-item">
              <span className="label">Provider</span>
              <span className="value">{selectedImage.provider || "ESA"}</span>
            </div>
            <div className="detail-item">
              <span className="label">Resolution</span>
              <span className="value">{SATELLITE_INFO[selectedSatellite]?.name?.includes("Sentinel-2") ? "10m" : "30m"}</span>
            </div>
            <div className="detail-item">
              <span className="label">Type</span>
              <span className="value">{SATELLITE_INFO[selectedSatellite]?.type || "Optical"}</span>
            </div>
          </div>

          <div className="detail-actions">
            <button className="btn btn-primary">
              <Eye size={16} /> Preview
            </button>
            <button className="btn btn-secondary">
              <Download size={16} /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatelliteImageryPage;