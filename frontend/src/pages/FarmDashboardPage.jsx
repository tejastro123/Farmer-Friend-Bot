import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
    Leaf, Droplets, Sun, CloudRain, Wind, Thermometer, 
    DollarSign, Wallet, CreditCard, TrendingUp, TrendingDown,
    Package, ShoppingCart, Sprout, Tractor, Warehouse,
    Clipboard, CheckCircle, XCircle, AlertTriangle,
    Plus, Calendar, MapPin, BarChart3, PieChart
} from 'lucide-react';
import { farmService } from '../services/api';

const StatCard = ({ icon: Icon, label, value, subtext, color = 'gold' }) => (
    <div className="stat-card-farm">
        <div className={`stat-icon-farm ${color}`}>
            <Icon size={20} />
        </div>
        <div className="stat-content-farm">
            <div className="stat-label-farm">{label}</div>
            <div className="stat-value-farm">{value}</div>
            {subtext && <div className="stat-subtext-farm">{subtext}</div>}
        </div>
    </div>
);

const FarmDashboardPage = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showModal, setShowModal] = useState(null);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const res = await farmService.getDashboardSummary();
            setSummary(res.data);
        } catch (err) {
            console.error("Dashboard load error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const submitForm = async () => {
        setSaving(true);
        try {
            switch (showModal) {
                case 'crop':
                    await farmService.addCropCycle(formData);
                    break;
                case 'expense':
                    await farmService.addExpense(formData);
                    break;
                case 'equipment':
                    await farmService.addEquipment(formData);
                    break;
                case 'seed':
                    await farmService.addSeedInventory(formData);
                    break;
                case 'soil':
                    await farmService.addSoilTest(formData);
                    break;
                default:
                    break;
            }
            setShowModal(null);
            setFormData({});
            loadDashboard();
        } catch (err) {
            console.error("Save error:", err);
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'crops', label: 'Crops', icon: Sprout },
        { id: 'finance', label: 'Finance', icon: DollarSign },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'soil', label: 'Soil Health', icon: Leaf }
    ];

    if (loading) {
        return (
            <div className="farm-page">
                <div className="farm-loading">
                    <div className="loader-grain">
                        <div className="loader-grain-bar"></div>
                        <div className="loader-grain-bar"></div>
                        <div className="loader-grain-bar"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="farm-page">
            <div className="farm-header">
                <div className="farm-title">
                    <Leaf size={28} />
                    <div>
                        <h1>Farm Management</h1>
                        <p>Track all aspects of your farm operations</p>
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={async () => {
                    try {
                        await farmService.syncWeather();
                        loadDashboard();
                    } catch (err) {
                        console.error("Weather sync error:", err);
                    }
                }}>
                    <CloudRain size={16} />
                    Sync Weather
                </button>
                <button className="btn btn-primary" onClick={() => setShowModal('record')}>
                    <Plus size={16} />
                    Add Record
                </button>
            </div>

            <div className="farm-stats-grid">
                <StatCard icon={Sprout} label="Active Crops" value={summary?.active_cycles || 0} subtext="Growing season" color="sage" />
                <StatCard icon={DollarSign} label="Total Expenses" value={`₹${(summary?.total_expenses || 0).toLocaleString()}`} subtext="This season" color="danger" />
                <StatCard icon={TrendingUp} label="Total Income" value={`₹${(summary?.total_income || 0).toLocaleString()}`} subtext="From sales" color="success" />
                <StatCard icon={Tractor} label="Equipment" value={summary?.equipment_count || 0} subtext="In inventory" color="gold" />
                <StatCard icon={Warehouse} label="Seeds Stock" value={summary?.seed_inventory_count || 0} subtext="Items stored" color="info" />
                <StatCard icon={CloudRain} label="Weather Alerts" value={summary?.alerts_count || 0} subtext="Active alerts" color="warning" />
            </div>

            <div className="farm-tabs">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        className={`farm-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="farm-content">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <Motion.div 
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="farm-overview"
                        >
                            <div className="overview-grid">
                                <div className="overview-card">
                                    <h3><Leaf size={18} /> Crop Status</h3>
                                    <div className="overview-stats">
                                        <div className="overview-stat">
                                            <span className="label">Active Cycles</span>
                                            <span className="value">{summary?.active_cycles || 0}</span>
                                        </div>
                                        <div className="overview-stat">
                                            <span className="label">Total Yield</span>
                                            <span className="value">{summary?.total_yield || 0} q</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="overview-card">
                                    <h3><DollarSign size={18} /> Financial Summary</h3>
                                    <div className="overview-stats">
                                        <div className="overview-stat">
                                            <span className="label">Expenses</span>
                                            <span className="value danger">₹{summary?.total_expenses?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="overview-stat">
                                            <span className="label">Income</span>
                                            <span className="value success">₹{summary?.total_income?.toLocaleString() || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="overview-card">
                                    <h3><AlertTriangle size={18} /> Alerts</h3>
                                    <div className="alerts-list">
                                        <div className="alert-item">
                                            <CloudRain size={14} />
                                            <span>{summary?.alerts_count || 0} weather alerts</span>
                                        </div>
                                        <div className="alert-item">
                                            <Clipboard size={14} />
                                            <span>{summary?.pending_schemes || 0} pending schemes</span>
                                        </div>
                                        <div className="alert-item">
                                            <Tractor size={14} />
                                            <span>{summary?.equipment_count || 0} equipment items</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Motion.div>
                    )}

                    {activeTab === 'crops' && (
                        <Motion.div 
                            key="crops"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="farm-section"
                        >
                            <h2>Crop Management</h2>
                            <p>Track your crop cycles, yields, and input usage.</p>
                            <div className="section-placeholder">
                                <Sprout size={48} />
                                <p>Manage your crops here - planting, harvesting, input usage</p>
                                <button className="btn btn-secondary" onClick={() => setShowModal('crop')}>
                                    <Plus size={16} /> Add Crop Cycle
                                </button>
                            </div>
                        </Motion.div>
                    )}

                    {activeTab === 'finance' && (
                        <Motion.div 
                            key="finance"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="farm-section"
                        >
                            <h2>Financial Tracking</h2>
                            <p>Monitor expenses, transactions, loans, and insurance.</p>
                            <div className="section-placeholder">
                                <Wallet size={48} />
                                <p>Track all financial transactions, loans, and insurance policies</p>
                                <button className="btn btn-secondary" onClick={() => setShowModal('expense')}>
                                    <Plus size={16} /> Add Expense
                                </button>
                            </div>
                        </Motion.div>
                    )}

                    {activeTab === 'inventory' && (
                        <Motion.div 
                            key="inventory"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="farm-section"
                        >
                            <h2>Inventory Management</h2>
                            <p>Track seeds, fertilizers, pesticides, and equipment.</p>
                            <div className="section-placeholder">
                                <Warehouse size={48} />
                                <p>Manage your farm inventory - seeds, chemicals, equipment</p>
                                <button className="btn btn-secondary" onClick={() => setShowModal('equipment')}>
                                    <Plus size={16} /> Add Equipment
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowModal('seed')}>
                                    <Plus size={16} /> Add Seeds
                                </button>
                            </div>
                        </Motion.div>
                    )}

                    {activeTab === 'soil' && (
                        <Motion.div 
                            key="soil"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="farm-section"
                        >
                            <h2>Soil Health</h2>
                            <p>Track soil test results and nutrient levels.</p>
                            {summary?.soil_health ? (
                                <div className="soil-card">
                                    <div className="soil-header">
                                        <h3>Latest Soil Test</h3>
                                        <span className="soil-date">{summary.soil_health.test_date}</span>
                                    </div>
                                    <div className="soil-metrics">
                                        <div className="soil-metric">
                                            <span className="label">pH Level</span>
                                            <span className="value">{summary.soil_health.ph_level}</span>
                                        </div>
                                        <div className="soil-metric">
                                            <span className="label">Nitrogen</span>
                                            <span className="value">{summary.soil_health.nitrogen_ppm} ppm</span>
                                        </div>
                                        <div className="soil-metric">
                                            <span className="label">Phosphorus</span>
                                            <span className="value">{summary.soil_health.phosphorus_ppm} ppm</span>
                                        </div>
                                        <div className="soil-metric">
                                            <span className="label">Potassium</span>
                                            <span className="value">{summary.soil_health.potassium_ppm} ppm</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="section-placeholder">
                                    <Leaf size={48} />
                                    <p>No soil tests recorded yet</p>
                                </div>
                            )}
                            <button className="btn btn-secondary" onClick={() => setShowModal('soil')}>
                                <Plus size={16} /> Add Soil Test
                            </button>
                        </Motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showModal && (
                    <Motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModal(null)}
                    >
                        <Motion.div 
                            className="modal-content farm-modal"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>
                                    {showModal === 'record' && 'Add Record'}
                                    {showModal === 'crop' && 'Add Crop Cycle'}
                                    {showModal === 'expense' && 'Add Expense'}
                                    {showModal === 'equipment' && 'Add Equipment'}
                                    {showModal === 'seed' && 'Add Seed Inventory'}
                                    {showModal === 'soil' && 'Add Soil Test'}
                                </h2>
                                <button className="modal-close" onClick={() => setShowModal(null)}>
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="modal-body">
                                {showModal === 'crop' && (
                                    <>
                                        <div className="form-group">
                                            <label>Crop Name</label>
                                            <input type="text" name="crop_name" placeholder="e.g., Wheat, Rice" onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Variety</label>
                                            <input type="text" name="variety" placeholder="e.g., HD-2967" onChange={handleInputChange} />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Area (acres)</label>
                                                <input type="number" name="area_acres" onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group">
                                                <label>Sowing Date</label>
                                                <input type="date" name="sowing_date" onChange={handleInputChange} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Status</label>
                                            <select name="status" onChange={handleInputChange}>
                                                <option value="">Select status</option>
                                                <option value="planned">Planned</option>
                                                <option value="sowing">Sowing</option>
                                                <option value="growing">Growing</option>
                                                <option value="harvested">Harvested</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {showModal === 'expense' && (
                                    <>
                                        <div className="form-group">
                                            <label>Category</label>
                                            <select name="category" onChange={handleInputChange}>
                                                <option value="">Select category</option>
                                                <option value="seeds">Seeds</option>
                                                <option value="fertilizer">Fertilizer</option>
                                                <option value="pesticide">Pesticide</option>
                                                <option value="fuel">Fuel</option>
                                                <option value="labor">Labor</option>
                                                <option value="equipment">Equipment</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Description</label>
                                            <input type="text" name="description" placeholder="What did you buy?" onChange={handleInputChange} />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Amount (₹)</label>
                                                <input type="number" name="amount" onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group">
                                                <label>Date</label>
                                                <input type="date" name="expense_date" onChange={handleInputChange} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Payment Mode</label>
                                            <select name="payment_mode" onChange={handleInputChange}>
                                                <option value="">Select mode</option>
                                                <option value="cash">Cash</option>
                                                <option value="upi">UPI</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="loan">Loan</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {showModal === 'equipment' && (
                                    <>
                                        <div className="form-group">
                                            <label>Equipment Name</label>
                                            <input type="text" name="equipment_name" placeholder="e.g., Tractor, Harvester" onChange={handleInputChange} />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Type</label>
                                                <select name="equipment_type" onChange={handleInputChange}>
                                                    <option value="">Select type</option>
                                                    <option value="tractor">Tractor</option>
                                                    <option value="harvester">Harvester</option>
                                                    <option value="sprayer">Sprayer</option>
                                                    <option value="irrigation">Irrigation</option>
                                                    <option value="storage">Storage</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Quantity</label>
                                                <input type="number" name="quantity" onChange={handleInputChange} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Purchase Date</label>
                                            <input type="date" name="purchase_date" onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Status</label>
                                            <select name="status" onChange={handleInputChange}>
                                                <option value="">Select status</option>
                                                <option value="operational">Operational</option>
                                                <option value="maintenance">Needs Maintenance</option>
                                                <option value="retired">Retired</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {showModal === 'seed' && (
                                    <>
                                        <div className="form-group">
                                            <label>Seed Name</label>
                                            <input type="text" name="seed_name" placeholder="e.g., Wheat HD-2967" onChange={handleInputChange} />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Quantity (kg)</label>
                                                <input type="number" name="quantity_kg" onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group">
                                                <label>Price (₹)</label>
                                                <input type="number" name="price" onChange={handleInputChange} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Purchase Date</label>
                                            <input type="date" name="purchase_date" onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Supplier</label>
                                            <input type="text" name="supplier" placeholder="Seed supplier name" onChange={handleInputChange} />
                                        </div>
                                    </>
                                )}

                                {showModal === 'soil' && (
                                    <>
                                        <div className="form-group">
                                            <label>Test Date</label>
                                            <input type="date" name="test_date" onChange={handleInputChange} />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>pH Level</label>
                                                <input type="number" step="0.1" name="ph_level" placeholder="6.5 - 7.5" onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group">
                                                <label>Organic Carbon (%)</label>
                                                <input type="number" step="0.1" name="organic_carbon_pct" onChange={handleInputChange} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Nitrogen (ppm)</label>
                                                <input type="number" name="nitrogen_ppm" onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group">
                                                <label>Phosphorus (ppm)</label>
                                                <input type="number" name="phosphorus_ppm" onChange={handleInputChange} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Potassium (ppm)</label>
                                                <input type="number" name="potassium_ppm" onChange={handleInputChange} />
                                            </div>
                                            <div className="form-group">
                                                <label>Soil Type</label>
                                                <select name="soil_type" onChange={handleInputChange}>
                                                    <option value="">Select type</option>
                                                    <option value="clay">Clay</option>
                                                    <option value="sandy">Sandy</option>
                                                    <option value="loamy">Loamy</option>
                                                    <option value="silt">Silt</option>
                                                    <option value="peaty">Peaty</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {showModal === 'record' && (
                                    <div className="record-options">
                                        <button className="record-option" onClick={() => setShowModal('crop')}>
                                            <Sprout size={24} />
                                            <span>Add Crop Cycle</span>
                                        </button>
                                        <button className="record-option" onClick={() => setShowModal('expense')}>
                                            <Wallet size={24} />
                                            <span>Add Expense</span>
                                        </button>
                                        <button className="record-option" onClick={() => setShowModal('equipment')}>
                                            <Tractor size={24} />
                                            <span>Add Equipment</span>
                                        </button>
                                        <button className="record-option" onClick={() => setShowModal('seed')}>
                                            <Package size={24} />
                                            <span>Add Seeds</span>
                                        </button>
                                        <button className="record-option" onClick={() => setShowModal('soil')}>
                                            <Leaf size={24} />
                                            <span>Add Soil Test</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {showModal !== 'record' && (
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setShowModal(null)}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={submitForm} disabled={saving}>
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            )}
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FarmDashboardPage;