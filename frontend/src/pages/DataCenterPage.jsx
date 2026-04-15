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
    // Simulate connectivity check
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
      <div className="main-content-pushed h-[70vh] flex flex-col items-center justify-center">
        <Server size={60} className="text-secondary animate-pulse opacity-20 mb-4" />
        <h2 className="text-xl font-bold text-muted animate-pulse">Initializing Data Pipelines...</h2>
      </div>
    );
  }

  return (
    <div className="main-content-pushed pb-20">
      
      {/* Header with Connectivity Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
               <Database size={32} />
            </div>
            <h1 className="text-4xl font-black">Data Command Center</h1>
          </div>
          <p className="text-muted max-w-xl">
            Centralized orchestration for 10+ expert data ingestion pipelines. Powered by Prefect and KrishiMitra Edge AI.
          </p>
        </div>

        <div className={`glass p-4 rounded-[32px] border flex items-center gap-6 px-8 ${
            edgeStatus === "Online" ? "border-secondary/20" : "border-amber-400/30"
        }`}>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-muted tracking-widest">Connectivity Mode</span>
                <span className={`font-black flex items-center gap-2 ${
                    edgeStatus === "Online" ? "text-secondary" : "text-amber-400 animate-pulse"
                }`}>
                    {edgeStatus === "Online" ? <Signal size={16} /> : <SignalLow size={16} />}
                    {edgeStatus}
                </span>
            </div>
            <div className="h-10 w-[2px] bg-white/5" />
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-muted tracking-widest">Edge Logic</span>
                <span className="font-black text-white flex items-center gap-2">
                    <Cpu size={16} /> Local Expert v2.1
                </span>
            </div>
        </div>
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
         <div className="glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden group">
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <Zap className="text-secondary" size={24} />
                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full">+12% Today</span>
                </div>
                <div className="text-4xl font-black mb-1">1.8k</div>
                <div className="text-muted text-sm font-bold uppercase tracking-widest">Records Ingested</div>
            </div>
            <BarChart3 className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 group-hover:text-secondary/5 transition-colors" />
         </div>

         <div className="glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden group">
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <Activity className="text-sky-400" size={24} />
                    <span className="text-xs font-bold text-sky-400 bg-sky-400/10 px-3 py-1 rounded-full">Healthy</span>
                </div>
                <div className="text-4xl font-black mb-1">10/10</div>
                <div className="text-muted text-sm font-bold uppercase tracking-widest">Active Pipelines</div>
            </div>
            <Activity className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 group-hover:text-sky-400/5 transition-colors" />
         </div>

         <div className="glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden group">
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <HardDrive className="text-amber-400" size={24} />
                    <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">340 MB</span>
                </div>
                <div className="text-4xl font-black mb-1">98%</div>
                <div className="text-muted text-sm font-bold uppercase tracking-widest">Local Knowledge Sync</div>
            </div>
            <Database className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 group-hover:text-amber-400/5 transition-colors" />
         </div>
      </div>

      {/* Pipelines Table */}
      <div className="glass rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Settings2 className="text-secondary" size={20} />
                <h3 className="text-xl font-bold">Expert Pipeline Orchestration</h3>
            </div>
            <button 
                onClick={fetchData} 
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-muted transition-all"
            >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-muted">
                    <tr>
                        <th className="p-6 pl-10">Pipeline Domain</th>
                        <th className="p-6">Health Status</th>
                        <th className="p-6">Records Total</th>
                        <th className="p-6 text-right pr-10">Execution Control</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {pipelines.map((p, i) => (
                        <Motion.tr 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={p.id} 
                            className="hover:bg-white/[0.02] group transition-all"
                        >
                            <td className="p-6 pl-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted group-hover:text-secondary group-hover:bg-secondary/10 transition-all">
                                        <Globe size={18} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{p.name}</div>
                                        <div className="flex items-center gap-2 text-xs text-muted">
                                            <Clock size={12} /> Last run: {p.last_run}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-6">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                                    <CheckCircle2 size={14} /> Healthy
                                </span>
                            </td>
                            <td className="p-6">
                                <span className="font-black text-white">{p.records.toLocaleString()}</span>
                            </td>
                            <td className="p-6 text-right pr-10">
                                <button
                                    onClick={() => handleRun(p.id)}
                                    disabled={runningId === p.id}
                                    className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ml-auto ${
                                        runningId === p.id 
                                        ? 'bg-amber-400 text-black cursor-wait' 
                                        : 'bg-secondary text-black hover:scale-105 active:scale-95'
                                    }`}
                                >
                                    {runningId === p.id ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            Syncing...
                                        </>
                                    ) : (
                                        <>
                                            <Play size={16} fill="currentColor" />
                                            Run Pipeline
                                        </>
                                    )}
                                </button>
                            </td>
                        </Motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};

export default DataCenterPage;
