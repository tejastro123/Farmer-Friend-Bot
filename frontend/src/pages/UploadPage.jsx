import React, { useState, useCallback } from 'react';
import { UploadCloud, File, CheckCircle, AlertCircle, Loader2, Database, Search, FileText, Trash2, Zap, BookOpen } from 'lucide-react';
import { ingestService } from '../services/api';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const UploadPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState([]);
  const [kbStats, setKbStats] = useState({ totalDocs: 12, totalChunks: 450 });

  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const addFilesToQueue = (files) => {
    const newItems = Array.from(files)
      .filter(f => f.type === 'application/pdf')
      .map(f => ({ file: f, status: 'idle', id: Math.random().toString(36).substr(2, 9) }));
    setQueue(prev => [...prev, ...newItems]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) addFilesToQueue(e.dataTransfer.files);
  }, []);

  const processFile = async (item) => {
    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading' } : q));
    try {
      const res = await ingestService.ingest(item.file);
      setQueue(prev => prev.map(q => q.id === item.id ? { 
        ...q, 
        status: 'success', 
        message: `${res.data.chunks_added} chunks added` 
      } : q));
      setKbStats(prev => ({ ...prev, totalDocs: prev.totalDocs + 1, totalChunks: prev.totalChunks + (res.data.chunks_added || 0) }));
    } catch (err) {
      setQueue(prev => prev.map(q => q.id === item.id ? { 
        ...q, 
        status: 'error', 
        message: err.response?.data?.detail || 'Ingestion failed' 
      } : q));
    }
  };

  const removeFromQueue = (id) => setQueue(prev => prev.filter(q => q.id !== id));

  const mockDocs = [
    { name: "Government_Mandi_Policy_2024.pdf", size: "1.2 MB", chunks: 45, date: "2h ago", type: 'gov' },
    { name: "Pest_Control_Cotton_V3.pdf", size: "3.4 MB", chunks: 120, date: "1d ago", type: 'research' },
    { name: "Soil_Health_Card_Schemes.pdf", size: "0.8 MB", chunks: 22, date: "3d ago", type: 'guidelines' },
    { name: "Irrigation_Guidelines_Pune.pdf", size: "2.1 MB", chunks: 56, date: "1w ago", type: 'gov' }
  ];

  return (
    <div className="upload-page">
      <div>
        <div className="upload-header">
          <div className="upload-title">
            <h1>Knowledge Vault</h1>
            <p>Feed your AI with expertise</p>
          </div>
          <div className="upload-stats">
            <div className="upload-stat">
              <span className="upload-stat-value">{kbStats.totalDocs}</span>
              <span className="upload-stat-label">Documents</span>
            </div>
            <div className="upload-stats-divider"></div>
            <div className="upload-stat">
              <span className="upload-stat-value">{kbStats.totalChunks}</span>
              <span className="upload-stat-label">Chunks</span>
            </div>
          </div>
        </div>

        <div 
          className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="dropzone-icons">
            <div className="dropzone-icon"><FileText size={24} /></div>
            <div className="dropzone-icon"><FileText size={24} /></div>
            <div className="dropzone-icon"><FileText size={24} /></div>
          </div>
          <h3 className="dropzone-title">
            {dragActive ? 'Release to upload' : 'Drop government PDFs, crop guides, or research papers'}
          </h3>
          <p className="dropzone-subtitle">Supports PDF files only</p>
          <p className="dropzone-divider">or</p>
          <label htmlFor="file-upload" className="dropzone-browse">
            Browse Files
          </label>
          <input 
            type="file" 
            multiple
            accept="application/pdf"
            id="file-upload" 
            style={{ display: 'none' }} 
            onChange={(e) => addFilesToQueue(e.target.files)}
          />
        </div>

        <div className="file-queue">
          <div className="queue-header">
            <Database size={18} />
            <span>Ingestion Queue</span>
          </div>
          <AnimatePresence>
            {queue.map((item) => (
              <Motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="queue-item"
              >
                <div className="queue-item-icon">
                  <FileText size={20} />
                </div>
                <div className="queue-item-info">
                  <div className="queue-item-name">{item.file.name}</div>
                  <div className="queue-item-meta">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  {item.status === 'success' && (
                    <div className="queue-item-success"><CheckCircle size={12} className="inline mr-1" />{item.message}</div>
                  )}
                  {item.status === 'error' && (
                    <div className="queue-item-error"><AlertCircle size={12} className="inline mr-1" />{item.message}</div>
                  )}
                </div>
                {item.status === 'idle' && (
                  <button className="btn btn-ghost" onClick={() => processFile(item)}>
                    Ingest →
                  </button>
                )}
                {item.status === 'uploading' && (
                  <div className="queue-progress" style={{ flex: 1 }}>
                    <div className="queue-progress-fill"></div>
                  </div>
                )}
                {item.status !== 'uploading' && (
                  <button className="btn btn-icon" style={{ padding: '8px' }} onClick={() => removeFromQueue(item.id)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </Motion.div>
            ))}
            {queue.length === 0 && (
              <div className="surface p-lg text-center" style={{ opacity: 0.5 }}>
                <p className="italic">Queue is currently empty. Drop files to begin neural indexing.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <aside className="document-registry">
        <h3 className="registry-header">Neural Registry</h3>
        <div className="registry-search">
          <Search size={14} className="registry-search-icon" />
          <input type="text" placeholder="Search documents..." />
        </div>
        <div className="registry-list">
          {mockDocs.map((doc, idx) => (
            <div key={idx} className="registry-item">
              <div className={`registry-item-stripe ${doc.type}`}></div>
              <div className="registry-item-icon">
                {doc.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="registry-item-info">
                <div className="registry-item-name">{doc.name}</div>
                <div className="registry-item-meta">{doc.chunks} chunks · {doc.size} · {doc.date}</div>
              </div>
              <button className="registry-item-action btn btn-icon" style={{ padding: '4px' }}>
                <Search size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default UploadPage;
