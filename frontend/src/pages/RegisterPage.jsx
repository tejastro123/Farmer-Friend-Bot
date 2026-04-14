import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { motion as Motion } from 'framer-motion';
import { Leaf, UserPlus, AlertCircle, Mail, Lock, User, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!acceptedTerms) {
            setError('Please accept the Intelligence Protocol terms.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await authService.register({ email, password, full_name: fullName });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Neural link rejected.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="branding-side">
                <div className="branding-visual-bg"></div>
                <div className="branding-content">
                    <div className="brand-badge"><Zap size={14}/> Agricultural Force Multiplier</div>
                    <h1>Join the Elite<br />Farmer Collective</h1>
                    <p>Register your identity to access localized climate intelligence, market analytics, and autonomous field orchestration.</p>
                </div>
            </div>

            <div className="auth-form-side">
                <Motion.div 
                    className="auth-card-modern glass"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <div className="auth-header mb-8">
                        <div className="p-3 bg-secondary/10 rounded-2xl w-fit mb-6">
                            <Leaf size={32} color="var(--secondary)" />
                        </div>
                        <h2 className="text-3xl font-black">Register Identity</h2>
                        <p className="text-muted text-sm mt-2">Initialize your KrishiMitra neural profile</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <Motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="error-msg"
                            >
                                <AlertCircle size={16} /> {error}
                            </Motion.div>
                        )}
                        
                        <div className="form-group">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Full Legal Name</label>
                            <div className="input-with-icon">
                                <User className="input-icon" size={18} />
                                <input 
                                    type="text" 
                                    className="glass-input"
                                    value={fullName} 
                                    onChange={(e) => setFullName(e.target.value)} 
                                    placeholder="John Doe"
                                    required 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Email Identity</label>
                            <div className="input-with-icon">
                                <Mail className="input-icon" size={18} />
                                <input 
                                    type="email" 
                                    className="glass-input"
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    placeholder="farmer@krisimitra.ai"
                                    required 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Security Passphrase</label>
                            <div className="input-with-icon">
                                <Lock className="input-icon" size={18} />
                                <input 
                                    type="password" 
                                    className="glass-input"
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder="••••••••"
                                    required 
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 py-2">
                            <input 
                                type="checkbox" 
                                id="terms" 
                                className="accent-secondary mt-1" 
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                            />
                            <label htmlFor="terms" className="text-[10px] text-muted cursor-pointer leading-relaxed">
                                I verify that I am an agricultural professional and agree to the 
                                <Link to="#" className="text-secondary font-bold px-1">Neural Integration Protocol</Link> 
                                and data sharing standards.
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary w-full py-4 flex items-center justify-center gap-2" disabled={loading}>
                            {loading ? <Zap size={18} className="lucide-spin" /> : <><UserPlus size={18} /> Create Profile</>}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-sm text-muted">
                        Already in the collective? <Link to="/login" className="text-secondary font-bold hover:underline">Sync Identity</Link>
                    </p>
                </Motion.div>
            </div>
        </div>
    );
};

export default RegisterPage;
