import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, RefreshCw, ChevronLeft, Layers, Calendar,
  Cloud, Layers as LayersIcon, Clock, Filter, ZoomIn, ZoomOut,
  Move, Eye, Download, Info, Map, X, ExternalLink,
  Compass, Target
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { satelliteService } from '../services/api';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const SATELLITE_INFO = {
  "sentinel-1-grd": { name: "Sentinel-1 GRD", type: "SAR Radar", color: "#9C27B0", res: "10m" },
  "sentinel-2-l1c": { name: "Sentinel-2 L1C", type: "Optical", color: "#4CAF50", res: "10m" },
  "sentinel-2-l2a": { name: "Sentinel-2 L2A", type: "Optical", color: "#4CAF50", res: "10m" },
  "landsat-ot-l1": { name: "Landsat 8-9 OLI", type: "Optical", color: "#00B0FF", res: "30m" },
  "landsat-ot-l2": { name: "Landsat 8-9 OLI L2", type: "Optical", color: "#00B0FF", res: "30m" },
};

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

const SatelliteImageryPage = () => {
  const [location, setLocation] = useState({ lat: 17.3850, lon: 78.4867 });
  const [zoom, setZoom] = useState(11);
  const [selectedSatellite, setSelectedSatellite] = useState("sentinel-2-l2a");
  const [dateRange, setDateRange] = useState(30);
  const [cloudCover, setCloudCover] = useState(20);
  const [loading, setLoading] = useState(false);
  const [imagery, setImagery] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [isDemo, setIsDemo] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [mapLayer, setMapLayer] = useState("osm");
  const mapRef = useRef(null);

  const MAP_LAYERS = {
    osm: { name: "OpenStreetMap", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
    satellite: { name: "Satellite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: 'Esri' },
  };

  const fetchImagery = async () => {
    setLoading(true);
    setIsDemo(false);
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
          setIsDemo(data.demo || false);
        } else {
          setImagery([]);
        }
      }
    } catch (e) {
      console.error("Error fetching imagery:", e);
      setImagery([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImagery();
  }, []);

  const handleMapClick = (newLocation) => {
    setLocation(newLocation);
    fetchImagery();
  };

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

  const handleDownload = (image) => {
    const planetAssetUrl = `https://planet.com/data/v1/download?id=${image.id}`;
    window.open(planetAssetUrl, '_blank');
  };

  const handlePreview = (image) => {
    setPreviewImage(image);
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
            </div>
            <button className="btn-use-location" onClick={fetchImagery}>
              <Target size={14} /> Search This Area
            </button>
            
            <div className="zoom-label">
              <ZoomOut size={14} />
              <input
                type="range"
                min={8}
                max={16}
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
              />
              <ZoomIn size={14} />
              <span>Zoom: {zoom}</span>
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
              <label>Max Cloud Cover: {cloudCover}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={cloudCover}
                onChange={(e) => setCloudCover(parseInt(e.target.value))}
              />
            </div>

            <button className="btn btn-primary full-width" onClick={fetchImagery}>
              <RefreshCw size={16} /> Search Imagery
            </button>
          </div>

          <div className="sidebar-section">
            <h3><LayersIcon size={16} /> View Mode</h3>
            <div className="view-toggles">
              <button 
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
              >
                <LayersIcon size={16} /> Grid
              </button>
              <button 
                className={viewMode === "timeline" ? "active" : ""}
                onClick={() => setViewMode("timeline")}
              >
                <Clock size={16} /> Timeline
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3><Map size={16} /> Map Type</h3>
            <div className="view-toggles">
              <button 
                className={mapLayer === "osm" ? "active" : ""}
                onClick={() => setMapLayer("osm")}
              >
                Map
              </button>
              <button 
                className={mapLayer === "satellite" ? "active" : ""}
                onClick={() => setMapLayer("satellite")}
              >
                Satellite
              </button>
            </div>
          </div>

          {isDemo && (
            <div className="demo-notice">
              <Info size={14} />
              <span>Showing demo data. Connect Planet API for real imagery.</span>
            </div>
          )}
        </div>

        <div className="si-main">
          <div className="map-container">
            <MapContainer
              center={[location.lat, location.lon]}
              zoom={zoom}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                attribution={MAP_LAYERS[mapLayer].attribution}
                url={MAP_LAYERS[mapLayer].url}
              />
              <Marker position={[location.lat, location.lon]}>
                <Popup>
                  <div className="map-popup">
                    <strong>Search Location</strong>
                    <p>{location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E</p>
                    <small>Click map to move location</small>
                  </div>
                </Popup>
              </Marker>
              <MapClickHandler onMapClick={handleMapClick} />
            </MapContainer>
            
            <div className="map-overlay">
              <div className="map-info">
                <span><MapPin size={12} /> {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E</span>
                <span>|</span>
                <span>{imagery.length} images</span>
                {isDemo && <span className="demo-badge">DEMO</span>}
              </div>
            </div>
          </div>

          <div className="imagery-results">
            <div className="results-header">
              <h3>
                <LayersIcon size={18} /> 
                Available Imagery ({imagery.length})
              </h3>
              <span className="results-info">
                {SATELLITE_INFO[selectedSatellite]?.name} | {SATELLITE_INFO[selectedSatellite]?.res}
              </span>
            </div>

            {loading ? (
              <div className="loading-state">
                <RefreshCw className="spin" size={24} />
                <p>Searching satellite imagery...</p>
              </div>
            ) : imagery.length === 0 ? (
              <div className="empty-state">
                <Map size={48} />
                <p>No imagery found for this location</p>
                <p className="hint">Try increasing the cloud cover or time range</p>
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
                    <div className="card-actions">
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(img);
                        }}
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(img);
                        }}
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    </div>
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
                    <div 
                      className="timeline-marker" 
                      style={{ backgroundColor: getCloudColor(img.cloud_cover || 0) }}
                    />
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
                    <div className="timeline-actions">
                      <button onClick={(e) => { e.stopPropagation(); handlePreview(img); }}>
                        <Eye size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(img); }}>
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="preview-modal" onClick={() => setPreviewImage(null)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>Image Preview</h3>
              <button className="close-btn" onClick={() => setPreviewImage(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="preview-image">
              <Layers size={64} />
              <p>Satellite Image Preview</p>
              <p className="hint">Connect Planet API to see actual imagery</p>
            </div>

            <div className="preview-details">
              <div className="detail-row">
                <span className="label">Date</span>
                <span className="value">{previewImage.date}</span>
              </div>
              <div className="detail-row">
                <span className="label">Satellite</span>
                <span className="value">{SATELLITE_INFO[selectedSatellite]?.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Cloud Cover</span>
                <span className="value" style={{ color: getCloudColor(previewImage.cloud_cover) }}>
                  {previewImage.cloud_cover?.toFixed(1)}%
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Resolution</span>
                <span className="value">{SATELLITE_INFO[selectedSatellite]?.res}</span>
              </div>
              <div className="detail-row">
                <span className="label">Provider</span>
                <span className="value">{previewImage.provider || "ESA/USGS"}</span>
              </div>
            </div>

            <div className="preview-actions">
              <button className="btn btn-primary" onClick={() => handleDownload(previewImage)}>
                <Download size={16} /> Download
              </button>
              <button className="btn btn-secondary" onClick={() => setPreviewImage(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatelliteImageryPage;