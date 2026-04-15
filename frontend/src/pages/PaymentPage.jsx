import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mandiService } from '../services/api';
import { motion as Motion } from 'framer-motion';

import { 
    CreditCard, Smartphone, Building, ArrowLeft, ArrowRight, Loader2,
    DollarSign, User, Package, CheckCircle, Lock, AlertTriangle,
    FileText, QrCode, Wallet
} from 'lucide-react';

const PaymentPage = () => {
    const navigate = useNavigate();
    const { dealId } = useParams();
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState('UPI');

    const paymentMethods = [
        { id: 'UPI', name: 'UPI', icon: Smartphone, desc: 'Instant transfer via UPI' },
        { id: 'Bank Transfer', name: 'Bank Transfer', icon: Building, desc: 'NEFT/RTGS transfer' },
        { id: 'Wallet', name: 'Digital Wallet', icon: Wallet, desc: 'Pay via wallet balance' },
    ];

    useEffect(() => {
        const fetchDeal = async () => {
            try {
                const res = await mandiService.getDeal(dealId);
                setDeal(res.data);
                
                if (res.data.status !== 'Confirmed') {
                    if (res.data.status === 'Pending') {
                        navigate(`/market/confirm/${dealId}`);
                    } else if (res.data.status === 'Paid' || res.data.status === 'Completed') {
                        navigate(`/market/bill/${dealId}`);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch deal:", err);
                setError(err.message || 'Failed to load deal');
            } finally {
                setLoading(false);
            }
        };
        fetchDeal();
    }, [dealId]);

    const handlePayment = async () => {
        setProcessing(true);
        try {
            await mandiService.recordPayment(dealId, selectedMethod);
            await mandiService.completeTrade(dealId);
            navigate(`/market/bill/${dealId}`);
        } catch (err) {
            console.error("Payment failed:", err);
            alert('Payment failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = () => {
        navigate(`/market/confirm/${dealId}`);
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
                    <h2 className="mb-3">Payment Error</h2>
                    <p className="text-sm mb-8">{error || 'Unable to process payment.'}</p>
                    <button onClick={() => navigate('/market')} className="btn btn-primary">Back to Market</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Page Header */}
            <header className="page-header">
                <div className="flex items-center gap-md">
                    <button onClick={() => navigate(`/market/confirm/${dealId}`)} className="btn btn-secondary btn-icon">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="page-title">
                            <CreditCard size={24} />
                            Payment
                        </h1>
                        <p className="page-subtitle">Complete your payment to finalize the trade</p>
                    </div>
                </div>
                <div className="status-badge-container">
                    <span className="status-badge status-confirmed">
                        <DollarSign size={14} />
                        Ready for Payment
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
                <div className="progress-step completed">
                    <div className="step-circle"><CheckCircle size={16} /></div>
                    <span className="step-label">Confirmed</span>
                </div>
                <div className="progress-line"></div>
                <div className="progress-step active">
                    <div className="step-circle">3</div>
                    <span className="step-label">Payment</span>
                </div>
                <div className="progress-line"></div>
                <div className="progress-step">
                    <div className="step-circle">4</div>
                    <span className="step-label">Bill</span>
                </div>
            </div>

            {/* Payment Content */}
            <div className="payment-grid">
                {/* Trade Summary */}
                <Motion.div 
                    className="payment-summary"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="summary-header">
                        <FileText size={18} />
                        <span>Trade Summary</span>
                    </div>
                    
                    <div className="summary-details">
                        <div className="summary-row">
                            <span className="summary-label">Deal ID</span>
                            <span className="summary-value">{deal.id}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Dealer</span>
                            <span className="summary-value">{deal.dealer}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Commodity</span>
                            <span className="summary-value">{deal.commodity}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Quantity</span>
                            <span className="summary-value">{deal.qty_quintals} Q</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Rate</span>
                            <span className="summary-value">₹{deal.price_per_quintal}/Q</span>
                        </div>
                    </div>

                    <div className="summary-total">
                        <span>Total Amount</span>
                        <span className="total-amount">₹{deal.total?.toLocaleString()}</span>
                    </div>
                </Motion.div>

                {/* Payment Methods */}
                <Motion.div 
                    className="payment-methods"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="methods-header">
                        <CreditCard size={18} />
                        <span>Select Payment Method</span>
                    </div>

                    <div className="method-options">
                        {paymentMethods.map((method) => (
                            <div 
                                key={method.id}
                                className={`method-option ${selectedMethod === method.id ? 'selected' : ''}`}
                                onClick={() => setSelectedMethod(method.id)}
                            >
                                <div className="method-icon">
                                    <method.icon size={24} />
                                </div>
                                <div className="method-info">
                                    <div className="method-name">{method.name}</div>
                                    <div className="method-desc">{method.desc}</div>
                                </div>
                                <div className="method-check">
                                    {selectedMethod === method.id && <CheckCircle size={20} />}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Payment Details Input */}
                    <div className="payment-details-input">
                        <div className="input-label">Payment Reference</div>
                        {selectedMethod === 'UPI' && (
                            <div className="upi-input">
                                <input 
                                    type="text" 
                                    placeholder="Enter UPI ID (e.g., farmer@oksbi)"
                                    className="input"
                                />
                                <div className="upi-note">
                                    <QrCode size={14} />
                                    <span>Scan QR at dealer location</span>
                                </div>
                            </div>
                        )}
                        {selectedMethod === 'Bank Transfer' && (
                            <div className="bank-details">
                                <div className="bank-info-row">
                                    <span>Account:</span>
                                    <span className="bank-value">KrishiMitra Digital</span>
                                </div>
                                <div className="bank-info-row">
                                    <span>Bank:</span>
                                    <span className="bank-value">State Bank of India</span>
                                </div>
                                <div className="bank-info-row">
                                    <span>Ac/No:</span>
                                    <span className="bank-value">XXXXXXXX1234</span>
                                </div>
                                <div className="bank-info-row">
                                    <span>IFSC:</span>
                                    <span className="bank-value">SBIN0001234</span>
                                </div>
                            </div>
                        )}
                        {selectedMethod === 'Wallet' && (
                            <div className="wallet-balance">
                                <span>Available Balance:</span>
                                <span className="balance-amount">₹50,000</span>
                            </div>
                        )}
                    </div>

                    {/* Security Note */}
                    <div className="security-note">
                        <Lock size={14} />
                        <span>Your payment is secured with 256-bit encryption</span>
                    </div>
                </Motion.div>
            </div>

            {/* Action Buttons */}
            <div className="payment-actions">
                <button onClick={handleCancel} className="btn btn-secondary">
                    <ArrowLeft size={18} />
                    Back
                </button>
                <button 
                    onClick={handlePayment} 
                    disabled={processing}
                    className="btn btn-primary btn-pay"
                >
                    {processing ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <>
                            <DollarSign size={18} />
                            Pay ₹{deal.total?.toLocaleString()}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default PaymentPage;