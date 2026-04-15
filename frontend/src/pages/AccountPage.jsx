import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
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
                const profRes = await authService.getProfile();
                if (profRes.data) {
                    setProfile({
                        ...profRes.data,
                        sowing_date: profRes.data.sowing_date ? profRes.data.sowing_date.split('T')[0] : ''
                    });
                }
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

    const soilTypes = [
        { id: 'Alluvial', label: 'Alluvial', desc: 'River Silts', color: 'linear-gradient(135deg, #8B7355, #C4A97D)' },
        { id: 'Black', label: 'Black', desc: 'Cotton Soil', color: 'linear-gradient(135deg, #2C2417, #4A3728)' },
        { id: 'Red', label: 'Red', desc: 'Iron Oxides', color: 'linear-gradient(135deg, #8B3A2A, #C45A3A)' },
        { id: 'Laterite', label: 'Laterite', desc: 'Porous/Acid', color: 'linear-gradient(135deg, #C17A3A, #8B5E2A)' }
    ];

    return (
        <div className="account-dashboard">
            <aside className="account-sidebar">
                <div className="sidebar-profile">
                    <div className="profile-avatar-large">
                        {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'F'}
                    </div>
                    <div className="profile-name">{profile.full_name || 'Farmer Account'}</div>
                    <div className="profile-badge">Premium Account</div>
                </div>
                
                <div className="sidebar-nav">
                    <button 
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <Activity size={18} /> Dashboard
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'farm' ? 'active' : ''}`}
                        onClick={() => setActiveTab('farm')}
                    >
                        <Sprout size={18} /> Farm Config
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'farmer' ? 'active' : ''}`}
                        onClick={() => setActiveTab('farmer')}
                    >
                        <ShieldCheck size={18} /> Farmer Details
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={18} /> Settings
                    </button>
                </div>
            </aside>

            <main className="account-main">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <Motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="stats-row">
                                <div className="farm-health-card">
                                    <div className="circular-progress">
                                        <svg viewBox="0 0 36 36">
                                            <path className="bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            <Motion.path 
                                                className="progress"
                                                initial={{ strokeDashoffset: 440 }}
                                                animate={{ strokeDashoffset: 66 }}
                                                transition={{ duration: 1.5, ease: 'easeOut' }}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                            />
                                        </svg>
                                        <div className="progress-value">
                                            <span className="number">85</span>
                                            <span className="label">/100</span>
                                        </div>
                                    </div>
                                    <div className="health-recommendation">Optimal for {profile.primary_crop || 'Wheat'} cultivation</div>
                                </div>
                                
                                <div className="season-card">
                                    <div className="season-header">
                                        <span className="season-title">Season Progress</span>
                                        <span className="season-progress-pill">{calculateSeasonProgress()}%</span>
                                    </div>
                                    <div className="season-progress-track">
                                        <Motion.div 
                                            className="season-progress-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${calculateSeasonProgress()}%` }}
                                            transition={{ duration: 1.5, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <div className="timeline-labels">
                                        <span className={calculateSeasonProgress() >= 0 ? 'active' : ''}>Sowing</span>
                                        <span className={calculateSeasonProgress() >= 30 ? 'active' : ''}>Growth</span>
                                        <span className={calculateSeasonProgress() >= 60 ? 'active' : ''}>Maturity</span>
                                        <span className={calculateSeasonProgress() >= 90 ? 'active' : ''}>Harvest</span>
                                    </div>
                                    {profile.sowing_date && (
                                        <div className="crop-age">
                                            {Math.floor((new Date() - new Date(profile.sowing_date)) / (1000 * 60 * 60 * 24))} days since sowing
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="intelligence-row">
                                <div className="intel-card">
                                    <h3><CloudRain size={18} style={{ color: 'var(--info)' }} /> Regional Intelligence</h3>
                                    <div className="alert-item success">
                                        <strong>Weather Forecast</strong>
                                        <p>Clearing skies expected in {profile.location_name || 'your region'}. Perfect for fertilization.</p>
                                    </div>
                                    <div className="alert-item warn mt-md">
                                        <strong>Mandi Alert</strong>
                                        <p>{profile.primary_crop} prices are fluctuating. Check Market Hub.</p>
                                    </div>
                                </div>
                                <div className="intel-card">
                                    <h3><Zap size={18} style={{ color: 'var(--gold)' }} /> Smart Tasks</h3>
                                    <ul className="task-list">
                                        <li className="task-item completed">
                                            <CheckCircle size={16} /> Schedule Weed Control - Next 48h
                                        </li>
                                        <li className="task-item">
                                            <div className="task-checkbox" /> Soil pH Testing (Pending)
                                        </li>
                                        <li className="task-item">
                                            <div className="task-checkbox" /> Equipment Calibration
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {syncStatus.text && (
                                <Motion.div 
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    style={{
                                        position: 'fixed',
                                        bottom: 'var(--space-xl)',
                                        right: 'var(--space-xl)',
                                        padding: 'var(--space-md) var(--space-lg)',
                                        background: 'var(--bg-raised)',
                                        border: `1px solid ${syncStatus.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)',
                                        color: syncStatus.type === 'success' ? 'var(--success)' : 'var(--danger)',
                                        zIndex: 50
                                    }}
                                >
                                    {syncStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />} 
                                    {syncStatus.text}
                                </Motion.div>
                            )}
                        </Motion.div>
                    )}

                    {activeTab === 'farm' && (
                        <Motion.div key="farm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="farm-form-grid">
                                <div className="farm-form-card">
                                    <div className="form-card-title">Spatial Location</div>
                                    <div className="form-group mb-md">
                                        <input 
                                            type="text" 
                                            className="input"
                                            value={profile.location_name || ''} 
                                            onChange={(e) => setProfile({...profile, location_name: e.target.value})} 
                                            placeholder="Location Name (e.g. Pune)" 
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                        <input 
                                            type="number" 
                                            step="any" 
                                            placeholder="Lat" 
                                            className="input"
                                            value={profile.latitude || ''} 
                                            onChange={(e) => setProfile({...profile, latitude: e.target.value})} 
                                        />
                                        <input 
                                            type="number" 
                                            step="any" 
                                            placeholder="Lng" 
                                            className="input"
                                            value={profile.longitude || ''} 
                                            onChange={(e) => setProfile({...profile, longitude: e.target.value})} 
                                        />
                                    </div>
                                </div>

                                <div className="farm-form-card">
                                    <div className="form-card-title">Neural Soil Profile</div>
                                    <div className="soil-grid">
                                        {soilTypes.map(s => (
                                            <div 
                                                key={s.id} 
                                                className={`soil-card ${profile.soil_role === s.id ? 'selected' : ''}`}
                                                onClick={() => setProfile({...profile, soil_role: s.id})}
                                            >
                                                <div className="soil-swatch" style={{ background: s.color }}></div>
                                                <div className="soil-info">
                                                    <div className="soil-name">{s.label}</div>
                                                    <div className="soil-desc">{s.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="farm-form-card">
                                    <div className="form-card-title">Crop Selection</div>
                                    <select 
                                        className="input"
                                        value={profile.primary_crop || 'Rice'} 
                                        onChange={(e) => setProfile({...profile, primary_crop: e.target.value})}
                                    >
                                        <option value="Rice">Rice (Paddy)</option>
                                        <option value="Wheat">Wheat</option>
                                        <option value="Cotton">Cotton</option>
                                        <option value="Sugarcane">Sugarcane</option>
                                        <option value="Soybean">Soybean</option>
                                        <option value="Maize">Maize</option>
                                    </select>
                                </div>

                                <div className="farm-form-card">
                                    <div className="form-card-title">Sowing & Scale</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                        <div>
                                            <label className="label mb-xs block">Date</label>
                                            <input 
                                                type="date" 
                                                className="input"
                                                value={profile.sowing_date || ''} 
                                                onChange={(e) => setProfile({...profile, sowing_date: e.target.value})} 
                                            />
                                        </div>
                                        <div>
                                            <label className="label mb-xs block">Acres</label>
                                            <input 
                                                type="number" 
                                                className="input"
                                                value={profile.farm_size || ''} 
                                                onChange={(e) => setProfile({...profile, farm_size: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: 'var(--space-xl)' }} disabled={saving}>
                                {saving ? <Activity size={18} className="animate-spin" /> : <><Save size={18} /> Update Profile</>}
                            </button>
                        </Motion.div>
                    )}

                    {activeTab === 'farmer' && (
                        <Motion.div key="farmer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="section-divider">
                                <div className="section-divider-line"></div>
                                <div className="section-divider-title">Government-Affiliated Details</div>
                                <div className="section-divider-line"></div>
                            </div>

                            <div className="farm-form-grid">
                                <div className="farm-form-card">
                                    <div className="form-card-title"><ShieldCheck size={14} className="inline mr-1" /> Identity Matrix</div>
                                    <div className="form-group mb-md">
                                        <label className="label mb-xs block">Aadhaar Number (UIDAI)</label>
                                        <div className="sensitive-field">
                                            <input 
                                                type="text" 
                                                className="input"
                                                value={profile.aadhaar_number || ''} 
                                                onChange={(e) => setProfile({...profile, aadhaar_number: e.target.value})} 
                                                placeholder="XXXX XXXX XXXX" 
                                            />
                                            <Lock size={14} className="lock-icon" />
                                        </div>
                                    </div>
                                    <div className="form-group mb-md">
                                        <label className="label mb-xs block">KCC Account Number</label>
                                        <input 
                                            type="text" 
                                            className="input"
                                            value={profile.kcc_number || ''} 
                                            onChange={(e) => setProfile({...profile, kcc_number: e.target.value})} 
                                            placeholder="Kisan Credit Card ID" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label mb-xs block">Mobile for Alerts</label>
                                        <input 
                                            type="tel" 
                                            className="input"
                                            value={profile.phone_number || ''} 
                                            onChange={(e) => setProfile({...profile, phone_number: e.target.value})} 
                                            placeholder="+91 XXXXX XXXXX" 
                                        />
                                    </div>
                                </div>

                                <div className="farm-form-card">
                                    <div className="form-card-title"><MapPin size={14} className="inline mr-1" /> Land Records</div>
                                    <div className="form-group mb-md">
                                        <label className="label mb-xs block">Registry Survey Number</label>
                                        <input 
                                            type="text" 
                                            className="input"
                                            value={profile.survey_number || ''} 
                                            onChange={(e) => setProfile({...profile, survey_number: e.target.value})} 
                                            placeholder="Gat / Survey ID" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label mb-xs block">Khata Number (Account)</label>
                                        <input 
                                            type="text" 
                                            className="input"
                                            value={profile.khata_number || ''} 
                                            onChange={(e) => setProfile({...profile, khata_number: e.target.value})} 
                                            placeholder="Official Khata ID" 
                                        />
                                    </div>
                                </div>

                                <div className="farm-form-card settings-card-full">
                                    <div className="form-card-title"><DollarSign size={14} className="inline mr-1" /> Banking Node (for DBT)</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                                        <div className="form-group">
                                            <label className="label mb-xs block">Bank Name</label>
                                            <input 
                                                type="text" 
                                                className="input"
                                                value={profile.bank_name || ''} 
                                                onChange={(e) => setProfile({...profile, bank_name: e.target.value})} 
                                                placeholder="e.g. State Bank of India" 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="label mb-xs block">Account Number</label>
                                            <input 
                                                type="password" 
                                                className="input"
                                                value={profile.bank_account_number || ''} 
                                                onChange={(e) => setProfile({...profile, bank_account_number: e.target.value})} 
                                                placeholder="••••••••••••" 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="label mb-xs block">IFSC Code</label>
                                            <input 
                                                type="text" 
                                                className="input"
                                                value={profile.ifsc_code || ''} 
                                                onChange={(e) => setProfile({...profile, ifsc_code: e.target.value})} 
                                                placeholder="SBIN000XXXX" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: 'var(--space-xl)' }} disabled={saving}>
                                {saving ? <Activity size={18} className="animate-spin" /> : <><Save size={18} /> Synchronize IDs</>}
                            </button>
                        </Motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <Motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h2 style={{ fontFamily: 'var(--text-h2)', marginBottom: 'var(--space-xl)' }}>System Preferences</h2>
                            
                            <div className="settings-grid">
                                <div className="settings-group">
                                    <h4 className="form-card-title"><Globe size={14} className="inline mr-1" /> Localization</h4>
                                    <div className="form-group mb-md">
                                        <label className="label mb-xs block">Display Language</label>
                                        <select 
                                            className="input"
                                            value={appSettings.language} 
                                            onChange={e => setAppSettings({...appSettings, language: e.target.value})}
                                        >
                                            <option>English (Global)</option>
                                            <option>Hindi (Localized)</option>
                                            <option>Marathi (Regional)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label mb-xs block">Voice Assistance Grade</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                            <input 
                                                type="range" 
                                                min="0.5" 
                                                max="2.0" 
                                                step="0.1" 
                                                value={appSettings.voiceSpeed} 
                                                onChange={e => setAppSettings({...appSettings, voiceSpeed: parseFloat(e.target.value)})} 
                                                className="slider-track"
                                                style={{ flex: 1 }}
                                            />
                                            <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--gold)' }}>{appSettings.voiceSpeed}x</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-group">
                                    <h4 className="form-card-title"><Bell size={14} className="inline mr-1" /> Notification Matrix</h4>
                                    <div className="toggle-item">
                                        <div>
                                            <div className="toggle-label">Push Notifications</div>
                                            <div className="toggle-desc">System & Health alerts</div>
                                        </div>
                                        <div 
                                            className={`toggle-switch ${appSettings.notifications ? 'active' : ''}`}
                                            onClick={() => setAppSettings({...appSettings, notifications: !appSettings.notifications})}
                                        />
                                    </div>
                                    <div className="toggle-item">
                                        <div>
                                            <div className="toggle-label">Market Volatility Alerts</div>
                                            <div className="toggle-desc">Mandi price fluctuations</div>
                                        </div>
                                        <div 
                                            className={`toggle-switch ${appSettings.marketAlerts ? 'active' : ''}`}
                                            onClick={() => setAppSettings({...appSettings, marketAlerts: !appSettings.marketAlerts})}
                                        />
                                    </div>
                                </div>

                                <div className="settings-group settings-card-full" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(224,82,82,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                                            <Lock size={24} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>Neural Key Security</h4>
                                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Protect your farm intelligence data.</p>
                                        </div>
                                    </div>
                                    <button className="btn btn-secondary">Reset Passphrase</button>
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
