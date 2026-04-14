import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Leaf, TrendingUp, ShieldCheck, Zap, ArrowRight, MessageSquare, CloudSun, MapPin, Activity, Award } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page-v2">
            {/* Ultra Premium Hero Section */}
            <section className="hero-section">
                <div className="hero-bg-glow"></div>
                <div className="hero-container">
                    <motion.div 
                        className="hero-text"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <div className="hero-badge glass">
                            <Award size={16} color="var(--accent)" />
                            <span>v2.0 Agentic Intelligence</span>
                        </div>
                        <h1>The Future of <span>Indian Agriculture</span> is Agentic.</h1>
                        <p>Empower your farm with KrishiMitra's hyperlocal intelligence. Specialized agents for soil, weather, and mandi trends, working together to maximize your harvest.</p>
                        
                        <div className="hero-btns">
                            <motion.button 
                                className="btn btn-primary px-10 py-5 text-lg" 
                                onClick={() => navigate('/chat')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Start Consultations <Zap size={22} />
                            </motion.button>
                            <motion.button 
                                className="btn btn-secondary px-10 py-5 text-lg" 
                                onClick={() => navigate('/register')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Create Farmer Account
                            </motion.button>
                        </div>

                        <div className="hero-highlights">
                            <div className="highlight">
                                <h3>98%</h3>
                                <p>Crop Accuracy</p>
                            </div>
                            <div className="highlight-divider"></div>
                            <div className="highlight">
                                <h3>12+</h3>
                                <p>Regional Dialects</p>
                            </div>
                            <div className="highlight-divider"></div>
                            <div className="highlight">
                                <h3>24/7</h3>
                                <p>Agent Availability</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="hero-visual-wrapper"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <div className="main-visual glass">
                            <div className="visual-header">
                                <Activity size={20} color="var(--secondary)" />
                                <span>Real-time Field Audit</span>
                                <div className="pulse-dot"></div>
                            </div>
                            <div className="visual-body">
                                <div className="mandi-peek glass-dark">
                                    <TrendingUp size={16} color="var(--success)" />
                                    <span>Wheat: ₹2,450 (+1.2%)</span>
                                </div>
                                <div className="weather-peek glass-dark">
                                    <CloudSun size={16} color="var(--warning)" />
                                    <span>32°C | 65% Humidity</span>
                                </div>
                                <div className="sprout-animation">
                                    <SproutIcon />
                                </div>
                            </div>
                        </div>
                        {/* Floating Cards */}
                        <motion.div 
                            className="floating-card-ui glass top-right"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            <ShieldCheck size={20} color="var(--secondary)" />
                            <p>Soil Nitrogen: Optimal</p>
                        </motion.div>
                        <motion.div 
                            className="floating-card-ui glass bottom-left"
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity }}
                        >
                            <MapPin size={20} color="var(--accent)" />
                            <p>Village: Pune South</p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Feature Innovation Section */}
            <section className="innovation-section">
                <div className="section-header">
                    <h2>Engineered for <span>Excellence</span></h2>
                    <p>Moving beyond basic chatbots to full-stack agricultural reasoning.</p>
                </div>
                <div className="innovation-grid">
                    <div className="innov-card glass">
                        <div className="innov-icon"><MessageSquare /></div>
                        <h3>ChatGPT-Style Chat</h3>
                        <p>Streamlined conversations with history, markdown tables, and voice support.</p>
                    </div>
                    <div className="innov-card glass">
                        <div className="innov-icon"><Zap /></div>
                        <h3>Agent Orchestration</h3>
                        <p>Specialized agents consult weather, soil, and mandi data simultaneously.</p>
                    </div>
                    <div className="innov-card glass">
                        <div className="innov-icon"><Activity /></div>
                        <h3>Advanced Dashboard</h3>
                        <p>Track your farm health score and crop lifecycle in real-time.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

const SproutIcon = () => (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5 5" />
        <path d="M50 80V40M50 40C50 40 70 30 70 10M50 40C50 40 30 30 30 10" stroke="var(--secondary)" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

export default LandingPage;
