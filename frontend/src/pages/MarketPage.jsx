import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mandiService } from '../services/api';
import { motion as Motion, AnimatePresence } from 'framer-motion';

import { 
    TrendingUp, Users, FileText, ShoppingBag, Search, 
    ChevronRight, ArrowUpRight, Scale, Clock, ShieldCheck, 
    X, Printer, Download, MapPin, Star, Activity, Zap, 
    AlertCircle, CheckCircle, QrCode, FileCheck, Loader2,
    ChevronUp, ChevronDown, Plus, Wheat, RefreshCw, Package,
    DollarSign, Target, BarChart3, Wallet, Handshake
} from 'lucide-react';

const MarketPage = () => {
    const navigate = useNavigate();
    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    
    const [coords, setCoords] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState({ type: 'initial', msg: '' });
    
    const [showListingModal, setShowListingModal] = useState(false);
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [tradeForm, setTradeForm] = useState({ commodity: '', qty_quintals: 10, price_per_quintal: 2000 });
    const [listingForm, setListingForm] = useState({ commodity: '', weight_kg: 100, min_price_quintal: 2000 });
    const [creatingListing, setCreatingListing] = useState(false);
    const [tradingId, setTradingId] = useState(null);

    const fetchMarket = async (lat = null, lon = null) => {
        setLoading(true);
        setError(null);
        try {
            const res = await mandiService.getSummary(lat, lon);
            setMarketData(res.data);
        } catch (err) {
            console.error("Mandi context failed:", err);
            setError(err.message || 'Failed to load market data');
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
            const res = await mandiService.createListing(listingForm);
            setShowListingModal(false);
            setListingForm({ commodity: '', weight_kg: 100, min_price_quintal: 2000 });
            setMarketData(prev => ({
                ...prev,
                active_listings: [res.data, ...(prev.active_listings || [])]
            }));
        } catch (err) {
            console.error("Failed to create listing:", err);
            alert('Failed to create listing: ' + (err.response?.data?.detail || err.message));
        } finally {
            setCreatingListing(false);
        }
    };

    const handleInitTrade = (dealer) => {
        const commodity = dealer.focus?.[0] || 'Wheat';
        const price = marketData?.prices?.[commodity?.toLowerCase()]?.price || 2000;
        setSelectedDealer(dealer);
        setTradeForm({
            commodity: commodity,
            qty_quintals: 10,
            price_per_quintal: price
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
            alert(`Trade successful! Deal ID: ${res.data.id}`);
        } catch (err) {
            console.error("Trade failed:", err);
            alert('Trade failed: ' + (err.response?.data?.detail || err.message));
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

    if (error) {
        return (
            <div className="flex items-center justify-center" style={{ height: 'calc(100vh - var(--nav-height))' }}>
                <div className="surface p-xl text-center" style={{ maxWidth: '400px' }}>
                    <X size={64} className="mx-auto mb-6" style={{ color: 'var(--danger)', opacity: 0.5 }} />
                    <h2 className="mb-3">Connection Failed</h2>
                    <p className="text-sm mb-8">{error}</p>
                    <button onClick={() => fetchMarket()} className="btn btn-primary">Retry Connection</button>
                </div>
            </div>
        );
    }

    const priceEntries = Object.entries(marketData?.prices || {});
    const filteredDealers = marketData?.dealers?.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.location.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="page-container">
            {/* Page Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">
                        <ShoppingBag size={24} />
                        Agricultural Market
                    </h1>
                    <p className="page-subtitle">Real-time trading & procurement terminal</p>
                </div>
                <div className="flex gap-md">
                    <button 
                        onClick={handleSyncLocation} 
                        disabled={syncing}
                        className="btn btn-secondary"
                    >
                        {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        {coords ? 'Location Synced' : 'Sync Location'}
                    </button>
                </div>
            </header>

            {/* Main Grid Layout */}
            <div className="market-grid">
                {/* Section 1: Live Commodity Prices */}
                <section className="market-card">
                    <div className="card-header">
                        <div className="card-title">
                            <TrendingUp size={16} />
                            Live Commodity Prices
                        </div>
                        <span className="badge badge-success">
                            <span className="badge-dot"></span>
                            LIVE
                        </span>
                    </div>
                    <div className="price-grid">
                        {priceEntries.map(([crop, data], idx) => (
                            <Motion.div 
                                key={crop}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="price-card"
                            >
                                <div className="price-crop-name">{crop}</div>
                                <div className="price-value">₹{data?.price || 'N/A'}</div>
                                <div className={`price-change ${data?.trend === 'up' ? 'positive' : 'negative'}`}>
                                    {data?.trend === 'up' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    {Math.floor(Math.random() * 8) + 1}%
                                </div>
                            </Motion.div>
                        ))}
                    </div>
                </section>

                {/* Section 2: My Active Listings */}
                <section className="market-card">
                    <div className="card-header">
                        <div className="card-title">
                            <Package size={16} />
                            My Active Listings
                        </div>
                        <button 
                            onClick={() => setShowListingModal(true)}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={14} />
                            Register Crop
                        </button>
                    </div>
                    <div className="listings-grid">
                        {marketData?.active_listings?.length > 0 ? (
                            marketData.active_listings.map((listing, lIdx) => (
                                <Motion.div 
                                    key={listing.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: lIdx * 0.1 }}
                                    className="listing-item"
                                >
                                    <div className="listing-header">
                                        <span className="listing-crop">{listing.commodity}</span>
                                        <span className="listing-status">{listing.status || 'Active'}</span>
                                    </div>
                                    <div className="listing-details">
                                        <div className="listing-detail">
                                            <span className="label-text">Quantity</span>
                                            <span className="value-text">{listing.weight} KG</span>
                                        </div>
                                        <div className="listing-detail">
                                            <span className="label-text">Ask Price</span>
                                            <span className="value-text">₹{listing.price}/Q</span>
                                        </div>
                                    </div>
                                </Motion.div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <Package size={32} style={{ opacity: 0.3 }} />
                                <p>No active listings</p>
                                <button 
                                    onClick={() => setShowListingModal(true)}
                                    className="btn btn-primary btn-sm"
                                >
                                    <Plus size={14} />
                                    Register First Crop
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Section 3: Trusted Dealers */}
                <section className="market-card">
                    <div className="card-header">
                        <div className="card-title flex items-center gap-sm">
                            <Users size={16} /> 
                            {coords ? 'Nearest Dealers' : 'Trusted Dealers'}
                        </div>
                        <div className="relative" style={{ width: '180px' }}>
                            <Search className="absolute left-3 top-1/2" style={{ transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} size={14}/>
                            <input 
                                type="text" 
                                placeholder="Search dealers..." 
                                className="input"
                                style={{ width: '100%', padding: '8px 12px 8px 36px', fontSize: '12px' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="dealer-scroll-list">
                        {filteredDealers.length > 0 ? (
                            filteredDealers.map((dealer, dIdx) => (
                                <Motion.div 
                                    key={dealer.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: dIdx * 0.03 }}
                                    className="dealer-card"
                                >
                                    <div className="dealer-card-header">
                                        <div className="dealer-avatar-sm">
                                            {dealer.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="dealer-info-mini">
                                            <div className="dealer-name-mini">{dealer.name}</div>
                                            <div className="dealer-location-mini">
                                                <MapPin size={10} /> {dealer.location}
                                            </div>
                                        </div>
                                        <div className="dealer-rating-mini">
                                            <Star size={12} style={{ color: 'var(--warning)', fill: 'var(--warning)' }} />
                                            {dealer.rating}
                                        </div>
                                    </div>
                                    <div className="dealer-card-body">
                                        <div className="dealer-focus">
                                            {dealer.focus?.map(c => (
                                                <span key={c} className="focus-tag">{c}</span>
                                            ))}
                                        </div>
                                        <div className="dealer-premium-mini">
                                            Premium: +{((dealer.premium - 1) * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleInitTrade(dealer)}
                                        disabled={tradingId === dealer.id}
                                        className="btn btn-primary dealer-trade-btn"
                                    >
                                        {tradingId === dealer.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Handshake size={14} />
                                        )}
                                        Trade
                                    </button>
                                </Motion.div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <Users size={32} style={{ opacity: 0.3 }} />
                                <p>No dealers found</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Section 4: Settlement Ledger (Deals) */}
                <section className="market-card market-card-wide">
                    <div className="card-header">
                        <div className="card-title">
                            <FileText size={16} />
                            Settlement Ledger
                        </div>
                        <div className="flex gap-sm items-center">
                            <span className="text-xs text-tertiary">
                                {marketData?.deals?.length || 0} transactions
                            </span>
                        </div>
                    </div>
                    <div className="ledger-table">
                        <div className="ledger-thead">
                            <div className="ledger-th">Txn ID</div>
                            <div className="ledger-th">Dealer</div>
                            <div className="ledger-th">Commodity</div>
                            <div className="ledger-th">Qty</div>
                            <div className="ledger-th">Value</div>
                            <div className="ledger-th">Status</div>
                            <div className="ledger-th">Actions</div>
                        </div>
                        <div className="ledger-tbody">
                            {marketData?.deals?.length > 0 ? (
                                marketData.deals.map((deal, dIdx) => (
                                    <Motion.div 
                                        key={deal.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: dIdx * 0.03 }}
                                        className="ledger-tr"
                                    >
                                        <div className="ledger-td ledger-txn">{deal.id}</div>
                                        <div className="ledger-td">{deal.dealer}</div>
                                        <div className="ledger-td">{deal.commodity}</div>
                                        <div className="ledger-td">{deal.qty_quintals} Q</div>
                                        <div className="ledger-td ledger-value">₹{deal.total?.toLocaleString()}</div>
                                        <div className="ledger-td">
                                            <span className={`badge badge-${deal.status === 'Confirmed' ? 'success' : 'warning'}`}>
                                                {deal.status}
                                            </span>
                                        </div>
                                        <div className="ledger-td">
                                            {deal.status === 'Completed' ? (
                                                <button 
                                                    onClick={() => navigate(`/market/bill/${deal.id}`)}
                                                    className="btn btn-secondary btn-sm"
                                                    title="View Bill"
                                                >
                                                    <ArrowUpRight size={14} />
                                                </button>
                                            ) : deal.status === 'Pending' ? (
                                                <button 
                                                    onClick={() => navigate(`/market/confirm/${deal.id}`)}
                                                    className="btn btn-primary btn-sm"
                                                    title="Confirm Trade"
                                                >
                                                    <CheckCircle size={14} />
                                                </button>
                                            ) : deal.status === 'Confirmed' ? (
                                                <button 
                                                    onClick={() => navigate(`/market/payment/${deal.id}`)}
                                                    className="btn btn-primary btn-sm"
                                                    title="Make Payment"
                                                >
                                                    <DollarSign size={14} />
                                                </button>
                                            ) : null}
                                        </div>
                                    </Motion.div>
                                ))
                            ) : (
                                <div className="ledger-empty">
                                    <FileText size={24} style={{ opacity: 0.3 }} />
                                    <p>No transactions yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

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
                            className="modal-content modal-sm"
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
                                        <option value="Sugarcane">Sugarcane</option>
                                        <option value="Potato">Potato</option>
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
                                    <label className="label">Minimum Price (₹/Quintal)</label>
                                    <input 
                                        type="number"
                                        className="input"
                                        value={listingForm.min_price_quintal}
                                        onChange={e => setListingForm({...listingForm, min_price_quintal: e.target.value})}
                                    />
                                </div>
                                <div className="form-summary">
                                    <div className="summary-row">
                                        <span>Total Value:</span>
                                        <span className="stat-number">
                                            ₹{Math.round((listingForm.weight_kg / 100) * listingForm.min_price_quintal).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowListingModal(false)}>Cancel</button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleCreateListing}
                                    disabled={creatingListing || !listingForm.commodity}
                                >
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
                            className="modal-content modal-sm"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Initiate Trade</h3>
                                <button onClick={() => setShowTradeModal(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="trade-dealer-card">
                                    <div className="dealer-avatar-sm" style={{ width: 40, height: 40 }}>
                                        {selectedDealer.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="dealer-name-mini">{selectedDealer.name}</div>
                                        <div className="dealer-location-mini">
                                            <MapPin size={10} /> {selectedDealer.location}
                                        </div>
                                    </div>
                                    <div className="dealer-rating-mini">
                                        <Star size={12} style={{ color: 'var(--warning)', fill: 'var(--warning)' }} />
                                        {selectedDealer.rating}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="label">Commodity</label>
                                    <select 
                                        className="input"
                                        value={tradeForm.commodity}
                                        onChange={e => {
                                            const crop = e.target.value;
                                            const price = marketData?.prices?.[crop?.toLowerCase()]?.price || 2000;
                                            setTradeForm({
                                                ...tradeForm,
                                                commodity: crop,
                                                price_per_quintal: price
                                            });
                                        }}
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
                                <div className="form-summary">
                                    <div className="summary-row">
                                        <span>Total Value:</span>
                                        <span className="stat-number">
                                            ₹{((parseInt(tradeForm.qty_quintals) || 0) * (parseInt(tradeForm.price_per_quintal) || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowTradeModal(false)}>Cancel</button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleConfirmTrade}
                                    disabled={tradingId}
                                >
                                    {tradingId ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Trade'}
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