import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { motion as Motion } from 'framer-motion';
import { LogIn, AlertCircle, Eye, EyeOff, Mail, Lock, ShieldCheck, Zap, CheckCircle } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authService.login({ email, password });
            localStorage.setItem('token', res.data.access_token);
            navigate('/chat');
        } catch (err) {
            console.log(err);
            setError('Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-branding">
                <div className="branding-illustration">
                    <div className="branding-sun"></div>
                    <svg className="branding-concentric" width="400" height="400" viewBox="0 0 400 400">
                        {[120, 180, 240, 300].map((r, i) => (
                            <circle key={i} cx="200" cy="200" r={r} />
                        ))}
                    </svg>
                    <svg className="branding-wheat" viewBox="0 0 400 200">
                        {[40, 100, 160, 220, 280, 340].map((x, i) => (
                            <path key={i} d={`M${x} 200 Q${x + (i % 2 ? 20 : -20)} 150 ${x} 100 Q${x + (i % 2 ? -15 : 15)} 50 ${x} 20`} />
                        ))}
                    </svg>
                </div>
                <div className="branding-content">
                    <div className="branding-monogram">KM</div>
                    <div className="branding-line"></div>
                    <h1 className="branding-headline">Where Ancient<br />Wisdom Meets<br />Agentic AI</h1>
                    <p className="branding-subtext">
                        Specialized agents for soil, weather, mandi pricing and pest forecasting working in concert.
                    </p>
                    <div className="branding-features">
                        <div className="feature-pill">
                            <CheckCircle size={12} /> RAG Intelligence
                        </div>
                        <div className="feature-pill">
                            <CheckCircle size={12} /> Agentic Reasoning
                        </div>
                        <div className="feature-pill">
                            <CheckCircle size={12} /> Offline Capable
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-form">
                <div className="auth-form-container">
                    <div className="auth-form-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="auth-error">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        
                        <div className="floating-input-group">
                            <input 
                                type="email" 
                                className="floating-input"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder=" "
                                required 
                            />
                            <label className="floating-label">Email</label>
                        </div>

                        <div className="floating-input-group">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="floating-input"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder=" "
                                required 
                            />
                            <label className="floating-label">Password</label>
                            <button 
                                type="button" 
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '52px', marginTop: 'var(--space-md)' }} disabled={loading}>
                            {loading ? <Zap size={18} className="animate-spin" /> : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-divider">or continue with</div>

                    <div className="social-auth-row">
                        <button className="social-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Google
                        </button>
                        <button className="social-btn">
                            <ShieldCheck size={18} />
                            Biometrics
                        </button>
                    </div>

                    <p className="auth-footer">
                        New here? <Link to="/register">Create account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
