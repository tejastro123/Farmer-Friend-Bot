import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { motion as Motion } from 'framer-motion';
import { Leaf, LogIn, AlertCircle, Eye, EyeOff, Mail, Lock, ShieldCheck, Zap } from 'lucide-react';

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
            setError('Authentication failed. Please check your neural credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="branding-side">
                <div className="branding-visual-bg"></div>
                <div className="branding-content">
                    <div className="brand-badge"><ShieldCheck size={14}/> Research Grade Intelligence</div>
                    <h1>Empowering the<br />Next Green Revolution</h1>
                    <p>Access the world's most advanced agricultural agent orchestration platform. Real-time reasoning for complex farming decisions.</p>
                </div>
            </div>

            <div className="auth-form-side">
                <Motion.div 
                    className="auth-card-modern glass"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <div className="auth-header mb-10">
                        <div className="p-3 bg-secondary/10 rounded-2xl w-fit mb-6">
                            <Leaf size={32} color="var(--secondary)" />
                        </div>
                        <h2 className="text-3xl font-black">Welcome Back</h2>
                        <p className="text-muted text-sm mt-2">Sign in to your intelligent farm matrix</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted block">Security Key</label>
                                <Link to="#" className="text-[10px] text-secondary font-bold hover:underline">Forgot Key?</Link>
                            </div>
                            <div className="input-with-icon">
                                <Lock className="input-icon" size={18} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    className="glass-input"
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder="••••••••"
                                    required 
                                />
                                <button 
                                    type="button" 
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 py-2">
                            <input type="checkbox" id="remember" className="accent-secondary" />
                            <label htmlFor="remember" className="text-xs text-muted cursor-pointer">Remember this terminal session</label>
                        </div>

                        <button type="submit" className="btn btn-primary w-full py-4 flex items-center justify-center gap-2" disabled={loading}>
                            {loading ? <Zap size={18} className="lucide-spin" /> : <><LogIn size={18} /> Initialize Access</>}
                        </button>
                    </form>

                    <div className="auth-divider">Or continue with</div>

                    <div className="social-auth-ui">
                        <button className="social-btn">
                            <img src="https://www.svgrepo.com/show/355037/google.svg" width="18" alt="Google" /> Google
                        </button>
                        <button className="social-btn">
                            <ShieldCheck size={18} className="text-secondary" /> Biometrics
                        </button>
                    </div>

                    <p className="text-center mt-10 text-sm text-muted">
                        New to KrishiMitra? <Link to="/register" className="text-secondary font-bold hover:underline">Register Identity</Link>
                    </p>
                </Motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
