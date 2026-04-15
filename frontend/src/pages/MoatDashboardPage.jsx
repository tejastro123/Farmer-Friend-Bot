import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { 
  Shield, Database, Download, TrendingUp, 
  Layers, Zap, Clock, Search, ExternalLink, 
  BarChart3, PieChart, Activity, CheckCircle2,
  HardDrive
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
      <div className="main-content-pushed min-h-[60vh] flex flex-col items-center justify-center">
        <Database size={60} className="text-secondary animate-bounce opacity-20 mb-4" />
        <h2 className="text-xl font-bold text-muted animate-pulse">Synchronizing Proprietary Moat...</h2>
      </div>
    );
  }

  return (
    <div className="main-content-pushed pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black flex items-center gap-4">
            <Shield className="text-secondary" size={40} />
            Proprietary AI Moat
          </h1>
          <p className="text-muted mt-2 max-w-xl">
            Automatically curating "Gold-Standard" agricultural interactions into an instruction-following dataset for next-gen model training.
          </p>
        </div>
        <button 
          onClick={handleExport}
          disabled={exporting || stats?.total_samples === 0}
          className="btn btn-secondary flex items-center gap-3 !px-8 !py-4 !rounded-2xl shadow-[0_10px_30px_rgba(82,183,136,0.3)] disabled:opacity-30"
        >
          {exporting ? <Activity className="lucide-spin" size={20} /> : <Download size={20} />}
          {exporting ? 'PACKAGING JSONL...' : 'EXPORT GOLD DATASET'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Metric Cards */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden group"
          >
            <Zap className="absolute -right-6 -top-6 text-secondary opacity-5 group-hover:opacity-10 transition-opacity" size={160} />
            <div className="text-[10px] uppercase tracking-widest font-black text-secondary mb-2 flex items-center gap-2">
               <Database size={12}/> Samples Collected
            </div>
            <div className="text-6xl font-black mb-2">{stats?.total_samples || 0}</div>
            <p className="text-xs text-muted">Verified gold-standard interactions harvested from user feedback.</p>
          </Motion.div>

          <Motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden group"
          >
            <BarChart3 className="absolute -right-6 -top-6 text-info opacity-5 group-hover:opacity-10 transition-opacity" size={160} />
            <div className="text-[10px] uppercase tracking-widest font-black text-info mb-2 flex items-center gap-2">
               <Layers size={12}/> Diversity Index
            </div>
            <div className="text-4xl font-black mb-2">{Object.keys(stats?.topics || {}).length} Topics</div>
            <p className="text-xs text-muted">Unique agricultural domains covered by the proprietary dataset.</p>
          </Motion.div>

          <Motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden group"
          >
            <HardDrive className="absolute -right-6 -top-6 text-warning opacity-5 group-hover:opacity-10 transition-opacity" size={160} />
            <div className="text-[10px] uppercase tracking-widest font-black text-warning mb-2 flex items-center gap-2">
               <Activity size={12}/> Repository Size
            </div>
            <div className="text-4xl font-black mb-2">{stats?.file_size_kb || 0} KB</div>
            <p className="text-xs text-muted">Raw JSONL storage volume of curated instruction pairs.</p>
          </Motion.div>
        </div>

        {/* Intelligence Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass p-8 rounded-3xl border border-white/10 h-full">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <Clock className="text-secondary" />
                Live Curation Ticker
              </h3>
              <div className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-tighter">
                Real-Time Indexing
              </div>
            </div>

            <Motion.div 
              className="space-y-4"
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
              {stats?.recent_samples && stats.recent_samples.length > 0 ? (
                stats.recent_samples.map((sample, idx) => (
                  <Motion.div 
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      show: { opacity: 1, x: 0 }
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    key={idx}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-secondary/30 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold py-1 px-2 rounded-lg bg-secondary text-black uppercase">
                        {sample.topic}
                      </span>
                      <span className="text-[10px] opacity-40 font-mono">
                         {new Date(sample.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 line-clamp-2 italic">
                      "{sample.query}"
                    </p>
                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 size={12} className="text-secondary" />
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Dataset Ready</span>
                    </div>
                  </Motion.div>
                ))
              ) : (
                <Motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    className="py-20 text-center"
                >
                   <Search size={60} className="mx-auto mb-4 stroke-[1px]" />
                   <p className="text-sm">No curated samples yet. High-quality interactions are added when users mark responses as helpful.</p>
                </Motion.div>
              )}
            </Motion.div>

            {stats?.topics && Object.keys(stats.topics).length > 0 && (
              <div className="mt-10 pt-8 border-t border-white/5">
                <h4 className="text-[10px] uppercase tracking-widest font-black mb-4 opacity-50">Topic Distribution</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.topics).map(([name, count]) => (
                    <div key={name} className="glass px-3 py-2 rounded-xl flex items-center gap-3 border-white/5">
                       <span className="text-xs font-bold">{name}</span>
                       <span className="bg-white/10 px-2 py-0.5 rounded-lg text-[10px] font-black">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Moat Philosophy */}
      <div className="mt-6 glass p-8 rounded-3xl border border-white/5 bg-gradient-to-r from-secondary/5 to-transparent">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="p-6 rounded-3xl bg-secondary/10">
             <TrendingUp className="text-secondary" size={40} />
          </div>
          <div>
            <h4 className="text-xl font-bold mb-2">Proprietary Compound Moat</h4>
            <p className="text-sm text-muted leading-relaxed">
              Every helpful interaction strengthens our competitive advantage. By capturing the unique queries of actual farmers and the expert synthesis of our AI agents, we are building a world-class agricultural instruction-set that cannot be easily replicated by generic LLMs. This data is the foundation for fine-tuning our next-generation KrishiMitra-V2 model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoatDashboardPage;
