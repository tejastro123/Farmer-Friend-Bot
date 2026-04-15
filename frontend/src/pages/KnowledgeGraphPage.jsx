import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Search, Compass, BookOpen, 
  ChevronRight, Activity, Filter, Info,
  ExternalLink, Maximize2, Zap, ShieldCheck,
  Plus, Minus, RotateCcw, MapPin, GitBranch,
  Sparkles, LayoutGrid
} from 'lucide-react';
import { graphService } from '../services/api';

const KnowledgeGraphPage = () => {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoom, setZoom] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const svgRef = useRef(null);

  useEffect(() => {
    fetchGraph();
  }, []);

  const fetchGraph = async () => {
    try {
      const res = await graphService.getGraph();
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch knowledge graph:", err);
    } finally {
      setLoading(false);
    }
  };

  const nodeTypes = [...new Set(data.nodes.map(n => n.type || 'entity'))];
  
  const filteredNodes = data.nodes.filter(n => {
    const matchesSearch = n.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || n.type === filterType;
    return matchesSearch && matchesType;
  });

  const getNodeColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('crop')) return 'var(--sage)';
    if (t.includes('disease') || t.includes('pest')) return 'var(--danger)';
    if (t.includes('fertilizer')) return 'var(--gold)';
    if (t.includes('chemical')) return 'var(--info)';
    if (t.includes('weather')) return '#8B9CD5';
    return 'rgba(245,240,232,0.3)';
  };

  const getNodeClass = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('crop')) return 'crops';
    if (t.includes('disease') || t.includes('pest')) return 'diseases';
    if (t.includes('fertilizer')) return 'fertilizers';
    if (t.includes('chemical')) return 'chemicals';
    if (t.includes('weather')) return 'weather';
    return '';
  };

  const getRelationships = (nodeId) => {
    if (!data.links) return [];
    return data.links.filter(l => l.source === nodeId || l.target === nodeId);
  };

  const getConnectedNodes = (nodeId) => {
    if (!data.links) return [];
    const connectedIds = new Set();
    data.links.forEach(l => {
      if (l.source === nodeId) connectedIds.add(l.target);
      if (l.target === nodeId) connectedIds.add(l.source);
    });
    return data.nodes.filter(n => connectedIds.has(n.id));
  };

  const getRelationshipType = (nodeId) => {
    if (!data.links) return 'Unknown';
    const links = data.links.filter(l => l.source === nodeId || l.target === nodeId);
    if (links.length === 0) return 'Isolated';
    const rels = new Set(links.map(l => l.relationship));
    return rels.size === 1 ? links[0].relationship : 'Multi';
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleReset = () => {
    setZoom(1);
    setSelectedNode(null);
  };

  const stats = {
    totalNodes: data.nodes.length,
    totalLinks: data.links.length,
    connected: new Set(data.links.flatMap(l => [l.source, l.target])).size,
    isolated: data.nodes.length - new Set(data.links.flatMap(l => [l.source, l.target])).size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - var(--nav-height))' }}>
        <div className="loader-grain">
          <div className="loader-grain-bar"></div>
          <div className="loader-grain-bar"></div>
          <div className="loader-grain-bar"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-graph-page">
      <div className="graph-main">
        <div className="graph-header-bar">
          <div className="graph-title-section">
            <div className="graph-badge">
              <Network size={14} />
              KNOWLEDGE GRAPH
            </div>
            <h1>Expert Knowledge Map</h1>
            <p>Explore causal relationships between agricultural entities</p>
          </div>
          
          <div className="graph-stats-bar">
            <div className="stat-pill">
              <Sparkles size={14} />
              {stats.totalNodes} Nodes
            </div>
            <div className="stat-pill">
              <GitBranch size={14} />
              {stats.totalLinks} Edges
            </div>
            <div className="stat-pill success">
              <MapPin size={14} />
              {stats.connected} Connected
            </div>
            <div className="stat-pill warning">
              <Info size={14} />
              {stats.isolated} Isolated
            </div>
          </div>
        </div>

        <div className="graph-canvas-container">
          <div className="graph-canvas">
            <svg ref={svgRef} viewBox={`0 0 900 600`} style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(245,240,232,0.03)" strokeWidth="1"/>
                </pattern>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="var(--gold)" stopOpacity="0"/>
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {data.links?.map((link, i) => {
                const sourceNode = data.nodes.find(n => n.id === link.source);
                const targetNode = data.nodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode) return null;
                
                const sx = sourceNode.x || 450;
                const sy = sourceNode.y || 300;
                const tx = targetNode.x || 450;
                const ty = targetNode.y || 300;
                
                const isHighlighted = selectedNode && 
                  (link.source === selectedNode.id || link.target === selectedNode.id);
                
                return (
                  <path
                    key={i}
                    className={`graph-edge ${isHighlighted ? 'highlighted' : ''}`}
                    d={`M ${sx},${sy} Q ${(sx+tx)/2},${(sy+ty)/2 - 30} ${tx},${ty}`}
                    style={{ 
                      opacity: selectedNode && !isHighlighted ? 0.15 : 0.6,
                      stroke: isHighlighted ? 'var(--gold)' : 'rgba(245,240,232,0.1)'
                    }}
                  />
                );
              })}

              {data.nodes?.map((node) => {
                const x = node.x || 450;
                const y = node.y || 300;
                const isSelected = selectedNode?.id === node.id;
                const isDimmed = selectedNode && !isSelected && 
                  !getConnectedNodes(selectedNode.id).some(n => n.id === node.id);
                
                return (
                  <g 
                    key={node.id} 
                    className={`graph-node ${getNodeClass(node.type)}`}
                    style={{ opacity: isDimmed ? 0.2 : 1, transition: 'all 0.3s ease' }}
                    onClick={() => setSelectedNode(node)}
                  >
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={isSelected ? 16 : 10}
                      style={{ 
                        stroke: isSelected ? 'var(--gold)' : getNodeColor(node.type),
                        strokeWidth: isSelected ? 2.5 : 1.5,
                        fill: isSelected ? 'url(#nodeGlow)' : 'var(--bg-raised)'
                      }}
                    />
                    {isSelected && (
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={24}
                        fill="none"
                        stroke="var(--gold)"
                        strokeWidth="1"
                        style={{ opacity: 0.4 }}
                      >
                        <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <text 
                      x={x} 
                      y={y + 28}
                      textAnchor="middle"
                      className="graph-node-label"
                      style={{ 
                        fontSize: isSelected ? '12px' : '10px',
                        fontWeight: isSelected ? 600 : 400
                      }}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="graph-controls">
              <button className="graph-control-btn" onClick={() => handleZoom(0.1)} title="Zoom In">
                <Plus size={16} />
              </button>
              <button className="graph-control-btn" onClick={() => handleZoom(-0.1)} title="Zoom Out">
                <Minus size={16} />
              </button>
              <button className="graph-control-btn" onClick={handleReset} title="Reset">
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <aside className="graph-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-header">
            <Search size={16} />
            <span>Search</span>
          </div>
          <div className="graph-search">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Find entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-header">
            <Filter size={16} />
            <span>Filter by Type</span>
          </div>
          <div className="filter-chips">
            <button 
              className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            {nodeTypes.map(type => (
              <button 
                key={type}
                className={`filter-chip ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section nodes-section">
          <div className="sidebar-header">
            <LayoutGrid size={16} />
            <span>Entities ({filteredNodes.length})</span>
          </div>
          <div className="node-list">
            {filteredNodes.length > 0 ? (
              filteredNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`node-item ${selectedNode?.id === node.id ? 'selected' : ''}`}
                >
                  <div 
                    className="node-icon"
                    style={{ borderColor: getNodeColor(node.type) }}
                  >
                    {node.label.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="node-info">
                    <div className="node-label">{node.label}</div>
                    <div className="node-type">{node.type || 'Entity'}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="no-results">
                <Search size={24} />
                <p>No entities found</p>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {selectedNode && (
            <Motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="node-detail-panel"
            >
              <div className="detail-header">
                <h3>{selectedNode.label}</h3>
                <button className="close-btn" onClick={() => setSelectedNode(null)}>
                  ×
                </button>
              </div>
              <div className="detail-type" style={{ color: getNodeColor(selectedNode.type) }}>
                {selectedNode.type || 'Entity'}
              </div>
              
              <div className="detail-stats">
                <div className="detail-stat">
                  <GitBranch size={14} />
                  <span>{getRelationships(selectedNode.id).length} Connections</span>
                </div>
                <div className="detail-stat">
                  <Info size={14} />
                  <span>{getRelationshipType(selectedNode.id)}</span>
                </div>
              </div>

              {getConnectedNodes(selectedNode.id).length > 0 && (
                <div className="connected-section">
                  <div className="connected-label">Connected Entities</div>
                  <div className="connected-list">
                    {getConnectedNodes(selectedNode.id).map(n => (
                      <button 
                        key={n.id} 
                        className="connected-node-btn"
                        onClick={() => setSelectedNode(n)}
                      >
                        <MapPin size={12} />
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Motion.div>
          )}
        </AnimatePresence>
      </aside>
    </div>
  );
};

export default KnowledgeGraphPage;