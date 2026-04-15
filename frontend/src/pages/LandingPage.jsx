import React, { useEffect, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, MessageSquare, ShoppingBag, TrendingUp, Bug,
  Droplets, Shield, Network, WifiOff, Play, Star, MapPin,
  Wheat, Sprout, Leaf, CloudSun, CheckCircle, Eye, BarChart3, Zap
} from 'lucide-react';
import './LandingPage.css';

// Wheat grain SVG for branding
const WheatGrainIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v20M12 6c-2-2-4-1-4 2s2 4 4 4M12 6c2-2 4-1 4 2s-2 4-4 4" />
    <path d="M12 12c-3-2-5-1-5 3s3 5 5 5M12 12c3-2 5-1 5 3s-3 5-5 5" />
  </svg>
);

// Simple line chart SVG
const LineChart = () => (
  <svg width="100%" height="120" viewBox="0 0 300 80" className="sparkline-chart">
    <polyline
      points="0,60 40,55 80,45 120,50 160,35 200,40 240,25 280,30"
      fill="none"
      stroke="var(--gold)"
      strokeWidth="2"
    />
    <defs>
      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.3" />
        <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
      </linearGradient>
    </defs>
    <polyline
      points="0,60 40,55 80,45 120,50 160,35 200,40 240,25 280,30 280,80 0,80"
      fill="url(#chartGradient)"
      opacity="0.5"
    />
  </svg>
);

