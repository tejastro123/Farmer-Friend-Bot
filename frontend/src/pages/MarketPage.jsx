import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mandiService } from '../services/api';
import { motion as Motion, AnimatePresence } from 'framer-motion';

import { 
    TrendingUp, Users, FileText, ShoppingBag, Search, 
    ChevronRight, ArrowUpRight, Scale, Clock, ShieldCheck, 
    X, Printer, Download, MapPin, Star, Activity, Zap, 
    AlertCircle, CheckCircle, QrCode, FileCheck, Loader2,
    ChevronUp, ChevronDown
} from 'lucide-react';

const MarketPage = () => {
    const navigate = useNavigate();
    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
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
                    console.error("Location sync failed:", err);
                    setSyncStatus({ type: 'error', msg: 'Location access denied' });
                    setSyncing(false);
                }
            );
        }
    };

    const handleInitTrade = (dealer) => {
        setTradingId(dealer.id);
        
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
            
            const ledger = document.querySelector('.ledger-container');
            if (ledger) ledger.scrollIntoView({ behavior: 'smooth' });
        }, 1500);
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

    if (!marketData || !marketData.prices) {
        return (
            <div className="flex items-center justify-center" style={{ height: 'calc(100vh - var(--nav-height))' }}>
                <div className="surface p-xl text-center" style={{ maxWidth: '400px' }}>
                    <X size={64} className="text-danger mx-auto mb-6" style={{ opacity: 0.5 }} />
                    <h2 className="mb-3">Core Connectivity Lost</h2>
                    <p className="text-sm mb-8">The regional mandi oracle is currently unreachable. Please verify your satellite uplink or retry synchronization.</p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary btn-block">Re-establish Uplink</button>
                </div>
            </div>
        );
    }

    const priceEntries = Object.entries(marketData.prices || {});
    const filteredDealers = marketData.dealers?.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.location.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="market-page">
            {/* LEFT PANEL: Market Pulse */}
            <aside className="market-ticker">
                <div className="ticker-header">
                    <span className="ticker-label">AGRI TICKER</span>
                    <div className="ticker-live-dot"></div>
                </div>
                
                <div className="space-y-0">
                    {priceEntries.map(([crop, data], idx) => (
                        <Motion.div 
                            key={crop}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="ticker-row"
                        >
                            <div>
                                <div className="ticker-crop">{crop}</div>
                            </div>
                            <div className="text-right">
                                <div className="ticker-price">₹{data?.price || 'N/A'}</div>
                                <div className="ticker-sparkline">
                                    {[1,2,3,4,5,6].map(i => (
                                        <div 
                                            key={i} 
                                            className="spark-bar-mini"
                                            style={{ height: `${30 + Math.random() * 70}%` }}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                            <div className={`ticker-change ${data?.trend === 'up' ? 'positive' : 'negative'}`}>
                                {data?.trend === 'up' ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />}
                                {Math.floor(Math.random() * 5) + 1}.{Math.floor(Math.random() * 9)}%
                            </div>
                        </Motion.div>
                    ))}
                </div>
            </aside>

            {/* CENTER PANEL: Main Operations */}
            <div className="market-main">
                {/* Active Listings */}
                <section>
                    <div className="section-header mb-md">
                        <div className="section-title flex items-center gap-sm">
                            <ShoppingBag size={14} /> Active Inventory Matrix
                        </div>
                    </div>
                    <div className="listings-scroll">
                        {marketData.active_listings?.map((listing, lIdx) => (
                            <Motion.div 
                                key={listing.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: lIdx * 0.1 }}
                                className="listing-card"
                            >
                                <div className="listing-crop">{listing.commodity}</div>
                                <div className="listing-weight">{listing.weight} KG Active</div>
                                <div className="listing-price">ASK: ₹{listing.price}/Q</div>
                                <span className="listing-status">Listed</span>
                            </Motion.div>
                        ))}
                        <button className="listing-card border-dashed flex items-center justify-center" style={{ minWidth: '220px', borderStyle: 'dashed', opacity: 0.7 }}>
                            <div className="text-center">
                                <Scale size={24} className="mx-auto mb-sm" style={{ color: 'var(--text-tertiary)' }} />
                                <div className="text-sm">Inbound Listing</div>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Register New Crop</div>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Dealer Directory */}
                <section>
                    <div className="section-header mb-md">
                        <div className="section-title flex items-center gap-sm">
                            <Users size={14} /> {coords ? 'Nearest Buyers Found' : 'Trusted Aggregator Node'}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2" style={{ transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={14}/>
                            <input 
                                type="text" 
                                placeholder="Filter Entity..." 
                                className="input pl-10"
                                style={{ width: '200px', padding: '8px 12px', fontSize: '12px' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="dealer-list">
                        <AnimatePresence>
                            {filteredDealers.map((dealer, dIdx) => (
                                <Motion.div 
                                    key={dealer.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: dIdx * 0.05 }}
                                    className="dealer-row"
                                >
                                    <div className="dealer-avatar">
                                        {dealer.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="dealer-info">
                                        <div className="dealer-name">{dealer.name}</div>
                                        <div className="dealer-location">
                                            <MapPin size={10} /> {dealer.location}
                                        </div>
                                    </div>
                                    <div className="dealer-rating">
                                        <Star size={12} className="inline mr-1" style={{ color: 'var(--warning)' }} />
                                        {dealer.rating}
                                    </div>
                                    <div className="dealer-premium">+{((dealer.premium - 1) * 100).toFixed(1)}%</div>
                                    <button 
                                        onClick={() => handleInitTrade(dealer)}
                                        disabled={tradingId === dealer.id}
                                        className="btn btn-primary dealer-cta"
                                    >
                                        {tradingId === dealer.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : 'Trade →'}
                                    </button>
                                </Motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Settlement Ledger */}
                <section className="ledger-container">
                    <div className="ledger-header">
                        <div className="ledger-title">
                            <FileText size={14} />
                            <span>Ledger</span>
                        </div>
                        <div className="ledger-timestamp">Updated 2s ago</div>
                    </div>
                    <div className="ledger-rows">
                        <AnimatePresence>
                            {marketData.deals?.map((deal, dIdx) => (
                                <Motion.div 
                                    key={deal.id}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: dIdx * 0.05 }}
                                    className="ledger-row"
                                >
                                    <div className="ledger-txn">{deal.id}</div>
                                    <div className="ledger-counterparty">{deal.dealer}</div>
                                    <div className="ledger-commodity">{deal.commodity}</div>
                                    <div className="ledger-qty">{deal.qty_quintals} Q</div>
                                    <div className="ledger-value">₹{deal.total.toLocaleString()}</div>
                                    <div>
                                        <span className={`ledger-status ${deal.status === 'Confirmed' ? 'confirmed' : 'completed'}`}>
                                            {deal.status}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/market/bill/${deal.id}`)}
                                        className="btn btn-secondary btn-icon"
                                        style={{ width: '32px', height: '32px', padding: '0' }}
                                    >
                                        <ArrowUpRight size={16}/>
                                    </button>
                                </Motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </section>
            </div>

            {/* RIGHT PANEL: Intelligence */}
            <aside className="market-intelligence">
                <div className="intelligence-card">
                    <div className="intelligence-header flex items-center gap-sm">
                        <Zap size={14} /> Market Intelligence
                    </div>
                </div>

                <div className="intelligence-card">
                    <h5 className="intelligence-header">Sentiment Index</h5>
                    <div className="sentiment-gauge">
                        <div className="gauge-segment danger"></div>
                        <div className="gauge-segment warning"></div>
                        <div className="gauge-segment sage active"></div>
                        <div className="gauge-segment gold"></div>
                        <div className="gauge-segment success"></div>
                    </div>
                    <div className="sentiment-label">BULLISH 0.84</div>
                </div>

                <Motion.div 
                    className="intelligence-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="market-insight">
                        <div className="quote-mark">"</div>
                        <p className="insight-text">
                            {marketData.prices.tomato?.forecast || 'Market fluctuations expected. Monitor local rates for optimal selling timing.'}
                        </p>
                    </div>
                </Motion.div>
            </aside>
        </div>
    );
};

export default MarketPage;
