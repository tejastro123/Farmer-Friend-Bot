import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mandiService } from '../services/api';
import { motion as Motion } from 'framer-motion';

import { 
    CheckCircle, XCircle, ArrowLeft, ArrowRight, Loader2,
    MapPin, Package, DollarSign, User, FileText,
    Clock, ShieldCheck, AlertTriangle, ShoppingBag, Edit3
} from 'lucide-react';

const TradeConfirmPage = () => {
    const navigate = useNavigate();
    const { dealId } = useParams();
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [editing, setEditing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        commodity: '',
        qty_quintals: '',
        price_per_quintal: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDeal = async () => {
            try {
                const res = await mandiService.getDeal(dealId);
                setDeal(res.data);
            } catch (err) {
                console.error("Failed to fetch deal:", err);
                setError(err.message || 'Failed to load deal');
            } finally {
                setLoading(false);
            }
        };
        fetchDeal();
    }, [dealId]);

    const handleConfirm = async () => {
        setConfirming(true);
        try {
            await mandiService.confirmTrade(dealId);
            navigate(`/market/payment/${dealId}`);
        } catch (err) {
            console.error("Failed to confirm trade:", err);
            alert('Failed to confirm trade: ' + (err.response?.data?.detail || err.message));
        } finally {
            setConfirming(false);
        }
    };

    const handleCancel = () => {
        navigate('/market');
    };

    const handleEditClick = () => {
        setEditForm({
            commodity: deal.commodity,
            qty_quintals: deal.qty_quintals,
            price_per_quintal: deal.price_per_quintal
        });
        setEditing(true);
    };

    const handleSaveEdit = async () => {
        setUpdating(true);
        try {
            const res = await mandiService.updateTrade(dealId, {
                commodity: editForm.commodity,
                qty_quintals: parseInt(editForm.qty_quintals),
                price_per_quintal: parseInt(editForm.price_per_quintal)
            });
            setDeal(res.data);
            setEditing(false);
        } catch (err) {
            console.error("Failed to update trade:", err);
            alert('Failed to update trade: ' + (err.response?.data?.detail || err.message));
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelEdit = () => {
        setEditing(false);
        setEditForm({ commodity: '', qty_quintals: '', price_per_quintal: '' });
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

    if (error || !deal) {
        return (
            <div className="flex items-center justify-center" style={{ height: 'calc(100vh - var(--nav-height))' }}>
                <div className="surface p-xl text-center" style={{ maxWidth: '400px' }}>
                    <AlertTriangle size={64} className="mx-auto mb-6" style={{ color: 'var(--danger)', opacity: 0.5 }} />
                    <h2 className="mb-3">Deal Not Found</h2>
                    <p className="text-sm mb-8">{error || 'The requested deal could not be found.'}</p>
                    <button onClick={() => navigate('/market')} className="btn btn-primary">Back to Market</button>
                </div>
            </div>
        );
    }

    const isPending = deal.status === 'Pending';
    const isConfirmed = deal.status === 'Confirmed';

    return (
        <div className="page-container">
            {/* Page Header */}
            <header className="page-header">
                <div className="flex items-center gap-md">
                    <button onClick={() => navigate('/market')} className="btn btn-secondary btn-icon">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="page-title">
                            <FileText size={24} />
                            Confirm Trade
                        </h1>
                        <p className="page-subtitle">Review and confirm your trade details</p>
                    </div>
                </div>
                <div className="status-badge-container">
                    <span className={`status-badge status-${deal.status.toLowerCase()}`}>
                        {deal.status === 'Pending' && <Clock size={14} />}
                        {deal.status === 'Confirmed' && <CheckCircle size={14} />}
                        {deal.status}
                    </span>
                </div>
            </header>

            {/* Progress Steps */}
            <div className="trade-progress">
                <div className="progress-step completed">
                    <div className="step-circle"><CheckCircle size={16} /></div>
                    <span className="step-label">Initiated</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${isPending ? 'active' : isConfirmed ? 'completed' : ''}`}>
                    <div className="step-circle">{isPending ? '2' : <CheckCircle size={16} />}</div>
                    <span className="step-label">Confirm</span>
                </div>
                <div className="progress-line"></div>
                <div className="progress-step">
                    <div className="step-circle">3</div>
                    <span className="step-label">Payment</span>
                </div>
                <div className="progress-line"></div>
                <div className="progress-step">
                    <div className="step-circle">4</div>
                    <span className="step-label">Bill</span>
                </div>
            </div>

            {/* Trade Details Card */}
            <div className="confirm-card-container">
                <Motion.div 
                    className="confirm-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="confirm-header">
                        <div className="confirm-title">Trade Details</div>
                        <div className="confirm-id">{deal.id}</div>
                        {isPending && !editing && (
                            <button 
                                onClick={handleEditClick}
                                className="btn btn-secondary btn-sm"
                                style={{ marginLeft: 'auto', marginRight: '8px' }}
                            >
                                <Edit3 size={14} />
                                Edit
                            </button>
                        )}
                    </div>

                    <div className="confirm-details">
                        {editing ? (
                            <>
                                <div className="detail-row">
                                    <div className="detail-icon"><User size={18} /></div>
                                    <div className="detail-content">
                                        <div className="detail-label">Dealer</div>
                                        <div className="detail-value">{deal.dealer}</div>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-icon"><Package size={18} /></div>
                                    <div className="detail-content">
                                        <div className="detail-label">Commodity</div>
                                        <select 
                                            className="input"
                                            value={editForm.commodity}
                                            onChange={e => setEditForm({...editForm, commodity: e.target.value})}
                                        >
                                            <option value="Wheat">Wheat</option>
                                            <option value="Rice">Rice</option>
                                            <option value="Maize">Maize</option>
                                            <option value="Tomato">Tomato</option>
                                            <option value="Onion">Onion</option>
                                            <option value="Cotton">Cotton</option>
                                            <option value="Soybean">Soybean</option>
                                            <option value="Sugarcane">Sugarcane</option>
                                            <option value="Potato">Potato</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-icon"><ShoppingBag size={18} /></div>
                                    <div className="detail-content">
                                        <div className="detail-label">Quantity (Quintals)</div>
                                        <input 
                                            type="number"
                                            className="input"
                                            value={editForm.qty_quintals}
                                            onChange={e => setEditForm({...editForm, qty_quintals: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-icon"><DollarSign size={18} /></div>
                                    <div className="detail-content">
                                        <div className="detail-label">Price per Quintal (₹)</div>
                                        <input 
                                            type="number"
                                            className="input"
                                            value={editForm.price_per_quintal}
                                            onChange={e => setEditForm({...editForm, price_per_quintal: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="detail-row">
                                    <div className="detail-icon"><User size={18} /></div>
                                    <div className="detail-content">
                                        <div className="detail-label">Dealer</div>
                                        <div className="detail-value">{deal.dealer}</div>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-icon"><Package size={18} /></div>
                                    <div className="detail-content">
                                        <div className="detail-label">Commodity</div>
                                        <div className="detail-value">{deal.commodity}</div>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-icon"><ShoppingBag size={18} /></div>
                                    <div className="detail-content">
                                        <div className="detail-label">Quantity</div>
                                        <div className="detail-value">{deal.qty_quintals} Quintals</div>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-icon"><DollarSign size={18} /></div>
                                    <div className="detail-content">
                                        <div className="detail-label">Price per Quintal</div>
                                        <div className="detail-value">₹{deal.price_per_quintal}</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {editing && (
                        <div className="confirm-total">
                            <div className="total-label">New Total Amount</div>
                            <div className="total-value">₹{(
                                parseInt(editForm.qty_quintals || 0) * parseInt(editForm.price_per_quintal || 0)
                            ).toLocaleString()}</div>
                        </div>
                    )}

                    <div className="confirm-meta">
                        <div className="meta-item">
                            <span className="meta-label">Bill No:</span>
                            <span className="meta-value">{deal.bill_no}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Date:</span>
                            <span className="meta-value">{deal.date}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Created:</span>
                            <span className="meta-value">{deal.created_at?.replace('T', ' ') || 'Just now'}</span>
                        </div>
                    </div>
                </Motion.div>

                {/* Info Panel */}
                <Motion.div 
                    className="info-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="info-title">
                        <ShieldCheck size={18} />
                        Before You Confirm
                    </div>
                    <ul className="info-list">
                        <li>Ensure the commodity quality meets dealer's standards</li>
                        <li>Delivery location and timing are agreed upon</li>
                        <li>Price reflects current market rates</li>
                        <li>Payment will be processed after confirmation</li>
                    </ul>

                    <div className="warning-box">
                        <AlertTriangle size={16} />
                        <span>Once confirmed, this trade cannot be cancelled. Please review carefully.</span>
                    </div>
                </Motion.div>
            </div>

            {/* Action Buttons */}
            <div className="confirm-actions">
                {editing ? (
                    <>
                        <button onClick={handleCancelEdit} className="btn btn-secondary" disabled={updating}>
                            <XCircle size={18} />
                            Cancel Edit
                        </button>
                        <button 
                            onClick={handleSaveEdit} 
                            disabled={updating}
                            className="btn btn-primary"
                        >
                            {updating ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={handleCancel} className="btn btn-secondary">
                            <XCircle size={18} />
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirm} 
                            disabled={confirming}
                            className="btn btn-primary"
                        >
                            {confirming ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Confirm & Proceed to Payment
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default TradeConfirmPage;