import React from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import { Leaf, Upload, MessageSquare, User, Home, LogIn, LogOut, ShoppingBag, TrendingUp, Bug, Droplets } from 'lucide-react';
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
import './index.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('token'));

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="navbar glass">
          <div className="nav-brand">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Leaf size={28} color="var(--secondary)" />
              <span>KrishiMitra AI</span>
            </Link>
          </div>
          <div className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <Home size={20} /> Home
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <MessageSquare size={20} /> Chat
            </NavLink>
            <NavLink to="/upload" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Upload size={20} /> Knowledge
            </NavLink>
            <NavLink to="/market" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShoppingBag size={20} /> Market
            </NavLink>
            <NavLink to="/yield" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <TrendingUp size={20} /> Yield A.I.
            </NavLink>
            <NavLink to="/pest-forecast" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Bug size={20} /> Pest Alerts
            </NavLink>
            <NavLink to="/irrigation-optimizer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Droplets size={20} /> Watering
            </NavLink>
            {isLoggedIn ? (
              <>
                <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <User size={20} /> Account
                </NavLink>
                <button onClick={logout} className="btn btn-secondary !py-2 !px-4 !text-xs !rounded-xl !gap-2">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <NavLink to="/login" className="btn btn-primary !py-2 !px-6 !text-xs !rounded-xl !gap-2">
                <LogIn size={16} /> Login
              </NavLink>
            )}
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/yield" element={<PrivateRoute><YieldPage /></PrivateRoute>} />
            <Route path="/pest-forecast" element={<PrivateRoute><PestForecastPage /></PrivateRoute>} />
            <Route path="/irrigation-optimizer" element={<PrivateRoute><IrrigationOptimizerPage /></PrivateRoute>} />
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
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
