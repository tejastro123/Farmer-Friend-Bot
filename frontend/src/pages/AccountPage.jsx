import React, { useState, useEffect } from 'react';
import { authService, mandiService } from '../services/api';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
    MapPin, Thermometer, Sprout, Save, AlertCircle, CheckCircle, 
    TrendingUp, ShieldCheck, Zap, Calendar, ArrowRight, Activity,
    CloudRain, DollarSign, Award, Settings, Globe, Bell, Lock, Volume2
} from 'lucide-react';

const AccountPage = () => {
    const [profile, setProfile] = useState({
        latitude: '', longitude: '', soil_role: 'Alluvial',
        farm_size: '', primary_crop: 'Rice', sowing_date: '', location_name: '',
        phone_number: '', aadhaar_number: '', kcc_number: '',
        survey_number: '', khata_number: '',
        bank_name: '', bank_account_number: '', ifsc_code: ''
    });
    const [mandiData, setMandiData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncStatus, setSyncStatus] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('overview');

    const [appSettings, setAppSettings] = useState({
        language: 'English',
        voiceSpeed: 1.0,
        notifications: true,
        marketAlerts: true
    });

    useEffect(() => {
        const init = async () => {
            try {
                const [profRes, mandiRes] = await Promise.all([
                    authService.getProfile(),
                    mandiService.getSummary()
                ]);
                if (profRes.data) {
                    setProfile({
                        ...profRes.data,
                        sowing_date: profRes.data.sowing_date ? profRes.data.sowing_date.split('T')[0] : ''
                    });
                }
                setMandiData(mandiRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleSave = async (e) => {
        if(e) e.preventDefault();
        setSaving(true);
        try {
            // Clean numeric fields: convert empty strings to null to avoid 422 errors
            const cleanedProfile = { ...profile };
            ['latitude', 'longitude', 'farm_size'].forEach(field => {
                if (cleanedProfile[field] === '') cleanedProfile[field] = null;
                else cleanedProfile[field] = parseFloat(cleanedProfile[field]);
            });

            await authService.updateProfile(cleanedProfile);
            setSyncStatus({ type: 'success', text: 'Farmer Profile Synchronized!' });
        } catch (err) {
            console.error(err);
            setSyncStatus({ type: 'error', text: 'Synchronization Failed.' });
        } finally {
            setSaving(false);
            setTimeout(() => setSyncStatus({ type: '', text: '' }), 3000);
        }
    };

    const calculateSeasonProgress = () => {
        if (!profile.sowing_date) return 0;
        const diffDays = Math.floor((new Date() - new Date(profile.sowing_date)) / (1000 * 60 * 60 * 24));
        return Math.min(Math.max(Math.floor((diffDays / 120) * 100), 0), 100);
    };

    if (loading) return <div className="loading-screen"><Zap size={48} className="lucide-spin text-secondary" /></div>;

    const soilTypes = [
        { id: 'Alluvial', label: 'Alluvial', desc: 'River Silts', color: '#8d99ae' },
        { id: 'Black', label: 'Black', desc: 'Cotton Soil', color: '#2b2d42' },
        { id: 'Red', label: 'Red', desc: 'Iron Oxides', color: '#ef233c' },
        { id: 'Laterite', label: 'Laterite', desc: 'Porous/Acid', color: '#d90429' }
    ];

    return (
        <div className="account-dashboard">
            <div className="dashboard-nav glass">
                <div className="nav-profile-info">
                    <div className="avatar-glow">
                        <Award size={32} color="var(--accent)" />
                    </div>
                    <div>
                        <h3>{profile.full_name || 'Farmer Account'}</h3>
                        <p className="text-muted">Intelligence Grade: Premium</p>
                    </div>
                </div>
                <div className="nav-menu">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}><Activity size={18} /> Dashboard</button>
                    <button className={activeTab === 'farm' ? 'active' : ''} onClick={() => setActiveTab('farm')}><Sprout size={18} /> Farm Config</button>
                    <button className={activeTab === 'farmer' ? 'active' : ''} onClick={() => setActiveTab('farmer')}><ShieldCheck size={18} /> Farmer Details</button>
                    <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}><Settings size={18} /> Settings</button>
                </div>
            </div>

            <main className="dashboard-main">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <Motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="overview-tab">
                            <div className="stats-row">
                                <div className="stat-card glass flex flex-col items-center justify-center p-8">
                                    <svg viewBox="0 0 36 36" className="circular-chart" style={{ width: '120px' }}>
                                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path className="circle" strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <text x="18" y="20.35" className="percentage">85</text>
                                    </svg>
                                    <h4 className="mt-4 font-bold">Farm Health Index</h4>
                                    <p className="text-muted text-[10px] mt-2">Optimal conditions detected for {profile.primary_crop}.</p>
                                </div>
                                <div className="stat-card glass p-8">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="font-bold text-lg">Season Timeline</h4>
                                        <div className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-bold">{calculateSeasonProgress()}% Completed</div>
                                    </div>
                                    <div className="progress-bar-bg mb-4">
                                        <Motion.div className="progress-bar-fill" initial={{ width: 0 }} animate={{ width: `${calculateSeasonProgress()}%` }} transition={{ duration: 1.5 }} />
                                    </div>
                                    <div className="timeline-labels">
                                        <span className={calculateSeasonProgress() >= 0 ? 'active' : ''}>Sowing</span>
                                        <span className={calculateSeasonProgress() >= 30 ? 'active' : ''}>Growth</span>
                                        <span className={calculateSeasonProgress() >= 60 ? 'active' : ''}>Maturity</span>
                                        <span className={calculateSeasonProgress() >= 100 ? 'active' : ''}>Harvest</span>
                                    </div>
                                </div>
                            </div>
                            <div className="intelligence-row mt-8">
                                <div className="intel-card glass">
                                    <h3 className="flex items-center gap-2 mb-4 font-bold text-lg"><CloudRain size={20} color="var(--info)" /> Regional Intelligence</h3>
                                    <div className="alert-item success">
                                        <strong>Weather Forecast</strong>
                                        <p className="text-xs">Clearing skies expected in {profile.location_name || 'your region'}. Perfect for fertilization.</p>
                                    </div>
                                    <div className="alert-item warn mt-4">
                                        <strong>Mandi Alert</strong>
                                        <p className="text-xs">{profile.primary_crop} prices are fluctuating. Check Market Hub.</p>
                                    </div>
                                </div>
                                <div className="intel-card glass">
                                    <h3 className="flex items-center gap-2 mb-4 font-bold text-lg"><Zap size={20} color="var(--accent)" /> Smart Tasks</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-center gap-3 text-sm"><CheckCircle size={16} className="text-secondary" /> Schedule Weed Control - Next 48h</li>
                                        <li className="flex items-center gap-3 text-sm text-muted"><div className="w-4 h-4 rounded-full border border-white/20" /> Soil pH Testing (Pending)</li>
                                        <li className="flex items-center gap-3 text-sm text-muted"><div className="w-4 h-4 rounded-full border border-white/20" /> Equipment Calibration</li>
                                    </ul>
                                </div>
                            </div>
                            {syncStatus.text && (
                                <Motion.div 
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    className={`fixed bottom-8 right-8 px-6 py-3 rounded-xl glass border ${syncStatus.type === 'success' ? 'border-success/50 text-success' : 'border-danger/50 text-danger'} flex items-center gap-2 z-50`}
                                >
                                    {syncStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />} {syncStatus.text}
                                </Motion.div>
                            )}
                        </Motion.div>
                    )}

                    {activeTab === 'farm' && (
                        <Motion.div key="farm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="dashboard-content">
                            <div className="glass p-8 rounded-3xl border border-white/5">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold">Field Configuration</h2>
                                        <p className="text-muted text-sm italic">Define the physical parameters of your neural farm model.</p>
                                    </div>
                                    <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                                        {saving ? <Activity size={18} className="lucide-spin" /> : <><Save size={18} /> Update Matrix</>}
                                    </button>
                                </div>

                                <div className="farm-form-grid">
                                    <div className="settings-card glass p-6">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted mb-4 block">Spatial Location</label>
                                        <div className="form-group mb-4">
                                            <input type="text" value={profile.location_name || ''} onChange={(e) => setProfile({...profile, location_name: e.target.value})} placeholder="Location Name (e.g. Pune)" className="glass-input w-full" />
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="number" step="any" placeholder="Lat" value={profile.latitude || ''} onChange={(e) => setProfile({...profile, latitude: e.target.value})} className="glass-input flex-1" />
                                            <input type="number" step="any" placeholder="Lng" value={profile.longitude || ''} onChange={(e) => setProfile({...profile, longitude: e.target.value})} className="glass-input flex-1" />
                                        </div>
                                    </div>

                                    <div className="settings-card glass p-6">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted mb-4 block">Neural Soil Profile</label>
                                        <div className="soil-grid">
                                            {soilTypes.map(s => (
                                                <div key={s.id} className={`soil-pill border ${profile.soil_role === s.id ? 'active' : ''}`} onClick={() => setProfile({...profile, soil_role: s.id})}>
                                                    <Thermometer size={16} />
                                                    <div>
                                                        <div className="text-[10px] leading-tight">{s.label}</div>
                                                        <div className="text-[8px] text-muted font-normal">{s.desc}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="settings-card glass p-6">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted mb-4 block">Crop Selection</label>
                                        <select value={profile.primary_crop || 'Rice'} onChange={(e) => setProfile({...profile, primary_crop: e.target.value})} className="glass-input w-full">
                                            <option value="Rice">Rice (Paddy)</option>
                                            <option value="Wheat">Wheat</option>
                                            <option value="Cotton">Cotton</option>
                                            <option value="Sugarcane">Sugarcane</option>
                                            <option value="Soybean">Soybean</option>
                                            <option value="Maize">Maize</option>
                                        </select>
                                    </div>

                                    <div className="settings-card glass p-6">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted mb-4 block">Sowing & Scale</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[10px] text-muted mb-1">Date</div>
                                                <input type="date" value={profile.sowing_date || ''} onChange={(e) => setProfile({...profile, sowing_date: e.target.value})} className="glass-input w-full text-sm" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-muted mb-1">Acres</div>
                                                <input type="number" value={profile.farm_size || ''} onChange={(e) => setProfile({...profile, farm_size: e.target.value})} className="glass-input w-full text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Motion.div>
                    )}

                    {activeTab === 'farmer' && (
                        <Motion.div key="farmer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="dashboard-content">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold">Government-Affiliated Details</h2>
                                    <p className="text-muted text-sm italic">Securely manage your identity and land records for DBT eligibility.</p>
                                </div>
                                <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                                    {saving ? <Activity size={18} className="lucide-spin" /> : <><Save size={18} /> Synchronize IDs</>}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <section className="settings-card glass p-8">
                                    <h4 className="flex items-center gap-2 mb-6 font-bold text-secondary"><ShieldCheck size={20}/> Identity Matrix</h4>
                                    <div className="space-y-6">
                                        <div className="form-group">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Aadhaar Number (UIDAI)</label>
                                            <input type="text" value={profile.aadhaar_number || ''} onChange={(e) => setProfile({...profile, aadhaar_number: e.target.value})} placeholder="XXXX XXXX XXXX" className="glass-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">KCC Account Number</label>
                                            <input type="text" value={profile.kcc_number || ''} onChange={(e) => setProfile({...profile, kcc_number: e.target.value})} placeholder="Kisan Credit Card ID" className="glass-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Mobile for Alerts</label>
                                            <input type="tel" value={profile.phone_number || ''} onChange={(e) => setProfile({...profile, phone_number: e.target.value})} placeholder="+91 XXXXX XXXXX" className="glass-input" />
                                        </div>
                                    </div>
                                </section>

                                <section className="settings-card glass p-8">
                                    <h4 className="flex items-center gap-2 mb-6 font-bold text-secondary"><MapPin size={20}/> Land Records</h4>
                                    <div className="space-y-6">
                                        <div className="form-group">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Registry Survey Number</label>
                                            <input type="text" value={profile.survey_number || ''} onChange={(e) => setProfile({...profile, survey_number: e.target.value})} placeholder="Gat / Survey ID" className="glass-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Khata Number (Account)</label>
                                            <input type="text" value={profile.khata_number || ''} onChange={(e) => setProfile({...profile, khata_number: e.target.value})} placeholder="Official Khata ID" className="glass-input" />
                                        </div>
                                    </div>
                                </section>

                                <section className="settings-card glass p-8 lg:col-span-2">
                                    <h4 className="flex items-center gap-2 mb-6 font-bold text-secondary"><DollarSign size={20}/> Banking Node (for DBT)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="form-group">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Bank Name</label>
                                            <input type="text" value={profile.bank_name || ''} onChange={(e) => setProfile({...profile, bank_name: e.target.value})} placeholder="e.g. State Bank of India" className="glass-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Account Number</label>
                                            <input type="password" value={profile.bank_account_number || ''} onChange={(e) => setProfile({...profile, bank_account_number: e.target.value})} placeholder="••••••••••••" className="glass-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">IFSC Code</label>
                                            <input type="text" value={profile.ifsc_code || ''} onChange={(e) => setProfile({...profile, ifsc_code: e.target.value})} placeholder="SBIN000XXXX" className="glass-input" />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </Motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <Motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="dashboard-content">
                            <h2 className="text-2xl font-bold mb-8">System Preferences</h2>
                            <div className="settings-grid">
                                <div className="settings-group glass p-8 rounded-2xl">
                                    <h4 className="flex items-center gap-2 mb-6 font-bold"><Globe size={18} className="text-secondary"/> Localization</h4>
                                    <div className="form-group mb-6">
                                        <label className="text-xs text-muted block mb-2">Display Language</label>
                                        <select value={appSettings.language} onChange={e => setAppSettings({...appSettings, language: e.target.value})} className="glass-input w-full">
                                            <option>English (Global)</option>
                                            <option>Hindi (Localized)</option>
                                            <option>Marathi (Regional)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs text-muted block mb-2">Voice Assistance Grade</label>
                                        <div className="flex items-center gap-4">
                                            <input type="range" min="0.5" max="2.0" step="0.1" value={appSettings.voiceSpeed} onChange={e => setAppSettings({...appSettings, voiceSpeed: parseFloat(e.target.value)})} className="flex-1 accent-secondary" />
                                            <div className="text-xs font-bold text-secondary">{appSettings.voiceSpeed}x</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-group glass p-8 rounded-2xl">
                                    <h4 className="flex items-center gap-2 mb-6 font-bold"><Bell size={18} className="text-secondary"/> Notification Matrix</h4>
                                    <div className="toggle-item mb-4">
                                        <div>
                                            <div className="text-sm font-bold">Push Notifications</div>
                                            <div className="text-[10px] text-muted">System & Health alerts</div>
                                        </div>
                                        <input type="checkbox" checked={appSettings.notifications} onChange={e => setAppSettings({...appSettings, notifications: e.target.checked})} />
                                    </div>
                                    <div className="toggle-item">
                                        <div>
                                            <div className="text-sm font-bold">Market Volatility Alerts</div>
                                            <div className="text-[10px] text-muted">Mandi price fluctuations</div>
                                        </div>
                                        <input type="checkbox" checked={appSettings.marketAlerts} onChange={e => setAppSettings({...appSettings, marketAlerts: e.target.checked})} />
                                    </div>
                                </div>

                                <div className="settings-group glass p-8 rounded-2xl full-width flex flex-row justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-danger/10 text-danger rounded-xl"><Lock size={24}/></div>
                                        <div>
                                            <h4 className="font-bold">Neural Key Security</h4>
                                            <p className="text-[10px] text-muted">Protect your farm intelligence data.</p>
                                        </div>
                                    </div>
                                    <button className="btn btn-secondary text-xs">Reset Neural Passphrase</button>
                                </div>
                            </div>
                        </Motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default AccountPage;
