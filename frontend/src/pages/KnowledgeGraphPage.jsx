import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Search, Compass, BookOpen, 
  ChevronRight, Activity, Filter, Info,
  ExternalLink, Maximize2, Zap, ShieldCheck,
  Plus, Minus, RotateCcw
} from 'lucide-react';
import { graphService } from '../services/api';

const KnowledgeGraphPage = () => {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoom, setZoom] = useState(1);
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

  const filteredNodes = data.nodes.filter(n => 
    n.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getNodeColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('crop')) return 'var(--sage)';
    if (t.includes('disease') || t.includes('pest')) return 'var(--danger)';
    if (t.includes('fertilizer')) return 'var(--gold)';
    if (t.includes('chemical')) return 'var(--info)';
    if (t.includes('weather')) return '#8B9CD5';
    return 'rgba(245,240,232,0.2)';
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

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleReset = () => {
    setZoom(1);
    setSelectedNode(null);
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
      <aside className="graph-sidebar">
        <h2 className="graph-header">Expert Knowledge Map</h2>
        
        <div className="graph-search">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="node-list">
          {filteredNodes.map(node => (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`node-item ${selectedNode?.id === node.id ? 'selected' : ''}`}
            >
              <div className="node-icon">
                {node.label.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="node-label">{node.label}</div>
                <div className="node-type">{node.type || 'Entity'}</div>
              </div>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {selectedNode && (
            <Motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="node-detail-panel"
            >
              <div className="node-detail-name">{selectedNode.label}</div>
              <div className="node-detail-type">{selectedNode.type || 'Entity'}</div>
              <div className="node-connections">
                {getRelationships(selectedNode.id).length} connections
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </aside>

      <div className="graph-canvas">
        <svg ref={svgRef} viewBox={`0 0 800 600`} style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(245,240,232,0.03)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {data.links?.map((link, i) => {
            const sourceNode = data.nodes.find(n => n.id === link.source);
            const targetNode = data.nodes.find(n => n.id === link.target);
            if (!sourceNode || !targetNode) return null;
            
            const isHighlighted = selectedNode && 
              (link.source === selectedNode.id || link.target === selectedNode.id);
            
            return (
              <path
                key={i}
                className={`graph-edge ${isHighlighted ? 'highlighted' : ''}`}
                d={`M ${sourceNode.x || 100 + i * 50},${sourceNode.y || 100 + i * 30} Q ${(sourceNode.x + targetNode.x)/2 || 200 + i * 25},${(sourceNode.y + targetNode.y)/2 || 150 + i * 35} ${targetNode.x || 300 + i * 50},${targetNode.y || 200 + i * 30}`}
                style={{ opacity: selectedNode && !isHighlighted ? 0.2 : 1 }}
              />
            );
          })}

          {data.nodes?.map((node, i) => {
            const x = node.x || 100 + (i % 5) * 120 + 50;
            const y = node.y || 100 + Math.floor(i / 5) * 100 + 50;
            const isSelected = selectedNode?.id === node.id;
            const isDimmed = selectedNode && !isSelected && 
              !data.links?.some(l => l.source === selectedNode.id && (l.source === node.id || l.target === node.id)) &&
              !data.links?.some(l => l.target === selectedNode.id && (l.source === node.id || l.target === node.id));
            
            return (
              <g 
                key={node.id} 
                className={`graph-node ${getNodeClass(node.type)}`}
                style={{ opacity: isDimmed ? 0.2 : 1 }}
                onClick={() => setSelectedNode(node)}
              >
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isSelected ? 14 : 8}
                  style={{ 
                    stroke: isSelected ? 'var(--gold)' : getNodeColor(node.type),
                    fill: isSelected ? 'var(--gold-muted)' : 'var(--bg-raised)'
                  }}
                />
                {isSelected && (
                  <circle 
                    cx={x} 
                    cy={y} 
                    r={20}
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth="1"
                    style={{ opacity: 0.3 }}
                  >
                    <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <text 
                  x={x} 
                  y={y + 25}
                  textAnchor="middle"
                  className="graph-node-label"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="graph-controls">
          <button className="graph-control-btn" onClick={() => handleZoom(0.1)}>
            <Plus size={16} />
          </button>
          <button className="graph-control-btn" onClick={() => handleZoom(-0.1)}>
            <Minus size={16} />
          </button>
          <button className="graph-control-btn" onClick={handleReset}>
            <RotateCcw size={16} />
          </button>
        </div>

        {!selectedNode && (
          <div className="graph-empty">
            <Network size={80} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
            <h3>Select an Expertise Node</h3>
            <p>Navigate through the knowledge repository to visualize causal chains.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraphPage;
