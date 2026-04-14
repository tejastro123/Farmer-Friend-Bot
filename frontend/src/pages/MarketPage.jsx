import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mandiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    TrendingUp, Users, FileText, ShoppingBag, Search, 
    ChevronRight, ArrowUpRight, Scale, Clock, ShieldCheck, 
    X, Printer, Download, MapPin, Star, Activity, Zap, 
    AlertCircle, CheckCircle, QrCode, FileCheck, Loader2
} from 'lucide-react';

const MarketPage = () => {
    const navigate = useNavigate();
    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Geolocation State
    const [coords, setCoords] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState({ type: 'initial', msg: '' });
    const [tradingId, setTradingId] = useState(null);

    const fetchMarket = async (lat = null, lon = null) => {
        try {
            const res = await mandiService.getSummary(lat, lon);
            setMarketData(res.data);
        } catch (err) {
            console.error("Mandi context failed:", err);
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchMarket();
    }, []);

    const handleSyncLocation = () => {
        setSyncing(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCoords({ lat: latitude, lon: longitude });
                    fetchMarket(latitude, longitude);
                    setSyncStatus({ type: 'success', msg: 'Location synced' });
                },
                (err) => {
                    setSyncStatus({ type: 'error', msg: 'Location access denied' });
                    setSyncing(false);
                }
            );
        }
    };

    const handleInitTrade = (dealer) => {
        setTradingId(dealer.id);
        
        // Simulated network oscillation for authenticity
        setTimeout(() => {
            const newDeal = {
                id: `TXN-${Math.floor(Math.random() * 90000) + 10000}`,
                timestamp: new Date().toISOString(),
                dealer: dealer.name,
                commodity: dealer.focus[0] || 'Mixed Grain',
                qty_quintals: Math.floor(Math.random() * 50) + 10,
                total: Math.floor(Math.random() * 200000) + 50000,
                status: 'Confirmed'
            };
            
            setMarketData(prev => ({
                ...prev,
                deals: [newDeal, ...prev.deals]
            }));
            
            setTradingId(null);
            
            // Auto-scroll to ledger
            const ledger = document.querySelector('.table-premium');
            if (ledger) ledger.scrollIntoView({ behavior: 'smooth' });
        }, 1500);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-vh-100 bg-main overflow-hidden">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin"></div>
                    <div className="text-secondary animate-pulse text-xl font-bold tracking-widest uppercase">Initializing Digital Mandi Hub...</div>
                </div>
            </div>
        );
    }

    if (!marketData || !marketData.prices) {
        return (
            <div className="flex items-center justify-center min-vh-100 bg-main p-8">
                <div className="glass p-12 rounded-3xl border border-danger/20 text-center max-w-lg">
                    <X size={64} className="text-danger mx-auto mb-6 opacity-50" />
                    <h2 className="text-2xl font-black mb-3">Core Connectivity Lost</h2>
                    <p className="text-muted text-sm mb-8 leading-relaxed">The regional mandi oracle is currently unreachable. Please verify your satellite uplink or retry synchronization.</p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary w-full">Re-establish Uplink</button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <main className="dashboard-main p-8 overflow-y-auto">
                {/* Header with Geolocation */}
                <header className="flex justify-between items-start mb-12">
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-secondary uppercase tracking-[0.3em] mb-2">
                             <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></div> Localized Intelligence Hub
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter">Digital Mandi Hub</h1>
                        
                        {/* Location Sync Warning/Success Pill */}
                        <div className="mt-4 flex items-center gap-3">
                            <button 
                                onClick={handleSyncLocation}
                                disabled={syncing}
                                className="btn btn-glass px-4 py-2 !rounded-full !text-[10px] font-black uppercase"
                            >
                                <Activity size={14} className={syncing ? 'sync-btn-active' : ''}/>
                                {syncing ? 'Syncing...' : 'Link Live Location'}
                            </button>
                            
                            {syncStatus.type === 'error' && (
                                <div className="location-warning">
                                    <AlertCircle size={14}/> {syncStatus.msg}
                                </div>
                            )}
                            
                            {coords && (
                                <div className="location-coord-chip">
                                    <MapPin size={14}/> {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-8 text-right">
                        <div>
                            <div className="text-[10px] font-bold text-muted uppercase mb-1">Regional Core</div>
                            <div className="text-sm font-bold">{coords ? 'Nearby Station Active' : 'Pune-Nashik Node v4.2'}</div>
                        </div>
                        <div className="h-10 w-[1px] bg-white/10"></div>
                        <div>
                            <div className="text-[10px] font-bold text-muted uppercase mb-1">Network Latency</div>
                            <div className="text-sm font-bold text-secondary">12ms - Stable</div>
                        </div>
                    </div>
                </header>

                <div className="mandi-layout">
                    
                    {/* LEFT PANEL: Market Pulse */}
                    <aside className="space-y-6">
                        <div className="mandi-panel-header"><TrendingUp size={14}/> Market Pulse (State Avg)</div>
                        
                        <div className="pulse-card">
                            <h4 className="text-xs font-bold text-secondary mb-6 flex justify-between">
                                COMPONENT TICKER <span>Live</span>
                            </h4>
                            <div className="space-y-1">
                                {Object.entries(marketData.prices || {}).map(([crop, data]) => (
                                    <div key={crop} className="pulse-item group cursor-pointer">
                                        <div>
                                            <div className="text-[10px] font-bold text-muted uppercase group-hover:text-main transition-colors">{crop}</div>
                                            <div className="text-lg font-black tracking-tighter">₹{data?.price || 'N/A'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[10px] font-bold ${data?.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                                                {data?.trend === 'up' ? '+' : '-'}{Math.floor(Math.random() * 5) + 1}.{Math.floor(Math.random() * 9)}%
                                            </div>
                                            <div className="sparkline-view mt-1">
                                                {[1,2,3,4,5,6].map(i => (
                                                    <div 
                                                        key={i} 
                                                        className={`spark-bar ${i > 3 ? 'active' : ''}`} 
                                                        style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}
                                                    ></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* CENTER PANEL: Core Operations */}
                    <div className="space-y-8">
                        
                        {/* Quick Assets */}
                        <section>
                            <div className="mandi-panel-header"><ShoppingBag size={14}/> Active Inventory Matrix</div>
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {marketData.active_listings.map(listing => (
                                    <div key={listing.id} className="inventory-chip glass min-w-[240px]">
                                        <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
                                            <Zap size={20}/>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-muted uppercase">{listing.commodity}</div>
                                            <div className="text-base font-black">{listing.weight} KG Active</div>
                                            <div className="text-[9px] font-bold text-secondary mt-0.5">ASK: ₹{listing.price}/Q</div>
                                        </div>
                                    </div>
                                ))}
                                <button className="inventory-chip border-dashed border-white/20 hover:border-secondary/50 transition bg-transparent group">
                                    <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center group-hover:bg-secondary/10 transition">
                                        <Scale size={18} className="text-muted group-hover:text-secondary"/>
                                    </div>
                                    <div className="text-left">
                                         <div className="text-xs font-bold">Inbound Listing</div>
                                         <div className="text-[10px] text-muted">Register New Crop</div>
                                    </div>
                                </button>
                            </div>
                        </section>

                        {/* Dealer Directory */}
                        <section>
                            <div className="flex justify-between items-end mb-6">
                                <div className="mandi-panel-header">
                                    <Users size={14}/> {coords ? 'Nearest Buyers Found' : 'Trusted Aggregator Node'}
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14}/>
                                    <input 
                                        type="text" 
                                        placeholder="Filter Entity..." 
                                        className="glass-input pl-10 py-2 text-xs w-48 bg-black/40"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {marketData.dealers.map(dealer => (
                                    <div key={dealer.id} className="dealer-row glass">
                                        <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center text-secondary">
                                            <ShoppingBag size={24}/>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-bold text-base">{dealer.name}</h4>
                                                {dealer.distance_km && (
                                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-bold rounded uppercase">
                                                        {dealer.distance_km} KM Away
                                                    </span>
                                                )}
                                                <span className="pill-success status-pill">Verified</span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className="text-[10px] text-muted flex items-center gap-1"><MapPin size={10}/> {dealer.location}</div>
                                                <div className="text-[10px] text-warning flex items-center gap-1"><Star size={10} fill="currentColor"/> {dealer.rating} Market Score</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="text-right mr-4">
                                                <div className="text-[9px] font-bold text-muted uppercase">Premium</div>
                                                <div className="text-sm font-black text-secondary">{((dealer.premium - 1) * 100).toFixed(1)}%</div>
                                            </div>
                                            {dealer.focus.slice(0, 1).map(f => (
                                                <div key={f} className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-muted flex items-center">{f}</div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => handleInitTrade(dealer)}
                                            disabled={tradingId === dealer.id}
                                            className="btn btn-primary px-6 py-2.5 !text-[11px] !font-black !tracking-tighter uppercase !rounded-xl"
                                        >
                                            {tradingId === dealer.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 size={12} className="animate-spin" /> Syncing...
                                                </div>
                                            ) : 'Init Trade'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Trade Ledger */}
                        <section>
                            <div className="mandi-panel-header"><FileText size={14}/> Comprehensive Settlement Ledger</div>
                            <div className="glass rounded-2xl overflow-hidden border border-white/5">
                                <table className="table-premium">
                                    <thead>
                                        <tr>
                                            <th>Transaction ID</th>
                                            <th>Counterparty</th>
                                            <th>Commodity</th>
                                            <th>Metric</th>
                                            <th>Value</th>
                                            <th>Status</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-medium">
                                        {marketData.deals.map(deal => (
                                            <tr key={deal.id}>
                                                <td className="font-mono text-[10px] font-bold text-secondary">{deal.id}</td>
                                                <td className="font-bold">{deal.dealer}</td>
                                                <td className="text-muted">{deal.commodity}</td>
                                                <td>{deal.qty_quintals} Q</td>
                                                <td className="font-black">₹{deal.total.toLocaleString()}</td>
                                                <td>
                                                    <span className={`status-pill ${deal.status === 'Confirmed' ? 'pill-info' : 'pill-success'}`}>
                                                        {deal.status}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <button 
                                                        onClick={() => navigate(`/market/bill/${deal.id}`)}
                                                        className="btn btn-secondary !p-2 !rounded-lg"
                                                    >
                                                        <ArrowUpRight size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT PANEL: Intelligence */}
                    <aside className="space-y-6 right-sidebar">
                        <div className="mandi-panel-header"><Zap size={14}/> Network Intelligence</div>
                        
                        <div className="pulse-card">
                            <h5 className="text-[10px] font-bold text-muted uppercase mb-4">Sentiment Index</h5>
                            <div className="sentiment-gauge">
                                <div className="gauge-seg bg-danger opacity-20"></div>
                                <div className="gauge-seg bg-warning opacity-20"></div>
                                <div className="gauge-seg bg-secondary active"></div>
                                <div className="gauge-seg bg-secondary opacity-60"></div>
                                <div className="gauge-seg bg-success opacity-80"></div>
                            </div>
                            <div className="flex justify-between mt-2 text-[9px] font-bold uppercase tracking-widest">
                                <span>Bearish</span>
                                <span className="text-secondary">Bullish (0.84)</span>
                                <span>Strong</span>
                            </div>
                        </div>

                        <div className="pulse-card bg-accent/5 border-accent/20">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase mb-3 text-warning">
                                <Star size={12}/> Market Insight
                             </div>
                             <p className="text-xs text-muted leading-relaxed italic">
                                "{marketData.prices.tomato?.forecast || 'Market fluctuations expected. Monitor local rates.'}"
                             </p>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default MarketPage;
