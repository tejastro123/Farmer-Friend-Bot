import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, Upload, MessageSquare, User, Home, LogIn, LogOut,
  ShoppingBag, TrendingUp, Bug, Droplets, Shield, Network, Database,
  ChevronDown, Menu, X, Globe, Sparkles
} from 'lucide-react';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import UploadPage from './pages/UploadPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import MarketPage from './pages/MarketPage';
import TradeConfirmPage from './pages/TradeConfirmPage';
import PaymentPage from './pages/PaymentPage';
import BillPage from './pages/BillPage';
import YieldPage from './pages/YieldPage';
import PestForecastPage from './pages/PestForecastPage';
import IrrigationOptimizerPage from './pages/IrrigationOptimizerPage';
import MoatDashboardPage from './pages/MoatDashboardPage';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import DataCenterPage from './pages/DataCenterPage';
import FarmDashboardPage from './pages/FarmDashboardPage';
import CropHealthPage from './pages/CropHealthPage';
import SatelliteImageryPage from './pages/SatelliteImageryPage';
import './index.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// KrishiMitra logo SVG
const KrishiMitraLogo = ({ size = 36, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="wheatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c8912b"/>
        <stop offset="100%" stopColor="#4a7c4a"/>
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="#1a2e1a"/>
    <circle cx="32" cy="32" r="28" fill="none" stroke="url(#wheatGrad)" strokeWidth="1.5"/>
    <g stroke="#c8912b" strokeWidth="2.5" strokeLinecap="round" fill="none">
      <path d="M22 52V26c0-3 2-5 5-5s5 2 5 5v21"/>
      <path d="M22 30c-2-4-5-6-5-9s3-5 5-5"/>
      <path d="M22 30c2-4 5-6 5-9s-3-5-5-5"/>
      <path d="M22 38c-2.5-4-6-6-6-10s3.5-6 6-6"/>
      <path d="M22 38c2.5-4 6-6 6-10s-3.5-6-6-6"/>
    </g>
    <g stroke="#4a7c4a" strokeWidth="2.5" strokeLinecap="round" fill="none">
      <path d="M42 52V26c0-3-2-5-5-5s-5 2-5 5v21"/>
      <path d="M42 30c2-4 5-6 5-9s-3-5-5-5"/>
      <path d="M42 30c-2-4-5-6-5-9s3-5 5-5"/>
      <path d="M42 38c2.5-4 6-6 6-10s-3.5-6-6-6"/>
      <path d="M42 38c-2.5-4-6-6-6-10s3.5-6 6-6"/>
    </g>
    <circle cx="32" cy="42" r="4" fill="#c8912b"/>
    <circle cx="32" cy="42" r="2" fill="#1a2e1a"/>
    <g stroke="#c8912b" strokeWidth="1.5" strokeLinecap="round">
      <path d="M32 50v3"/>
      <path d="M25 47l-2 3"/>
      <path d="M39 47l2 3"/>
    </g>
  </svg>
);

// Wheat grain SVG icon for branding (legacy)
const WheatIcon = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v20M12 6c-2-2-4-1-4 2s2 4 4 4" />
    <path d="M12 6c2-2 4-1 4 2s-2 4-4 4" />
    <path d="M12 12c-3-2-5-1-5 3s3 5 5 5" />
    <path d="M12 12c3-2 5-1 5 3s-3 5-5 5" />
    <path d="M12 18c-2-1-3 0-3 2" />
    <path d="M12 18c2-1 3 0 3 2" />
  </svg>
);

