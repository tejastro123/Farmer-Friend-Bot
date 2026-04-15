import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mandiService } from '../services/api';
import { motion as Motion } from 'framer-motion';
import { 
    ChevronLeft, Printer, DownloadCloud, 
    ShieldCheck, QrCode, FileText, MapPin, 
    Clock, Scale, Zap, Info, Award, CheckCircle,
    Building2, UserCheck, CreditCard, ExternalLink
} from 'lucide-react';

const BillPage = () => {
    const { dealId } = useParams();
    const navigate = useNavigate();
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeal = async () => {
            try {
                const res = await mandiService.getDeal(dealId);
                setDeal(res.data);
            } catch (err) {
                console.error("Ledger sync failure:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDeal();
    }, [dealId]);

    const handlePrint = () => {
        window.print();
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

    if (!deal) {
        return (
            <div className="flex items-center justify-center" style={{ height: 'calc(100vh - var(--nav-height))' }}>
                <div className="surface p-xl text-center">
                    <FileText size={64} className="text-danger mx-auto mb-6" style={{ opacity: 0.5 }} />
                    <h2 className="mb-3">Transaction Not Found</h2>
                    <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>The requested transaction could not be found.</p>
                    <button onClick={() => navigate('/market')} className="btn btn-primary">Return to Market</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bill-page">
            <div className="bill-toolbar">
                <button onClick={() => navigate('/market')} className="bill-back-btn">
                    <ChevronLeft size={16} /> Exit to Market
                </button>
                <div className="bill-actions">
                    <button onClick={handlePrint} className="btn btn-primary bill-print-btn">
                        <DownloadCloud size={18} /> Download PDF
                    </button>
                    <button onClick={handlePrint} className="btn btn-secondary" style={{ padding: '10px' }}>
                        <Printer size={18} />
                    </button>
                </div>
            </div>

            <Motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bill-document"
            >
                <div className="bill-header">
                    <div className="bill-brand">
                        <div className="bill-brand-icon">
                            <ShieldCheck size={24} />
                        </div>
                        <div className="bill-brand-text">
                            <h1>KrishiMitra <span>MATRIX</span></h1>
                        </div>
                    </div>
                    <div>
                        <div className="bill-invoice-label">Tax Invoice</div>
                        <div className="bill-invoice-number">{deal.bill_no || deal.id}</div>
                    </div>
                </div>

                <div className="bill-body">
                    <div className="bill-entities">
                        <div className="bill-entity seller">
                            <div className="bill-entity-label">
                                <UserCheck size={12} className="inline mr-1" /> Seller
                            </div>
                            <div className="bill-entity-name">Farmer Unique ID: KM-PUNE-9902</div>
                            <div className="bill-entity-details">
                                <p>Agri-Node: Pune-Mah-West</p>
                                <p>APMC License: AP-REG-2026-X</p>
                            </div>
                        </div>
                        <div className="bill-entity buyer">
                            <div className="bill-entity-label">
                                <Building2 size={12} className="inline mr-1" /> Buyer
                            </div>
                            <div className="bill-entity-name">{deal.dealer}</div>
                            <div className="bill-entity-details">
                                <p><MapPin size={10} className="inline mr-1" /> APMC Terminal 4-Industrial Park</p>
                                <p>Logistics Hub, Pune North-West</p>
                            </div>
                        </div>
                    </div>

                    <div className="bill-metadata">
                        <div className="bill-meta-item">
                            <div className="bill-meta-label">Trade Date</div>
                            <div className="bill-meta-value">{deal.date}</div>
                        </div>
                        <div className="bill-meta-item">
                            <div className="bill-meta-label">Ledger ID</div>
                            <div className="bill-meta-value" style={{ color: 'var(--success)' }}>{deal.id.slice(0,12)}</div>
                        </div>
                        <div className="bill-meta-item">
                            <div className="bill-meta-label">Payment</div>
                            <div className="bill-meta-value">
                                <CreditCard size={10} className="inline mr-1" /> Verified
                            </div>
                        </div>
                    </div>

                    <table className="bill-table">
                        <thead>
                            <tr>
                                <th>Commodity</th>
                                <th style={{ textAlign: 'center' }}>Qty (Qtl)</th>
                                <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                                <th style={{ textAlign: 'right' }}>Value (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div className="bill-commodity">{deal.commodity}</div>
                                    <div className="bill-commodity-desc">
                                        <Award size={10} className="inline mr-1" style={{ color: 'var(--success)' }} />
                                        High Moisture Quality
                                    </div>
                                </td>
                                <td className="bill-qty">{deal.qty_quintals}</td>
                                <td className="bill-rate">₹{deal.price_per_quintal?.toLocaleString() || '2,450'}</td>
                                <td className="bill-total">₹{deal.total.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="bill-summary">
                        <div className="bill-declaration">
                            <div className="bill-declaration-title">
                                <Info size={10} className="inline mr-1" /> Trade Declaration
                            </div>
                            <div className="bill-declaration-text">
                                <p>• Digitally indexed via Matrix Core v4.2 Protocol.</p>
                                <p>• Value inclusive of regional mandi cess/levies.</p>
                                <p>• Funds dispersed to Primary Producer DBT account.</p>
                            </div>
                        </div>
                        <div className="bill-final">
                            <div className="bill-final-label">Final Disbursement</div>
                            <div className="bill-final-value">
                                <span className="bill-final-symbol">₹</span>
                                {(deal.total - (deal.total * 0.01)).toLocaleString()}
                            </div>
                            <div style={{ marginTop: 'var(--space-sm)', fontSize: '10px', color: 'var(--success)' }}>
                                <CheckCircle size={10} className="inline mr-1" /> SETTLED
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bill-footer">
                    <div className="bill-footer-text">
                        APMC REGULATED • E-DEED SETTLEMENT • LEDGER V4.2
                    </div>
                </div>
            </Motion.div>
        </div>
    );
};

export default BillPage;