// Node graph SVG for Knowledge Graph card
const NodeGraph = () => (
  <svg width="100%" height="200" viewBox="0 0 400 200" className="node-graph">
    {/* Connections */}
    <line x1="200" y1="100" x2="100" y2="50" stroke="rgba(245,240,232,0.15)" strokeWidth="1" />
    <line x1="200" y1="100" x2="300" y2="50" stroke="rgba(245,240,232,0.15)" strokeWidth="1" />
    <line x1="200" y1="100" x2="100" y2="150" stroke="rgba(245,240,232,0.15)" strokeWidth="1" />
    <line x1="200" y1="100" x2="300" y2="150" stroke="rgba(245,240,232,0.15)" strokeWidth="1" />
    <line x1="100" y1="50" x2="200" y2="30" stroke="rgba(245,240,232,0.15)" strokeWidth="1" />
    <line x1="300" y1="50" x2="200" y2="30" stroke="rgba(245,240,232,0.15)" strokeWidth="1" />

    {/* Nodes */}
    <circle cx="200" cy="100" r="12" fill="var(--gold)" className="node-active" />
    <circle cx="100" cy="50" r="8" fill="var(--bg-surface)" stroke="var(--sage)" strokeWidth="1.5" />
    <circle cx="300" cy="50" r="8" fill="var(--bg-surface)" stroke="var(--sage)" strokeWidth="1.5" />
    <circle cx="100" cy="150" r="8" fill="var(--bg-surface)" stroke="var(--gold)" strokeWidth="1.5" />
    <circle cx="300" cy="150" r="8" fill="var(--bg-surface)" stroke="var(--gold)" strokeWidth="1.5" />
    <circle cx="200" cy="30" r="8" fill="var(--bg-surface)" stroke="var(--gold)" strokeWidth="1.5" />
  </svg>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeDot, setActiveDot] = useState(0);

  // Scroll spy for dot navigation
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const sectionHeight = window.innerHeight;
      const index = Math.round(scrollY / sectionHeight);
      setActiveDot(Math.min(index, 3));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const testimonials = [
    { quote: "KrishiMitra increased my cotton yield by 34%. The pest alerts saved my entire harvest.", name: "Ramesh Patil", role: "Cotton Farmer, Vidarbha", initials: "RP" },
    { quote: "Finally, an app that understands our soil and speaks our language. The mandi prices are always accurate.", name: "Sunita Devi", role: "Wheat Farmer, Uttar Pradesh", initials: "SD" },
    { quote: "The weather predictions are more reliable than the government forecast. I plan my irrigation perfectly now.", name: "Arjun Reddy", role: "Rice Farmer, Telangana", initials: "AR" },
    { quote: "Offline mode is a lifesaver. Works even when there's no signal in the fields.", name: "Priya Sharma", role: "Vegetable Grower, Madhya Pradesh", initials: "PS" },
    { quote: "Government scheme guidance helped me get a subsidy I didn't even know existed.", name: "Vikram Singh", role: "Dairy Farmer, Rajasthan", initials: "VS" },
  ];

  return (
    <div className="landing-scroll-container">
      {/* Dot Navigation */}
      <div className="dot-nav">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            className={`dot ${i === activeDot ? 'active' : ''}`}
            onClick={() => window.scrollTo({ top: i * window.innerHeight, behavior: 'smooth' })}
          />
        ))}
      </div>

      {/* SECTION 1 — Hero */}
      <section className="hero-section-v2" id="hero">
        <div className="hero-bg-gradient" />
        <div className="hero-grain-overlay" />

        <div className="hero-grid">
          <Motion.div
            className="hero-content"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="hero-overline label">
              Agricultural Intelligence Platform
            </span>

            <h1 className="hero-title">
              Where Ancient<br />
              Wisdom Meets<br />
              <span className="text-gradient-gold italic">Agentic AI</span>
            </h1>

            <p className="hero-subtext">
              Specialized agents for soil, weather, mandi pricing and pest forecasting
              working in concert — built for the 100 million farmers of India.
            </p>

            <div className="hero-cta-row">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/chat')}>
                Start Your Consultation <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/register')}>
                <Play size={16} fill="currentColor" /> Watch Demo
              </button>
            </div>

            <div className="hero-trust-row">
              <span className="trust-label">Trusted by farmers across 12 states</span>
              <div className="trust-avatars">
                <div className="avatar">RP</div>
                <div className="avatar">SD</div>
                <div className="avatar">AR</div>
              </div>
              <div className="trust-rating">
                <Star size={14} fill="var(--gold)" className="star-filled" />
                <span>4.9 / 5.0</span>
              </div>
            </div>
          </Motion.div>

          <Motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="dashboard-card surface-raised motion-float">
              <div className="dashboard-header">
                <div className="header-left">
                  <span className="pulse-dot" />
                  <span>Field Report — Live</span>
                </div>
              </div>

              <div className="dashboard-body">
                <div className="metric-row">
                  <span className="metric-label">Wheat MSP</span>
                  <span className="metric-value stat-number">₹2,450 <span className="metric-trend success">/ Q</span></span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Soil Health</span>
                  <div className="metric-with-bar">
                    <span className="metric-value stat-number sm">87/100</span>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: '87%' }} />
                    </div>
                  </div>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Pest Risk</span>
                  <span className="metric-value text-sage">LOW</span>
                </div>

                <div className="chart-area">
                  <LineChart />
                </div>
              </div>
            </div>

            {/* Floating chips */}
            <Motion.div
              className="floating-chip chip-top"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <CloudSun size={14} />
              <span>32°C — Nashik</span>
            </Motion.div>

            <Motion.div
              className="floating-chip chip-bottom"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
            >
              <Zap size={14} />
              <span>AI Agent Active</span>
            </Motion.div>
          </Motion.div>
        </div>
      </section>

      {/* SECTION 2 — Features Bento Grid */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2 className="section-title">Everything your farm needs</h2>
          <p className="section-subtitle">One platform. Eight intelligent agents.</p>
        </div>

        <div className="bento-grid">
          <Motion.div
            className="bento-card bento-large"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02, borderColor: 'var(--gold-border)' }}
          >
            <div className="bento-header">
              <MessageSquare size={20} className="bento-icon" />
              <h3>RAG-Powered Chat</h3>
            </div>
            <div className="bento-chat-preview">
              <div className="chat-bubble user">What should I plant this season?</div>
              <div className="chat-bubble agent">Based on your soil (loamy, pH 6.8) and forecast...</div>
            </div>
          </Motion.div>

          <Motion.div
            className="bento-card"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            whileHover={{ scale: 1.02, borderColor: 'var(--gold-border)' }}
          >
            <div className="bento-header">
              <ShoppingBag size={18} />
              <h4>Live Mandi Prices</h4>
            </div>
            <div className="mandi-preview">
              <TrendingUp size={24} className="trend-icon" />
              <div className="mandi-sparkline">
                {[40, 55, 45, 60, 50, 65].map((h, i) => (
                  <div key={i} className="spark-bar" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </Motion.div>

          <Motion.div
            className="bento-card"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16 }}
            whileHover={{ scale: 1.02, borderColor: 'var(--gold-border)' }}
          >
            <div className="bento-header">
              <TrendingUp size={18} />
              <h4>Yield Prediction</h4>
            </div>
            <div className="yield-preview">
              <span className="yield-number stat-number lg">12.4 MT</span>
              <span className="yield-label">Predicted Harvest</span>
            </div>
          </Motion.div>

          <Motion.div
            className="bento-card"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.24 }}
            whileHover={{ scale: 1.02, borderColor: 'var(--gold-border)' }}
          >
            <div className="bento-header">
              <Bug size={18} />
              <h4>Pest Forecasting</h4>
            </div>
            <div className="pest-preview">
              <div className="gauge-ring">
                <div className="gauge-fill low" />
              </div>
              <span className="pest-badge badge badge-sage">LOW RISK</span>
            </div>
          </Motion.div>

          <Motion.div
            className="bento-card bento-wide"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.32 }}
            whileHover={{ scale: 1.02, borderColor: 'var(--gold-border)' }}
          >
            <div className="bento-header">
              <Network size={18} />
              <h3>Knowledge Graph</h3>
            </div>
            <NodeGraph />
          </Motion.div>

          <Motion.div
            className="bento-card bento-tall"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.02, borderColor: 'var(--gold-border)' }}
          >
            <div className="bento-header">
              <WifiOff size={18} />
              <h3>Offline Edge AI</h3>
            </div>
            <div className="offline-content">
              <div className="no-signal-icon">
                <WifiOff size={32} />
              </div>
              <p>Still works without internet</p>
              <span className="offline-badge badge badge-gold">Syncs when online</span>
            </div>
          </Motion.div>
        </div>
      </section>

      {/* SECTION 3 — Social Proof */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-header">
          <h2 className="section-title italic">Farmers are seeing results</h2>
        </div>

        <div className="marquee-container">
          <div className="marquee-row">
            <div className="marquee-track">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="testimonial-card surface">
                  <div className="testimonial-stars">★★★★★</div>
                  <p className="testimonial-quote">{t.quote}</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">{t.initials}</div>
                    <div className="author-info">
                      <span className="author-name">{t.name}</span>
                      <span className="author-role">{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="marquee-row marquee-reverse">
            <div className="marquee-track">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="testimonial-card surface">
                  <div className="testimonial-stars">★★★★★</div>
                  <p className="testimonial-quote">{t.quote}</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">{t.initials}</div>
                    <div className="author-info">
                      <span className="author-name">{t.name}</span>
                      <span className="author-role">{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — CTA */}
      <section className="cta-section" id="cta">
        <div className="cta-bg-pattern" />

        <div className="cta-content">
          <h2 className="cta-title">
            Your farm's intelligence upgrade begins here.
          </h2>

          <div className="cta-form">
            <input
              type="text"
              placeholder="Enter your phone/email"
              className="input cta-input"
            />
            <button className="btn btn-primary btn-lg">
              Get Early Access
            </button>
          </div>
        </div>

        {/* Wheat field silhouette background */}
        <svg className="wheat-silhouette" viewBox="0 0 1200 400" preserveAspectRatio="none">
          {[...Array(20)].map((_, i) => (
            <path
              key={i}
              d={`M${60 + i * 60} 400 L${50 + i * 60} 280 Q${60 + i * 60} 200 ${70 + i * 60} 280 L${80 + i * 60} 400 Z`}
              fill="rgba(200,145,43,0.06)"
            />
          ))}
        </svg>
      </section>
    </div>
  );
};

export default LandingPage;
