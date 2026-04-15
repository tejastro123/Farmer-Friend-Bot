import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Search, Compass, BookOpen, 
  ChevronRight, Activity, Filter, Info,
  ExternalLink, Maximize2, Zap, ShieldCheck
} from 'lucide-react';
import { graphService } from '../services/api';

const KnowledgeGraphPage = () => {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const _getRelationships = (nodeId) => {
    if (!data.links) return [];
    return data.links.filter(l => l.source === nodeId || l.target === nodeId);
  };

  if (loading) {
    return (
      <div className="main-content-pushed h-[70vh] flex flex-col items-center justify-center">
        <Network size={60} className="text-secondary animate-pulse opacity-20 mb-4" />
        <h2 className="text-xl font-bold text-muted animate-pulse">Initializing Expert Relationships...</h2>
      </div>
    );
  }

  return (
    <div className="main-content-pushed pb-20">
      
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
             <Network size={32} />
          </div>
          <h1 className="text-4xl font-black">Expert Knowledge Map</h1>
        </div>
        <p className="text-muted max-w-2xl">
          Visualizing the proprietary web of agricultural relationships. Our AI uses this graph to perform "Hybrid Reasoning" by tracing causal chains across 10+ expert domains.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px]">
        
        {/* Sidebar Explorer */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
          <div className="glass p-6 rounded-3xl border border-white/10 flex-shrink-0">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                  type="text" 
                  placeholder="Search entities (e.g. Rice, Urea)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:border-secondary outline-none transition-all"
                />
             </div>
          </div>

          <div className="glass flex-grow rounded-3xl border border-white/10 overflow-y-auto custom-scrollbar p-2">
            <div className="p-4 space-y-2">
              {filteredNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border flex items-center justify-between group ${
                    selectedNode?.id === node.id 
                    ? 'bg-secondary text-black border-secondary' 
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedNode?.id === node.id ? 'bg-black/10' : 'bg-secondary/10 text-secondary'}`}>
                      <Compass size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{node.label}</div>
                      <div className={`text-[10px] uppercase tracking-widest ${selectedNode?.id === node.id ? 'text-black/50' : 'opacity-40'}`}>
                        {node.type || 'Entity'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className={selectedNode?.id === node.id ? 'text-black' : 'opacity-0 group-hover:opacity-40'} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visualizer Canvas */}
        <div className="lg:col-span-8 glass rounded-[40px] border border-white/10 relative overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(82,183,136,0.05)_0%,_transparent_70%)]">
           <AnimatePresence mode="wait">
              {selectedNode ? (
                <Motion.div 
                  key={selectedNode.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="absolute inset-0 p-10 flex flex-col"
                >
                  {/* Node Header */}
                  <div className="flex justify-between items-start mb-12">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                           <span className="px-3 py-1 bg-secondary text-black text-[10px] font-black rounded-lg uppercase tracking-tighter">
                              {selectedNode.type || 'Global Entity'}
                           </span>
                           <span className="text-secondary flex items-center gap-2 text-xs font-bold">
                              <Activity size={12} /> Active in Reasoning
                           </span>
                        </div>
                        <h2 className="text-5xl font-black">{selectedNode.label}</h2>
                     </div>
                     <div className="p-4 rounded-3xl bg-secondary/10 border border-secondary/20">
                        <ShieldCheck className="text-secondary" size={32} />
                     </div>
                  </div>

                  {/* Relationship Spider Web (SVG-less List implementation) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow overflow-y-auto custom-scrollbar pr-4">
                    
                    {/* Outgoing relationships */}
                    <div>
                      <h4 className="text-[10px] uppercase font-black text-secondary tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Zap size={12} /> Deterministic Impacts
                      </h4>
                      <div className="space-y-4">
                        {data.links.filter(l => l.source === selectedNode.id).map((link, i) => (
                          <Motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
                            className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:border-secondary/30 transition-all flex items-center justify-between group"
                          >
                             <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted mb-1 uppercase italic tracking-widest">{link.relationship}</span>
                                <span className="text-xl font-bold">{data.nodes.find(n => n.id === link.target)?.label || link.target}</span>
                             </div>
                             <div className="p-2 rounded-xl bg-secondary/10 group-hover:bg-secondary text-secondary group-hover:text-black transition-all">
                                <ChevronRight size={18} />
                             </div>
                          </Motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Incoming relationships */}
                    <div>
                       <h4 className="text-[10px] uppercase font-black text-sky-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                         <Compass size={12} /> Origin Influences
                       </h4>
                       <div className="space-y-4">
                        {data.links.filter(l => l.target === selectedNode.id).map((link, i) => (
                           <Motion.div 
                             initial={{ x: 20, opacity: 0 }}
                             animate={{ x: 0, opacity: 1 }}
                             transition={{ delay: i * 0.1 }}
                             key={i}
                             className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:border-sky-400/30 transition-all flex items-center gap-6"
                           >
                             <div className="p-2 rounded-xl bg-sky-400/10 text-sky-400">
                                <Maximize2 size={18} rotate={180} />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted mb-1 uppercase italic tracking-widest">{link.relationship}</span>
                                <span className="text-xl font-bold">{data.nodes.find(n => n.id === link.source)?.label || link.source}</span>
                             </div>
                           </Motion.div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Summary Box */}
                  <div className="mt-10 p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-6">
                    <Info className="text-secondary flex-shrink-0" size={24} />
                    <p className="text-sm text-muted">
                      This node represents a core atomic unit in our agricultural ontology. Every connection here acts as a "Trust Path" that weights RAG search results and guides the Hybrid Reasoning Engine.
                    </p>
                  </div>

                </Motion.div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-20 text-center opacity-40">
                   <Network size={120} className="stroke-[0.5px] mb-8 animate-pulse text-secondary" />
                   <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter italic">Select an Expertise Node</h3>
                   <p className="max-w-md text-sm leading-relaxed">
                     Navigate through the knowledge repository on the left to visualize the causal chains used by KrishiMitra's advanced reasoning core.
                   </p>
                </div>
              )}
           </AnimatePresence>
        </div>

      </div>

    </div>
  );
};

export default KnowledgeGraphPage;
