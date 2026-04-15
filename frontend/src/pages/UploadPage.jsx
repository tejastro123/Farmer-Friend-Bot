import React, { useState, useCallback } from 'react';
import { UploadCloud, File, CheckCircle, AlertCircle, Loader2, Database, Search, FileText, Trash2, Zap } from 'lucide-react';
import { ingestService } from '../services/api';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const UploadPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState([]); // List of { file, status, message }
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
        message: `Added ${res.data.chunks_added} chunks` 
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

  return (
    <div className="main-content-pushed">
      <div className="upload-knowledge-header">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Center</h1>
          <p className="text-muted">Managed Intelligence & Document Synchronization</p>
        </div>
        <div className="knowledge-stats">
          <div className="k-stat">
            <div>{kbStats.totalDocs}</div>
            <label>Documents</label>
          </div>
          <div className="k-stat">
            <div>{kbStats.totalChunks}</div>
            <label>Neural Chunks</label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="upload-workflow">
          <div 
            className={`upload-box glass ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <UploadCloud size={60} className={queue.some(q => q.status === 'uploading') ? 'ingest-pulse-icon' : 'text-secondary'} />
            <h3 className="mt-6 text-xl">Deposit Knowledge</h3>
            <p className="text-muted mt-2 mb-6 text-sm">Drag specialized Agri-PDFs, policies, or manuals here.</p>
            
            <input 
              type="file" 
              multiple
              accept="application/pdf"
              id="file-upload" 
              style={{ display: 'none' }} 
              onChange={(e) => addFilesToQueue(e.target.files)}
            />
            <label htmlFor="file-upload" className="btn btn-secondary">
              Browse Local Files
            </label>
          </div>

          <div className="file-queue-container mt-8">
            <h4 className="flex items-center gap-2 mb-4 font-semibold">
              <Database size={18} /> Ingestion Queue
            </h4>
            <div className="file-queue">
              <AnimatePresence>
                {queue.map((item) => (
                  <Motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.01, borderColor: "rgba(82,183,136,0.3)" }}
                    className="queue-item glass transition-colors"
                  >
                    <FileText size={28} className="text-secondary" />
                    <div className="file-info">
                      <div className="file-name">{item.file.name}</div>
                      <div className="file-meta">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB • {item.status.toUpperCase()}
                      </div>
                      {item.message && <div className={`text-xs mt-1 ${item.status === 'success' ? 'text-success' : 'text-danger'}`}>{item.message}</div>}
                    </div>
                    {item.status === 'idle' && (
                      <Motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-primary btn-sm" 
                        onClick={() => processFile(item)}
                      >
                        Ingest
                      </Motion.button>
                    )}
                    {item.status === 'uploading' && <Loader2 size={18} className="lucide-spin text-secondary" />}
                    {item.status === 'success' && <CheckCircle size={20} className="text-success" />}
                    {item.status !== 'uploading' && (
                      <button className="p-2 text-muted hover:text-danger" onClick={() => removeFromQueue(item.id)}><Trash2 size={16} /></button>
                    )}
                  </Motion.div>
                ))}
                {queue.length === 0 && (
                  <Motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    className="text-muted text-center py-8 glass rounded-xl text-sm italic"
                  >
                    Queue is currently empty. Drop files to begin neural indexing.
                  </Motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="document-explorer">
          <div className="glass p-6 rounded-2xl h-full">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-semibold flex items-center gap-2"><Database size={18}/> Neural Registry</h4>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" placeholder="Search knowledge..." className="glass-input text-xs pl-8 py-1" />
              </div>
            </div>
            
            <Motion.div 
              className="doc-list-mock space-y-4"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
            >
              {[
                { name: "Government_Mandi_Policy_2024.pdf", size: "1.2 MB", chunks: 45, date: "2h ago" },
                { name: "Pest_Control_Cotton_V3.pdf", size: "3.4 MB", chunks: 120, date: "1d ago" },
                { name: "Soil_Health_Card_Schemes.pdf", size: "0.8 MB", chunks: 22, date: "3d ago" },
                { name: "Irrigation_Guidelines_Pune.pdf", size: "2.1 MB", chunks: 56, date: "1w ago" }
              ].map((doc, idx) => (
                <Motion.div 
                  key={idx} 
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    show: { opacity: 1, x: 0 }
                  }}
                  whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                  className="flex items-center gap-4 p-3 rounded-xl transition border border-white/5"
                >
                  <div className="p-2 bg-secondary/10 rounded-lg"><File size={18} className="text-secondary" /></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{doc.name}</div>
                    <div className="text-[10px] text-muted">{doc.size} • {doc.chunks} Chunks</div>
                  </div>
                  <div className="text-[10px] text-muted">{doc.date}</div>
                </Motion.div>
              ))}
            </Motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
