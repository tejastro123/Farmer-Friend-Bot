import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mandiService } from '../services/api';
import { motion as Motion, AnimatePresence } from 'framer-motion';

import { 
    TrendingUp, Users, FileText, ShoppingBag, Search, 
    ChevronRight, ArrowUpRight, Scale, Clock, ShieldCheck, 
    X, Printer, Download, MapPin, Star, Activity, Zap, 
    AlertCircle, CheckCircle, QrCode, FileCheck, Loader2,
    ChevronUp, ChevronDown, Plus, Wheat
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
    
    const [showListingModal, setShowListingModal] = useState(false);
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [tradeForm, setTradeForm] = useState({ commodity: '', qty_quintals: 10, price_per_quintal: 2000 });
    const [listingForm, setListingForm] = useState({ commodity: '', weight_kg: 100, min_price_quintal: 2000 });
    const [creatingListing, setCreatingListing] = useState(false);

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

    const handleCreateListing = async () => {
        setCreatingListing(true);
        try {
            await mandiService.createListing(listingForm);
            setShowListingModal(false);
            setListingForm({ commodity: '', weight_kg: 100, min_price_quintal: 2000 });
            fetchMarket();
        } catch (err) {
            console.error("Failed to create listing:", err);
        } finally {
            setCreatingListing(false);
        }
    };

    const handleInitTrade = async (dealer) => {
        setSelectedDealer(dealer);
        setTradeForm({
            commodity: dealer.focus?.[0] || 'Wheat',
            qty_quintals: 10,
            price_per_quintal: marketData?.prices?.[dealer.focus?.[0]?.toLowerCase()]?.price || 2000
        });
        setShowTradeModal(true);
    };

    const handleConfirmTrade = async () => {
        if (!selectedDealer) return;
        setTradingId(selectedDealer.id);
        
        try {
            const res = await mandiService.initiateTrade({
                dealer_id: selectedDealer.id,
                dealer_name: selectedDealer.name,
                commodity: tradeForm.commodity,
                qty_quintals: parseInt(tradeForm.qty_quintals),
                price_per_quintal: parseInt(tradeForm.price_per_quintal)
            });
            
            setMarketData(prev => ({
                ...prev,
                deals: [res.data, ...(prev.deals || [])]
            }));
            
            setShowTradeModal(false);
            setSelectedDealer(null);
        } catch (err) {
            console.error("Trade failed:", err);
        } finally {
            setTradingId(null);
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

    if (!marketData || !marketData.prices) {
        return (
            <div className="flex items-center justify-center" style={{ height: 'calc(100vh - var(--nav-height))' }}>
                <div className="surface p-xl text-center" style={{ maxWidth: '400px' }}>
                    <X size={64} className="mx-auto mb-6" style={{ color: 'var(--danger)', opacity: 0.5 }} />
                    <h2 className="mb-3">Core Connectivity Lost</h2>
                    <p className="text-sm mb-8">The regional mandi oracle is currently unreachable. Please verify your satellite uplink or retry synchronization.</p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary">Re-establish Uplink</button>
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
                
                <div>
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
                        <button 
                            className="listing-card border-dashed flex items-center justify-center" 
                            style={{ minWidth: '220px', borderStyle: 'dashed', opacity: 0.7 }}
                            onClick={() => setShowListingModal(true)}
                        >
                            <div className="text-center">
                                <Plus size={24} className="mx-auto mb-sm" style={{ color: 'var(--text-tertiary)' }} />
                                <div className="text-sm">Register New Crop</div>
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
                                className="input"
                                style={{ width: '200px', padding: '8px 12px 8px 36px', fontSize: '12px' }}
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

            {/* Create Listing Modal */}
            <AnimatePresence>
                {showListingModal && (
                    <Motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setShowListingModal(false)}
                    >
                        <Motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="modal-content"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Register New Crop Listing</h3>
                                <button onClick={() => setShowListingModal(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="label">Commodity</label>
                                    <select 
                                        className="input"
                                        value={listingForm.commodity}
                                        onChange={e => setListingForm({...listingForm, commodity: e.target.value})}
                                    >
                                        <option value="">Select Crop</option>
                                        <option value="Wheat">Wheat</option>
                                        <option value="Rice">Rice</option>
                                        <option value="Tomato">Tomato</option>
                                        <option value="Onion">Onion</option>
                                        <option value="Cotton">Cotton</option>
                                        <option value="Soybean">Soybean</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Weight (KG)</label>
                                    <input 
                                        type="number"
                                        className="input"
                                        value={listingForm.weight_kg}
                                        onChange={e => setListingForm({...listingForm, weight_kg: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Min Price (₹/Quintal)</label>
                                    <input 
                                        type="number"
                                        className="input"
                                        value={listingForm.min_price_quintal}
                                        onChange={e => setListingForm({...listingForm, min_price_quintal: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowListingModal(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleCreateListing} disabled={creatingListing}>
                                    {creatingListing ? <Loader2 size={18} className="animate-spin" /> : 'Create Listing'}
                                </button>
                            </div>
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>

            {/* Trade Modal */}
            <AnimatePresence>
                {showTradeModal && selectedDealer && (
                    <Motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setShowTradeModal(false)}
                    >
                        <Motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="modal-content"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Initiate Trade</h3>
                                <button onClick={() => setShowTradeModal(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="trade-dealer-info">
                                    <div className="dealer-avatar" style={{ width: 48, height: 48, fontSize: 16 }}>
                                        {selectedDealer.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="dealer-name">{selectedDealer.name}</div>
                                        <div className="dealer-location"><MapPin size={12} /> {selectedDealer.location}</div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="label">Commodity</label>
                                    <select 
                                        className="input"
                                        value={tradeForm.commodity}
                                        onChange={e => setTradeForm({...tradeForm, commodity: e.target.value})}
                                    >
                                        {selectedDealer.focus?.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Quantity (Quintals)</label>
                                    <input 
                                        type="number"
                                        className="input"
                                        value={tradeForm.qty_quintals}
                                        onChange={e => setTradeForm({...tradeForm, qty_quintals: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Price (₹/Quintal)</label>
                                    <input 
                                        type="number"
                                        className="input"
                                        value={tradeForm.price_per_quintal}
                                        onChange={e => setTradeForm({...tradeForm, price_per_quintal: e.target.value})}
                                    />
                                </div>
                                <div className="trade-total">
                                    <span>Total Value:</span>
                                    <span className="stat-number">₹{((tradeForm.qty_quintals || 0) * (tradeForm.price_per_quintal || 0)).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowTradeModal(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleConfirmTrade}>
                                    Confirm Trade
                                </button>
                            </div>
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MarketPage;
