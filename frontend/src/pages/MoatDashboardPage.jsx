import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { 
  Shield, Database, Download, TrendingUp, 
  Layers, Zap, Clock, Search, ExternalLink, 
  BarChart3, PieChart, Activity, CheckCircle2,
  HardDrive, Sparkles
} from 'lucide-react';
import { moatService } from '../services/api';

const MoatDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  const topicColors = ['var(--gold)', 'var(--sage)', 'var(--info)', 'var(--warning)', 'var(--danger)'];

  return (
    <div className="moat-page">
      <div className="moat-header">
        <div className="moat-title">
          <h1>Proprietary AI Moat</h1>
          <h2>AI MOAT</h2>
          <p className="moat-subtitle">
            Automatically curating gold-standard agricultural interactions for next-gen model training.
          </p>
        </div>
        <button 
          onClick={handleExport}
          disabled={exporting || stats?.total_samples === 0}
          className="btn btn-primary moat-export-btn"
        >
          {exporting ? <Activity size={18} className="animate-spin" /> : <Sparkles size={18} />}
          Export Gold Dataset
        </button>
      </div>

      <div className="moat-stats-row">
        <div className="moat-stat-card samples">
          <div className="moat-stat-card-label">
            <Database size={12} /> Samples Collected
          </div>
          <div className="moat-stat-value">{stats?.total_samples || 0}</div>
          <p className="moat-stat-desc">Gold-standard interactions harvested from user feedback</p>
        </div>

        <div className="moat-stat-card">
          <div className="moat-stat-card-label" style={{ color: 'var(--info)' }}>
            <Layers size={12} /> Topic Diversity
          </div>
          <div className="moat-stat-value moat-stat-value-sm">
            {Object.keys(stats?.topics || {}).length} Topics
          </div>
          <div className="moat-topic-chart">
            {Object.entries(stats?.topics || {}).slice(0, 5).map(([name, count], i) => (
              <div key={name} className="moat-topic-item">
                <div className="moat-topic-dot" style={{ background: topicColors[i % topicColors.length] }}></div>
                <div className="moat-topic-bar" style={{ width: `${Math.min(count * 2, 60)}px` }}></div>
              </div>
            ))}
          </div>
        </div>

        <div className="moat-stat-card">
          <div className="moat-stat-card-label" style={{ color: 'var(--warning)' }}>
            <HardDrive size={12} /> Repository Size
          </div>
          <div className="moat-stat-value moat-stat-value-sm">{stats?.file_size_kb || 0} KB</div>
          <p className="moat-stat-desc">Raw JSONL storage volume of curated instruction pairs</p>
        </div>
      </div>

      <div className="moat-feed">
        <div className="moat-feed-header">
          <div className="moat-feed-title">
            <Clock size={16} /> Live Curation Ticker
          </div>
          <div className="moat-feed-pill">
            <div className="moat-feed-pill-dot"></div>
            Recording
          </div>
        </div>

        <div className="moat-feed-list">
          {stats?.recent_samples && stats.recent_samples.length > 0 ? (
            stats.recent_samples.map((sample, idx) => (
              <Motion.div 
                key={idx}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="moat-feed-item"
              >
                <div className="moat-feed-item-header">
                  <span className="moat-feed-topic">{sample.topic}</span>
                  <span className="moat-feed-time">
                    {new Date(sample.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="moat-feed-query">"{sample.query}"</p>
              </Motion.div>
            ))
          ) : (
            <div className="moat-feed-empty">
              <Search size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
              <p>No curated samples yet. High-quality interactions are added when users mark responses as helpful.</p>
            </div>
          )}
        </div>

        {stats?.topics && Object.keys(stats.topics).length > 0 && (
          <div className="moat-topics">
            <div className="moat-topics-title">Topic Distribution</div>
            <div className="moat-topics-list">
              {Object.entries(stats.topics).map(([name, count], i) => (
                <div key={name} className="moat-topic-tag">
                  <span className="moat-topic-tag-name">{name}</span>
                  <span className="moat-topic-tag-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="moat-philosophy">
        <div className="moat-philosophy-icon">
          <TrendingUp size={32} />
        </div>
        <div className="moat-philosophy-content">
          <h4>Compound Growth</h4>
          <p>
            Every helpful interaction strengthens our competitive advantage. By capturing the unique queries of actual farmers and the expert synthesis of our AI agents, we are building a world-class agricultural instruction-set that cannot be easily replicated by generic LLMs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MoatDashboardPage;
