import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { 
  Database, Play, CheckCircle2, AlertCircle, 
  Clock, Server, Globe, Signal, SignalLow,
  RefreshCw, BarChart3, HardDrive, Cpu, 
  Settings2, Activity, Zap
} from 'lucide-react';
import { pipelineService } from '../services/api';

const DataCenterPage = () => {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState(null);
  const [edgeStatus, setEdgeStatus] = useState("Online");

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
        setEdgeStatus(Math.random() > 0.1 ? "Online" : "Edge-Active (Offline)");
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await pipelineService.getPipelines();
      setPipelines(res.data);
    } catch (err) {
      console.error("Failed to fetch pipelines:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (id) => {
    setRunningId(id);
    try {
      await pipelineService.runPipeline(id);
      setTimeout(() => {
        setRunningId(null);
        fetchData();
      }, 2000);
    } catch (err) {
      console.error("Failed to run pipeline:", err);
      setRunningId(null);
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

  return (
    <div className="data-center-page">
      <div className="dc-header">
        <div className="dc-title">
          <h1>DATA COMMAND<span>CENTER</span></h1>
          <p className="dc-subtitle">Orchestrating 10+ expert ingestion pipelines</p>
        </div>

        <div className="dc-status-card">
          <div className="dc-status-section">
            <span className="dc-status-label">Mode</span>
            <span className="dc-status-value online">
              <Signal size={14} />
              {edgeStatus}
              <span className="dc-status-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block', marginLeft: '4px' }}></span>
            </span>
          </div>
          <div className="dc-status-divider"></div>
          <div className="dc-status-section">
            <span className="dc-status-label">Edge AI</span>
            <span className="dc-status-value edge">
              <Cpu size={14} />
              KrishiMitra v2.1
            </span>
          </div>
        </div>
      </div>

      <div className="dc-stats-row">
        <div className="dc-stat-card">
          <div className="dc-stat-header">
            <BarChart3 size={24} className="dc-stat-icon" />
            <span className="dc-stat-badge">+12% today</span>
          </div>
          <div className="dc-column-chart">
            {[40, 65, 45, 80, 55, 70, 90, 60].map((h, i) => (
              <div 
                key={i} 
                className="dc-column-bar" 
                style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
          <div className="dc-stat-value">1.8k</div>
          <div className="dc-stat-label">Records Ingested</div>
        </div>

        <div className="dc-stat-card">
          <div className="dc-stat-header">
            <Activity size={24} className="dc-stat-icon" style={{ color: 'var(--info)' }} />
            <span className="dc-stat-badge" style={{ background: 'rgba(91,155,213,0.15)', color: 'var(--info)' }}>Healthy</span>
          </div>
          <div className="dc-arc-gauge">
            <svg viewBox="0 0 36 36" width="80" height="80">
              <path className="dc-arc-seg dc-arc-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="dc-arc-seg dc-arc-fill" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
          </div>
          <div className="dc-stat-value" style={{ textAlign: 'center' }}>10/10</div>
          <div className="dc-stat-label">Active Pipelines</div>
        </div>

        <div className="dc-stat-card">
          <div className="dc-stat-header">
            <HardDrive size={24} className="dc-stat-icon" style={{ color: 'var(--warning)' }} />
            <span className="dc-stat-badge" style={{ background: 'rgba(232,169,62,0.15)', color: 'var(--warning)' }}>340 MB</span>
          </div>
          <div className="dc-cylinder">
            <div className="dc-cylinder-top"></div>
            <div className="dc-cylinder-body"></div>
          </div>
          <div className="dc-stat-value" style={{ textAlign: 'center' }}>98%</div>
          <div className="dc-stat-label">Storage Synced</div>
        </div>
      </div>

      <div className="dc-pipeline-table">
        <div className="dc-pipeline-header">
          <div className="dc-pipeline-title">
            <div className="dc-terminal-bar">
              <span className="dc-terminal-dot red"></span>
              <span className="dc-terminal-dot yellow"></span>
              <span className="dc-terminal-dot green"></span>
            </div>
            <h3>Pipeline Orchestration</h3>
          </div>
          <span className="dc-pipeline-filename">pipeline_orchestrator.py</span>
        </div>

        <div className="dc-table-header">
          <span>Pipeline</span>
          <span>Status</span>
          <span>Records</span>
          <span>Last Run</span>
          <span>Execute</span>
        </div>

        {pipelines.map((p, i) => (
          <Motion.div 
            key={p.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="dc-pipeline-row"
          >
            <div className="dc-pipeline-info">
              <div className="dc-pipeline-icon">
                <Globe size={18} />
              </div>
              <div>
                <div className="dc-pipeline-name">{p.name}</div>
                <div className="dc-pipeline-category">{p.category || 'Data Pipeline'}</div>
              </div>
            </div>
            <div className="dc-pipeline-status">
              <span className="dc-status-dot"></span>
              <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: 600 }}>Healthy</span>
            </div>
            <div className="dc-pipeline-records">{p.records.toLocaleString()}</div>
            <div className="dc-pipeline-time">{p.last_run || '2h ago'}</div>
            <button
              onClick={() => handleRun(p.id)}
              disabled={runningId === p.id}
              className={`dc-pipeline-run-btn ${runningId === p.id ? 'running' : ''}`}
            >
              {runningId === p.id ? (
                <><RefreshCw size={12} className="animate-spin" /> Syncing...</>
              ) : (
                <><Play size={12} /> Run</>
              )}
            </button>
          </Motion.div>
        ))}
      </div>
    </div>
  );
};

export default DataCenterPage;
