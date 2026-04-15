import React from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Leaf, Upload, MessageSquare, User, Home, LogIn, LogOut, ShoppingBag, TrendingUp, Bug, Droplets, Shield, Network, Database } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import UploadPage from './pages/UploadPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import MarketPage from './pages/MarketPage';
import BillPage from './pages/BillPage';
import YieldPage from './pages/YieldPage';
import PestForecastPage from './pages/PestForecastPage';
import IrrigationOptimizerPage from './pages/IrrigationOptimizerPage';
import MoatDashboardPage from './pages/MoatDashboardPage';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import DataCenterPage from './pages/DataCenterPage';
import './index.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};



function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('token'));
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <div className="app-container">
      <nav className="navbar glass">
        <div className="nav-brand">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Leaf size={28} color="var(--secondary)" />
            <span>KrishiMitra AI</span>
          </Link>
        </div>
        <div className="nav-links">
          <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <Home size={20} /> Home
            </NavLink>
          </Motion.div>
          <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <MessageSquare size={20} /> Chat
            </NavLink>
          </Motion.div>
          <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <NavLink to="/upload" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Upload size={20} /> Knowledge
            </NavLink>
          </Motion.div>
          <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <NavLink to="/market" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShoppingBag size={20} /> Market
            </NavLink>
          </Motion.div>
          <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <NavLink to="/yield" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <TrendingUp size={20} /> Yield A.I.
            </NavLink>
          </Motion.div>
          <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <NavLink to="/pest-forecast" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Bug size={20} /> Pest Alerts
            </NavLink>
          </Motion.div>
          <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <NavLink to="/irrigation-optimizer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Droplets size={20} /> Watering
            </NavLink>
          </Motion.div>
          <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <NavLink to="/moat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Shield size={20} /> AI Moat
            </NavLink>
          </Motion.div>
          <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <NavLink to="/knowledge-map" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Network size={20} /> Knowledge Map
            </NavLink>
          </Motion.div>
          <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <NavLink to="/data-center" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Database size={20} /> Data Center
            </NavLink>
          </Motion.div>
          {isLoggedIn ? (
            <>
              <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <User size={20} /> Account
                </NavLink>
              </Motion.div>
              <Motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                onClick={logout} 
                className="btn btn-secondary !py-2 !px-4 !text-xs !rounded-xl !gap-2"
              >
                <LogOut size={16} /> Logout
              </Motion.button>
            </>
          ) : (
            <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <NavLink to="/login" className="btn btn-primary !py-2 !px-6 !text-xs !rounded-xl !gap-2">
                <LogIn size={16} /> Login
              </NavLink>
            </Motion.div>
          )}
        </div>
      </nav>

      <main className="main-content">
        <AnimatePresence mode="wait">
          <Motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
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
            </Routes>
          </Motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
