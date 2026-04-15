import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mandiService } from '../services/api';
import { motion as Motion } from 'framer-motion';
import { 
    ChevronLeft, Printer, DownloadCloud, Share2, 
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
            <div className="flex items-center justify-center min-h-screen bg-main">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
                    <div className="text-secondary font-black text-[10px] uppercase tracking-[0.3em]">Decrypting Ledger Entry...</div>
                </div>
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-main p-12 text-center">
                <FileText size={64} className="text-danger mb-6 opacity-20" />
                <h2 className="text-2xl font-black mb-3">Transaction Not Found</h2>
                <button onClick={() => navigate('/market')} className="btn btn-primary px-8">Return to Hub</button>
            </div>
        );
    }

    return (
        <div className="bill-reset-scope font-sans">
            {/* Action Toolbar (Fixed Position - Isolated from Flex flow) */}
            <div 
                className="fixed top-24 left-0 right-0 z-50 px-4 print-hidden"
                style={{ position: 'fixed', top: '6rem', left: 0, right: 0, zIndex: 100 }}
            >
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <button 
                        onClick={() => navigate('/market')}
                        className="btn btn-secondary px-6 py-3 !rounded-2xl"
                    >
                        <ChevronLeft size={16} /> Exit to Market
                    </button>
                    <div className="flex gap-4">
                        <button 
                            onClick={handlePrint}
                            className="btn btn-primary px-8 py-4 !rounded-2xl shadow-2xl shadow-secondary/20"
                        >
                            <DownloadCloud size={20} /> Download PDF
                        </button>
                        <button 
                            onClick={handlePrint}
                            className="btn btn-secondary p-4 !rounded-2xl"
                        >
                            <Printer size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* THE COMPACT REALISTIC BILL (Centered in viewport) */}
            <div className="bill-viewport-centered">
                <Motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="printable-bill"
                    className="bill-paper-card rounded-[2.5rem] overflow-hidden relative"
                >
                {/* Official Branding Header */}
                <div className="p-12 border-b-4 border-black flex justify-between items-start">
                    <div className="flex gap-5 items-center">
                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-secondary">
                            <ShieldCheck size={36} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter leading-none m-0">KRISHIMITRA <span className="text-success">MATRIX</span></h1>
                            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mt-1">Direct-to-Buyer Commercial Deed</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-black tracking-[0.2em] text-gray-200 m-0 leading-none">TAX INVOICE</h2>
                        <div className="mt-4">
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Serial Number</div>
                            <div className="text-xl font-black font-mono tracking-tighter text-black">{deal.bill_no}</div>
                        </div>
                    </div>
                </div>

                <div className="p-12 space-y-12">
                    {/* Entity Matrix */}
                    <div className="grid grid-cols-2 gap-12">
                        <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl">
                            <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <UserCheck size={12}/> Origin (Seller)
                            </h5>
                            <div className="font-black text-lg text-black">Farmer Unique ID: KM-PUNE-9902</div>
                            <div className="text-xs text-gray-500 mt-3 space-y-1">
                                <p>Agri-Node: Pune-Mah-West</p>
                                <p>APMC License: AP-REG-2026-X</p>
                                <p className="italic font-medium">Secondary Node: Matrix-Sync-Active</p>
                            </div>
                        </div>
                        <div className="p-8 border-2 border-black rounded-3xl bg-gray-50/50">
                            <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Building2 size={12}/> Beneficiary (Buyer)
                            </h5>
                            <div className="font-black text-xl text-black uppercase">{deal.dealer}</div>
                            <div className="text-xs text-gray-500 mt-3 space-y-1">
                                <p className="flex items-center gap-1 font-bold"><MapPin size={10}/> APMC Terminal 4-Industrial Park</p>
                                <p>Logistics Hub, Pune North-West</p>
                                <p>PAN/TAN: KM-CORP-9921-X</p>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="flex justify-between items-center py-6 border-y border-gray-100 px-4">
                        <div className="text-center px-6">
                            <div className="text-[8px] font-black text-gray-300 uppercase mb-1">Trade Date</div>
                            <div className="text-[11px] font-black">{deal.date}</div>
                        </div>
                        <div className="text-center border-l border-gray-100 flex-1">
                            <div className="text-[8px] font-black text-gray-300 uppercase mb-1">Ledger ID</div>
                            <div className="text-[11px] font-black font-mono uppercase text-success">{deal.id.slice(0,12)}</div>
                        </div>
                        <div className="text-center border-l border-gray-100 px-6">
                            <div className="text-[8px] font-black text-gray-300 uppercase mb-1">Payment</div>
                            <div className="text-[11px] font-black flex items-center gap-1 uppercase tracking-widest text-gray-400">
                                <CreditCard size={10}/> Verified
                            </div>
                        </div>
                    </div>

                    {/* Compact Valuation Table */}
                    <div className="space-y-4">
                        <table className="w-full text-left">
                            <thead className="bill-table-header">
                                <tr>
                                    <th className="py-5 px-4 rounded-l-xl">Commodity Description</th>
                                    <th className="py-5 text-center">Metric (QTL)</th>
                                    <th className="py-5 text-right">Unit Rate (₹)</th>
                                    <th className="py-5 pr-4 text-right rounded-r-xl">Net Value (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-black">
                                <tr className="bill-zebra-row">
                                    <td className="py-8 px-4">
                                        <div className="text-2xl font-black mb-1 text-black uppercase tracking-tighter">{deal.commodity}</div>
                                        <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1">
                                            <Award size={10} className="text-success" fill="currentColor"/> High Moisture Quality Matrix
                                        </div>
                                    </td>
                                    <td className="py-8 text-center text-xl font-mono text-black">{deal.qty_quintals}</td>
                                    <td className="py-8 text-right text-gray-500 font-mono">₹{deal.price_per_quintal.toLocaleString()}</td>
                                    <td className="py-8 pr-4 text-right text-3xl font-black text-black">₹{deal.total.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Total Matrix Breakdown */}
                    <div className="flex justify-between items-end gap-12 pt-8">
                        <div className="flex-1 space-y-4">
                             <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <h5 className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Info size={10}/> Trade Declaration
                                </h5>
                                <div className="text-[9px] text-gray-400 font-bold leading-relaxed space-y-1">
                                    <p>• Digitally indexed via Matrix Core v4.2 Protocol.</p>
                                    <p>• Value inclusive of regional mandi cess/levies.</p>
                                    <p>• Funds dispersed to Primary Producer DBT account.</p>
                                </div>
                             </div>
                        </div>
                        <div className="w-[300px] space-y-4">
                            <div className="flex justify-between text-[10px] font-black text-gray-300 uppercase tracking-widest px-4">
                                <span>Sub-Total Valuation</span>
                                <span>₹{deal.total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-gray-300 uppercase tracking-widest px-4 pb-2 border-b border-gray-100">
                                <span>Regulatory Levies (1%)</span>
                                <span>₹{(deal.total * 0.01).toLocaleString()}</span>
                            </div>
                            <div className="bg-black text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-success/10 rounded-full blur-3xl"></div>
                                <h4 className="text-[9px] font-black text-secondary uppercase tracking-[0.4em] mb-4 opacity-50">FINAL DISBURSEMENT</h4>
                                <div className="text-4xl font-black tracking-tighter flex items-start gap-1 font-mono">
                                    <span className="text-xs font-bold text-success mt-2">₹</span>
                                    {(deal.total - (deal.total * 0.01)).toLocaleString()}
                                </div>
                                <div className="mt-6 flex items-center gap-2 text-white/30 text-[8px] font-black uppercase tracking-widest">
                                    <CheckCircle size={10} className="text-success" /> SETTLEMENT SUCCESS
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Authenticity Footer */}
                    <div className="pt-16 flex justify-between items-end border-t border-gray-100">
                        <div className="flex gap-8 items-center">
                            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-center shadow-inner">
                                <QrCode size={64} className="opacity-30" />
                            </div>
                            <div>
                                <h6 className="text-[10px] font-black uppercase tracking-widest mb-1 text-gray-400">Authenticity ID</h6>
                                <p className="text-[11px] font-bold font-mono text-gray-300 mb-6">{deal.id.toUpperCase()}-VERIFIED</p>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 border border-gray-100">
                                        <Zap size={18} />
                                    </div>
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 border border-gray-100">
                                        <Scale size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="inline-flex items-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl mb-4 shadow-xl">
                                <div className="text-right">
                                    <div className="text-[8px] font-black text-success uppercase tracking-widest mb-1">Indexed by Matrix AI</div>
                                    <div className="text-sm font-black tracking-widest uppercase">Verified Deed</div>
                                </div>
                                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                                    <ExternalLink size={18} className="text-success"/>
                                </div>
                             </div>
                             <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest leading-relaxed max-w-[240px]">
                                This Matrix Settlement entry is primary evidence of legal commerce within the Matrix AGRI-ECO Framework v4.
                             </p>
                        </div>
                    </div>
                </div>

                {/* Footer Strip */}
                <div className="bg-gray-50/50 p-10 text-center border-t border-gray-50">
                    <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.5em] leading-none mb-0">
                        APMC REGULATED // E-DEED SETTLEMENT // LEDGER V4.2
                    </p>
                </div>
            </Motion.div>
            </div>
        </div>
    );
};

export default BillPage;