// Dropdown menu component
const NavDropdown = ({ label, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="nav-dropdown"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="nav-link dropdown-trigger">
        {label}
        <ChevronDown size={14} className={`dropdown-chevron ${isOpen ? 'open' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <Motion.div
            className="dropdown-menu surface"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DropdownItem = ({ to, children }) => (
  <NavLink to={to} className="dropdown-item">
    {children}
  </NavLink>
);

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('token'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language] = useState('EN');
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="app-container">
      {/* Navbar - Editorial Style */}
      <nav className="navbar">
        {/* LEFT — Brand Identity */}
        <Link to="/" className="navbar-brand">
          <KrishiMitraLogo size={36} className="brand-logo" />
          <div className="brand-text">
            <span className="brand-name">KrishiMitra</span>
            <span className="brand-ai">AI</span>
          </div>
        </Link>

        {/* CENTER — Primary Navigation (Desktop) */}
        <div className="nav-center">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            Home
          </NavLink>

          <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Chat
          </NavLink>

          <NavLink to="/market" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Market
          </NavLink>

          <NavDropdown label="Predictions">
            <DropdownItem to="/yield">Yield A.I.</DropdownItem>
            <DropdownItem to="/pest-forecast">Pest Alerts</DropdownItem>
            <DropdownItem to="/irrigation-optimizer">Watering</DropdownItem>
          </NavDropdown>

          <NavLink to="/data-center" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Data
          </NavLink>

          <NavDropdown label="Intelligence">
            <DropdownItem to="/moat">AI Moat</DropdownItem>
            <DropdownItem to="/knowledge-map">Knowledge Map</DropdownItem>
          </NavDropdown>

          <NavDropdown label="Farm">
            <DropdownItem to="/farm">Dashboard</DropdownItem>
            <DropdownItem to="/crop-health">Crop Health</DropdownItem>
            <DropdownItem to="/satellite-imagery">Imagery</DropdownItem>
          </NavDropdown>
        </div>

        {/* RIGHT — Actions */}
        <div className="nav-right">
          {/* Language Selector */}
          <button className="language-selector">
            <Globe size={14} />
            <span>{language}</span>
          </button>

          {isLoggedIn ? (
            <>
              <Link to="/profile" className="profile-avatar">
                {initials}
              </Link>
              <button onClick={logout} className="btn-icon nav-icon" title="Logout">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-secondary btn-sm">
              Enter
            </Link>
          )}

          {/* Mobile Hamburger */}
          <button
            className="hamburger"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <Motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <Motion.div
              className="mobile-menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mobile-menu-header">
                <KrishiMitraLogo size={36} className="brand-logo" />
                <button
                  className="mobile-close"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mobile-menu-content">
                <NavLink
                  to="/"
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </NavLink>
                <NavLink
                  to="/chat"
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Chat
                </NavLink>
                <NavLink
                  to="/market"
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Market
                </NavLink>
                <div className="mobile-group-label">Predictions</div>
                <NavLink
                  to="/yield"
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Yield A.I.
                </NavLink>
                <NavLink
                  to="/pest-forecast"
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pest Alerts
                </NavLink>
                <NavLink
                  to="/irrigation-optimizer"
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Watering
                </NavLink>
                <NavLink
                  to="/data-center"
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Data Center
                </NavLink>
                <div className="mobile-group-label">Intelligence</div>
                <NavLink
                  to="/moat"
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  AI Moat
                </NavLink>
                <NavLink
                  to="/knowledge-map"
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Knowledge Map
                </NavLink>
                <div className="mobile-group-label">Farm</div>
                <NavLink
                  to="/farm"
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/crop-health"
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Crop Health
                </NavLink>
                <NavLink
                  to="/satellite-imagery"
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Imagery
                </NavLink>

                <div className="mobile-divider" />

                {isLoggedIn ? (
                  <>
                    <NavLink
                      to="/profile"
                      className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User size={20} />
                      Account
                    </NavLink>
                    <button onClick={logout} className="mobile-link danger">
                      <LogOut size={20} />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="btn btn-primary btn-block">
                    <LogIn size={18} />
                    Enter
                  </Link>
                )}
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content with Page Transitions */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <Motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/yield" element={<PrivateRoute><YieldPage /></PrivateRoute>} />
              <Route path="/pest-forecast" element={<PrivateRoute><PestForecastPage /></PrivateRoute>} />
              <Route path="/irrigation-optimizer" element={<PrivateRoute><IrrigationOptimizerPage /></PrivateRoute>} />
              <Route path="/moat" element={<PrivateRoute><MoatDashboardPage /></PrivateRoute>} />
              <Route path="/knowledge-map" element={<PrivateRoute><KnowledgeGraphPage /></PrivateRoute>} />
              <Route path="/data-center" element={<PrivateRoute><DataCenterPage /></PrivateRoute>} />
              <Route
                path="/farm"
                element={
                  <PrivateRoute>
                    <FarmDashboardPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/crop-health"
                element={
                  <PrivateRoute>
                    <CropHealthPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/satellite-imagery"
                element={
                  <PrivateRoute>
                    <SatelliteImageryPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <AccountPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/market"
                element={
                  <PrivateRoute>
                    <MarketPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/market/bill/:dealId"
                element={
                  <PrivateRoute>
                    <BillPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/market/confirm/:dealId"
                element={
                  <PrivateRoute>
                    <TradeConfirmPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/market/payment/:dealId"
                element={
                  <PrivateRoute>
                    <PaymentPage />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
