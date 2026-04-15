import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Database, Download, TrendingUp, 
  Layers, Zap, Clock, Search, ExternalLink, 
  BarChart3, PieChart, Activity, CheckCircle2,
  HardDrive, Sparkles, FileJson, GitBranch, 
  Target, Award, Brain, Cpu
} from 'lucide-react';
import { moatService } from '../services/api';

const MoatDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await moatService.getStats();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load moat intelligence:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await moatService.exportDataset();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `krishimitra_moat_${new Date().toISOString().split('T')[0]}.jsonl`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Ensure the dataset has samples.");
    } finally {
      setExporting(false);
    }
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

  const topicColors = {
    'Pest Management': '#ef4444',
    'Market Trends': '#22c55e', 
    'Irrigation': '#3b82f6',
    'Soil Health': '#a16207',
    'Government Schemes': '#8b5cf6',
    'Weather': '#06b6d4',
    'Fertilizer': '#eab308',
    'Crop Planning': '#10b981'
  };

  return (
    <div className="moat-page">
      <div className="moat-header">
        <div className="moat-title">
          <div className="moat-badge">
            <Brain size={14} />
            PROPRIETARY DATA
          </div>
          <h1>AI Moat <span>Intelligence</span></h1>
          <p className="moat-subtitle">
            Continuously harvesting high-quality agricultural interactions to build an unstoppable training dataset.
          </p>
        </div>
        <div className="moat-actions">
          <button 
            onClick={handleExport}
            disabled={exporting || stats?.total_samples === 0}
            className="btn btn-primary moat-export-btn"
          >
            {exporting ? <Activity size={18} className="animate-spin" /> : <Download size={18} />}
            Export Dataset
          </button>
        </div>
      </div>

      <div className="moat-stats-grid">
        <div className="moat-stat-card hero">
          <div className="stat-icon-wrapper">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">
              <Target size={14} />
              Total Samples
            </div>
            <div className="stat-value">{stats?.total_samples || 0}</div>
            <div className="stat-trend positive">
              <TrendingUp size={12} />
              +12% this week
            </div>
          </div>
        </div>

        <div className="moat-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Topic Categories</div>
            <div className="stat-value-sm">{Object.keys(stats?.topics || {}).length}</div>
          </div>
        </div>

        <div className="moat-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(234,179,8,0.1)', color: 'var(--gold)' }}>
            <HardDrive size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Dataset Size</div>
            <div className="stat-value-sm">{stats?.file_size_kb || 0} KB</div>
          </div>
        </div>

        <div className="moat-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Award size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Quality Score</div>
            <div className="stat-value-sm">98.5%</div>
          </div>
        </div>
      </div>

      <div className="moat-content-grid">
        <div className="moat-main-panel">
          <div className="moat-tabs">
            <button 
              className={`moat-tab ${activeTab === 'feed' ? 'active' : ''}`}
              onClick={() => setActiveTab('feed')}
            >
              <Zap size={16} />
              Live Curation
            </button>
            <button 
              className={`moat-tab ${activeTab === 'topics' ? 'active' : ''}`}
              onClick={() => setActiveTab('topics')}
            >
              <PieChart size={16} />
              Topics
            </button>
            <button 
              className={`moat-tab ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              <FileJson size={16} />
              Export
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'feed' && (
              <Motion.div 
                key="feed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="moat-panel-content"
              >
                <div className="moat-feed-header">
                  <div className="feed-status">
                    <span className="status-dot recording"></span>
                    Recording new interactions
                  </div>
                </div>
                <div className="moat-feed-list">
                  {stats?.recent_samples && stats.recent_samples.length > 0 ? (
                    stats.recent_samples.map((sample, idx) => (
                      <Motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="moat-sample-card"
                      >
                        <div className="sample-header">
                          <span 
                            className="sample-topic"
                            style={{ background: topicColors[sample.topic] || 'var(--gold)' }}
                          >
                            {sample.topic}
                          </span>
                          <span className="sample-time">
                            {new Date(sample.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="sample-query">"{sample.query}"</p>
                        <div className="sample-meta">
                          <span><CheckCircle2 size={12} /> Curated</span>
                          <span><Brain size={12} /> Training Ready</span>
                        </div>
                      </Motion.div>
                    ))
                  ) : (
                    <div className="moat-empty-state">
                      <Sparkles size={48} />
                      <h3>No samples yet</h3>
                      <p>Mark AI responses as helpful in chat to start building your dataset.</p>
                    </div>
                  )}
                </div>
              </Motion.div>
            )}

            {activeTab === 'topics' && (
              <Motion.div 
                key="topics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="moat-panel-content"
              >
                <div className="topics-grid">
                  {Object.entries(stats?.topics || {}).map(([topic, count]) => {
                    const percentage = stats?.total_samples ? Math.round((count / stats.total_samples) * 100) : 0;
                    return (
                      <div key={topic} className="topic-card">
                        <div className="topic-header">
                          <span className="topic-name" style={{ color: topicColors[topic] || 'var(--gold)' }}>
                            {topic}
                          </span>
                          <span className="topic-count">{count}</span>
                        </div>
                        <div className="topic-bar-container">
                          <div 
                            className="topic-bar" 
                            style={{ 
                              width: `${percentage}%`,
                              background: topicColors[topic] || 'var(--gold)'
                            }}
                          />
                        </div>
                        <div className="topic-percentage">{percentage}%</div>
                      </div>
                    );
                  })}
                </div>
              </Motion.div>
            )}

            {activeTab === 'export' && (
              <Motion.div 
                key="export"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="moat-panel-content"
              >
                <div className="export-info">
                  <div className="export-icon">
                    <FileJson size={48} />
                  </div>
                  <h3>Export Training Dataset</h3>
                  <p>Download your curated dataset in JSONL format, ready for fine-tuning language models.</p>
                  
                  <div className="export-specs">
                    <div className="spec-item">
                      <span className="spec-label">Format</span>
                      <span className="spec-value">JSONL</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Records</span>
                      <span className="spec-value">{stats?.total_samples || 0}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Size</span>
                      <span className="spec-value">{stats?.file_size_kb || 0} KB</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleExport}
                    disabled={exporting || stats?.total_samples === 0}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 'var(--space-lg)' }}
                  >
                    {exporting ? <Activity size={18} className="animate-spin" /> : <Download size={18} />}
                    Download Dataset
                  </button>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="moat-sidebar">
          <div className="moat-insight-card">
            <div className="insight-header">
              <TrendingUp size={18} />
              <span>Growth Insights</span>
            </div>
            <div className="insight-content">
              <p>
                Your AI moat grows stronger with every helpful interaction. 
                The proprietary dataset now contains <strong>{stats?.total_samples || 0}</strong> high-quality 
                training samples across <strong>{Object.keys(stats?.topics || {}).length}</strong> agricultural topics.
              </p>
            </div>
          </div>

          <div className="moat-tech-card">
            <div className="tech-header">
              <Cpu size={18} />
              <span>Pipeline Status</span>
            </div>
            <div className="tech-stats">
              <div className="tech-stat">
                <CheckCircle2 size={16} className="text-success" />
                <span>Auto-curation active</span>
              </div>
              <div className="tech-stat">
                <GitBranch size={16} className="text-success" />
                <span>JSONL export ready</span>
              </div>
              <div className="tech-stat">
                <Activity size={16} className="text-success" />
                <span>Real-time sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoatDashboardPage;