import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import './App.css';

const API_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/telemetry";
const NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";

// ─── Toast System ─────────────────────────────────────────────────────────────
const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' && <Icons.CheckCircle size={18} color="var(--success)" />}
            {t.type === 'error' && <Icons.AlertCircle size={18} color="var(--danger)" />}
            {t.type === 'info' && <Icons.Info size={18} color="var(--primary)" />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── API helpers ────────────────────────────────────────────────────────

async function fetchFEMakes(year) {
  if (!year) return [];
  try {
    const res = await fetch(`${API_URL}/api/fe/makes?year=${year}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch (e) {
    return [];
  }
}

async function fetchFEModels(year, make) {
  if (!year || !make) return [];
  try {
    const res = await fetch(`${API_URL}/api/fe/models?year=${year}&make=${encodeURIComponent(make)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch (e) {
    return [];
  }
}

function extractModelFamily(fullModel) {
  return fullModel.trim().split(' ')[0];
}

async function decodeVIN(vin) {
  const res = await fetch(`${NHTSA_BASE}/DecodeVinValues/${vin}?format=json`);
  const data = await res.json();
  if (data.Results && data.Results[0]) return data.Results[0];
  return null;
}

// ─── Color palette ────────────────────────────────────────────────────────────

const AUTOMOTIVE_COLORS = [
  { name: 'Black',       hex: '#0d0d0d' },
  { name: 'White',       hex: '#f5f5f5' },
  { name: 'Silver',      hex: '#b8b8b8' },
  { name: 'Grey',        hex: '#6b6b6b' },
  { name: 'Blue',        hex: '#1a3a6b' },
  { name: 'Navy',        hex: '#0a1a3a' },
  { name: 'Red',         hex: '#8b1a1a' },
  { name: 'Burgundy',    hex: '#5a0a1a' },
  { name: 'Green',       hex: '#1a4a2a' },
  { name: 'Graphite',    hex: '#3a3a3a' },
  { name: 'Champagne',   hex: '#d4c5a9' },
  { name: 'Pearl White', hex: '#f0ead6' },
];

// ─── Professional SVG icons ──────────────────────────────────────

const Icons = {
  Car: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l3-4h12l3 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
    </svg>
  ),
  Calendar: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Factory: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M2 20V9l7-5v5l7-5v5l4-3v14H2z" />
      <rect x="7" y="14" width="3" height="6" />
      <rect x="14" y="14" width="3" height="6" />
    </svg>
  ),
  Grid: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  Layers: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Sliders: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  CheckCircle: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Check: ({ size = 14, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Search: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ChevronRight: ({ size = 14, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  ChevronDown: ({ size = 14, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronLeft: ({ size = 14, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  X: ({ size = 18, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Scan: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  ),
  Pencil: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Package: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  User: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  LogOut: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Settings: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Activity: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  MessageSquare: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  AlertCircle: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Info: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Maximize: ({ size = 16, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  )
};

// ─── Vehicle silhouettes ──────────────────────────────────────────────────────

function VehicleSilhouette({ bodyClass, color = '#4facfe' }) {
  const type = (bodyClass || '').toLowerCase();
  let pathD, radiusOffset = 0;
  
  if (type.includes('suv') || type.includes('sport utility')) {
    pathD = "M40 95 L55 55 L80 35 L230 35 L260 55 L280 70 L290 95";
  } else if (type.includes('truck') || type.includes('pickup')) {
    pathD = "M30 90 L50 50 L80 35 L170 35 L175 50 L175 90 M175 90 L175 60 L290 60 L295 90";
    radiusOffset = -3;
  } else {
    // Sedan default
    pathD = "M35 90 L55 60 L95 38 L215 38 L255 58 L280 75 L290 90";
  }

  return (
    <svg viewBox="0 0 320 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 320 }}>
      {pathD.split('M').filter(Boolean).map((d, i) => (
        <path key={i} d={`M${d}`} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <path d="M20 90 L300 90" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={80 + radiusOffset} cy="102" r="14" stroke={color} strokeWidth="2" fill="none" />
      <circle cx={80 + radiusOffset} cy="102" r="5" fill={color} opacity="0.3" />
      <circle cx={240 + radiusOffset} cy="102" r="14" stroke={color} strokeWidth="2" fill="none" />
      <circle cx={240 + radiusOffset} cy="102" r="5" fill={color} opacity="0.3" />
    </svg>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonLoader({ rows = 3 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-text" style={{ width: `${85 - (i * 10)}%` }} />
      ))}
    </div>
  );
}

// ─── Native Select ────────────────────────────────────────────────────────────
function NativeSelect({ options, value, onChange, placeholder, disabled, loading }) {
  return (
    <div style={{ position: 'relative' }}>
      <select 
        className="input-field" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        disabled={disabled || loading}
        style={{ appearance: 'none', width: '100%', paddingRight: 'var(--space-2xl)' }}
      >
        <option value="" disabled>{loading ? 'Loading...' : placeholder}</option>
        {options.map((opt, i) => (
          <option key={i} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
        {loading ? <span className="sselect-spinner" style={{ position: 'relative', right: 0, top: 0, display: 'block', transform: 'none' }} /> : <Icons.ChevronDown size={14} />}
      </div>
    </div>
  );
}

// ─── Form Input with Validation ───────────────────────────────────────────────
function ValidatedInput({ label, type = "text", value, onChange, required, validate, placeholder, minLength, disabled }) {
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    if (required && !value) {
      setError(`${label} is required`);
    } else if (validate && value) {
      setError(validate(value) || '');
    } else if (minLength && value && value.length < minLength) {
      setError(`Minimum length is ${minLength}`);
    } else {
      setError('');
    }
  };

  if (type === 'textarea') {
    return (
      <div className="form-group mb-m">
        {label && <label>{label}</label>}
        <textarea
          className={`input-field ${error && touched ? 'is-invalid' : ''}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
        />
        {error && touched && <div className="form-error-msg">{error}</div>}
      </div>
    );
  }

  return (
    <div className="form-group mb-m">
      {label && <label>{label}</label>}
      <input
        type={type}
        className={`input-field ${error && touched ? 'is-invalid' : ''}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && touched && <div className="form-error-msg">{error}</div>}
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('autoagent_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('autoagent_user', JSON.stringify(user));
    else localStorage.removeItem('autoagent_user');
  }, [user]);

  const [showAuth, setShowAuth] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  return (
    <ToastProvider>
      {user ? (
        <MainLayout user={user} setUser={setUser} />
      ) : showAuth ? (
        <Auth onAuth={setUser} onBack={() => setShowAuth(false)} initialIsSignUp={isSignUpMode} />
      ) : (
        <LandingPage onEnter={signup => { setIsSignUpMode(signup); setShowAuth(true); }} />
      )}
    </ToastProvider>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage({ onEnter }) {
  return (
    <div className="app-container">
      <nav className="global-nav">
        <div className="nav-brand"><Icons.Activity size={20} color="var(--primary)" /> AutoAgent</div>
        <div className="nav-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onEnter(false)}>Log in</button>
          <button className="btn btn-primary btn-sm" onClick={() => onEnter(true)}>Get Started</button>
        </div>
      </nav>

      <main>
        <section className="landing-hero">
          <h1 className="hero-title">The Future of Vehicle Intelligence</h1>
          <p className="hero-subtitle">Real-time telemetry, advanced AI diagnostics, and predictive maintenance tools—all accessible directly from your pocket.</p>
          <button className="btn btn-primary hero-cta" onClick={() => onEnter(true)}>
            Start Building Your Garage <Icons.ChevronRight size={16} />
          </button>
          
          <div className="partner-logos">
            <span>OpenAI</span>
            <span>NHTSA</span>
            <span>FuelEconomy.gov</span>
          </div>
        </section>

        <section className="bento-grid">
          <div className="bento-item">
            <div className="bento-icon"><Icons.Scan size={24} /></div>
            <h3 className="bento-title">Smart VIN Decode</h3>
            <p className="bento-desc">Enter any 17-character VIN and instantly fetch technical specifications mapped directly from the NHTSA database.</p>
          </div>
          <div className="bento-item">
            <div className="bento-icon"><Icons.Layers size={24} /></div>
            <h3 className="bento-title">Organized Garage</h3>
            <p className="bento-desc">Manage all your vehicles in one place. Precise categorization via Year, Make, Model, and Trim.</p>
          </div>
          <div className="bento-item">
            <div className="bento-icon"><Icons.Activity size={24} /></div>
            <h3 className="bento-title">Real-Time Telemetry</h3>
            <p className="bento-desc">Access digital dashboards simulating live OBD-II sensor data, including RPM, speed, and real-time crash detection.</p>
          </div>
          <div className="bento-item">
            <div className="bento-icon"><Icons.MessageSquare size={24} /></div>
            <h3 className="bento-title">AI Mechanic</h3>
            <p className="bento-desc">Request deep-dive diagnostics contextually aware of your vehicle's specifications to get actionable maintenance advice.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function Auth({ onAuth, onBack, initialIsSignUp }) {
  const [isLogin, setIsLogin] = useState(!initialIsSignUp);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const toast = useToast();

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    const endpoint = isLogin ? '/login' : '/signup';
    const payload = isLogin ? { email, password } : { name, email, password };
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authentication failed');
      onAuth(data);
      toast(`Welcome ${isLogin ? 'back' : ''}!`, 'success');
    } catch (err) {
      setError(err instanceof TypeError ? 'Connection Error: Backend not running.' : err.message);
    }
  };

  return (
    <div className="app-container">
      <nav className="global-nav" style={{ borderBottom: 'none' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <Icons.X size={14} /> Close
        </button>
      </nav>
      <div className="auth-wrapper">
        <div className="auth-box">
          <h2>{isLogin ? 'Sign in to your account' : 'Create an account'}</h2>
          <p className="subtitle mb-xl">{isLogin ? 'Access your garage and telemetry' : 'Start managing your vehicle ecosystem'}</p>
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <ValidatedInput label="Full Name" value={name} onChange={setName} required />
            )}
            <ValidatedInput label="Email address" type="email" value={email} onChange={setEmail} required />
            <ValidatedInput label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
            
            {error && <div className="form-error-msg mb-m">{error}</div>}
            
            <button type="submit" className="btn btn-primary mt-m" style={{ width: '100%' }}>
              {isLogin ? 'Sign In' : 'Initialize Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-l)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? "Don't have an account? " : "Already registered? "}
            </span>
            <button className="btn btn-sm" style={{ padding: 0, color: 'var(--primary)' }} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

function MainLayout({ user, setUser }) {
  const [view, setView] = useState('garage'); // 'garage' | 'dashboard' | 'maintenance' | 'settings' | 'builder'
  const [activeCar, setActiveCar] = useState(user.vehicles?.[0] || null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [carToEdit, setCarToEdit] = useState(null);
  const toast = useToast();

  const handleLogout = () => {
    setUser(null);
    toast('Logged out successfully', 'info');
  };

  const navToBuild = (car = null) => {
    setCarToEdit(car);
    setView('builder');
  };

  return (
    <div className="app-container">
      <nav className="global-nav">
        <div className="nav-brand">
          <Icons.Activity size={20} color="var(--primary)" /> AutoAgent
        </div>
        
        <div className="nav-center-links">
          <button className={`nav-link ${view === 'garage' ? 'active' : ''}`} onClick={() => setView('garage')}>Garage</button>
          <button className={`nav-link ${view === 'maintenance' ? 'active' : ''}`} onClick={() => setView('maintenance')}>Maintenance</button>
        </div>

        <div className="nav-actions">
          <div className="user-menu-wrap" onMouseLeave={() => setDropdownOpen(false)}>
            <button className="user-menu-btn" onMouseEnter={() => setDropdownOpen(true)} onClick={() => setDropdownOpen(!dropdownOpen)}>
              <Icons.User size={16} /> 
              <span>{user.name.split(' ')[0]}</span>
              <Icons.ChevronDown size={14} color="var(--text-muted)" />
            </button>
            {dropdownOpen && (
              <div className="user-dropdown">
                <div style={{ padding: 'var(--space-m)', borderBottom: '1px solid var(--border-color)', marginBottom: 'var(--space-xs)' }}>
                  <div style={{ fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
                <button className="dropdown-item" onClick={() => { setView('settings'); setDropdownOpen(false); }}>
                  <Icons.Settings size={14} /> My Account
                </button>
                <div style={{ height: 1, background: 'var(--border-color)', margin: 'var(--space-xs) 0' }} />
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <Icons.LogOut size={14} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main>
        {view === 'settings'    && <Settings user={user} setUser={setUser} activeCar={activeCar} setActiveCar={setActiveCar} onEditCar={navToBuild} onBack={() => setView('garage')} />}
        {view === 'garage'      && <GarageList user={user} setUser={setUser} activeCar={activeCar} setActiveCar={setActiveCar} onAddCar={() => navToBuild(null)} onEnterDashboard={() => setView('dashboard')} />}
        {view === 'dashboard'   && <DigitalDashboard activeCar={activeCar} onBack={() => setView('garage')} />}
        {view === 'maintenance' && <Maintenance activeCar={activeCar} />}
        {view === 'builder'     && <VehicleBuilderForm user={user} setUser={setUser} setActiveCar={setActiveCar} editModeCar={carToEdit} onCancel={() => setView('garage')} />}
      </main>

      {view !== 'builder' && <ChatWidget activeCar={activeCar} />}
    </div>
  );
}

// ─── Settings Sidebar Layout ──────────────────────────────────────────────────

function Settings({ user, setUser, activeCar, setActiveCar, onEditCar, onBack }) {
  const [activeTab, setActiveTab] = useState('profile');
  const toast = useToast();

  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const handleProfileUpdate = async (e) => {
    e.preventDefault(); setSavingProfile(true);
    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Update failed');
      setUser({ ...user, name: data.name, email: data.email });
      toast('Profile updated', 'success');
    } catch (err) { toast(err.message, 'error'); }
    setSavingProfile(false);
  };

  const handlePassUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: curPass, new_password: newPass }) });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
      setCurPass(''); setNewPass('');
      toast('Password updated successfully', 'success');
    } catch (err) { toast(err.message, 'error'); }
  };

  const execDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      await fetch(`${API_URL}/vehicles/${vehicleToDelete}`, { method: 'DELETE' });
      const n = (user.vehicles || []).filter(v => v.id !== vehicleToDelete);
      setUser({ ...user, vehicles: n });
      if (activeCar?.id === vehicleToDelete) setActiveCar(n[0] || null);
      setVehicleToDelete(null);
      toast('Vehicle removed', 'success');
    } catch (e) { toast('Error removing vehicle', 'error'); }
  };

  return (
    <div className="settings-layout">
      {/* Sidebar */}
      <aside className="settings-sidebar">
        <button className="sidebar-link mb-l" onClick={onBack}>
          <Icons.ChevronLeft size={16} /> Back to Garage
        </button>

        <button className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <Icons.User size={16} /> My Profile
        </button>
        <button className={`sidebar-link ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
          <Icons.Activity size={16} /> Security
        </button>
        <button className={`sidebar-link ${activeTab === 'garage' ? 'active' : ''}`} onClick={() => setActiveTab('garage')}>
          <Icons.Car size={16} /> Manage Garage
        </button>
        
        <button className="sidebar-link danger" onClick={() => setUser(null)}>
          <Icons.LogOut size={16} /> Sign out
        </button>
      </aside>

      {/* Content */}
      <div className="settings-content">
        <section className={activeTab === 'profile' ? 'active' : ''}>
          <div className="settings-card">
            <h3 className="settings-card-title">Profile Information</h3>
            <form onSubmit={handleProfileUpdate}>
              <ValidatedInput label="Full Name" value={name} onChange={setName} required />
              <ValidatedInput label="Email address" type="email" value={email} onChange={setEmail} required />
              <button className="btn btn-primary" type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </section>

        <section className={activeTab === 'security' ? 'active' : ''}>
          <div className="settings-card">
            <h3 className="settings-card-title">Change Password</h3>
            <form onSubmit={handlePassUpdate}>
              <ValidatedInput label="Current Password" type="password" value={curPass} onChange={setCurPass} required />
              <ValidatedInput label="New Password" type="password" value={newPass} onChange={setNewPass} required minLength={6} />
              <button className="btn btn-primary" type="submit">Update Password</button>
            </form>
          </div>
        </section>

        <section className={activeTab === 'garage' ? 'active' : ''}>
          <div className="settings-card">
            <h3 className="settings-card-title">My Garage</h3>
            {!user.vehicles?.length ? (
              <p className="text-muted">No vehicles registered.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
                {user.vehicles.map(v => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-m)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '1rem' }}>{v.year} {v.make} {v.model}</div>
                      <div className="text-mono" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>VIN: {v.vin}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-s)' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => onEditCar(v)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setVehicleToDelete(v.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {vehicleToDelete && (
        <div className="wizard-backdrop">
          <div className="wiz-container" style={{ maxWidth: 400, textAlign: 'center', padding: 'var(--space-2xl)' }}>
            <div style={{ color: 'var(--danger)', marginBottom: 'var(--space-m)' }}><Icons.AlertCircle size={48} /></div>
            <h3 style={{ marginBottom: 'var(--space-m)' }}>Remove Vehicle</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>Are you sure you want to permanently delete this vehicle from your garage?</p>
            <div style={{ display: 'flex', gap: 'var(--space-m)', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setVehicleToDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={execDelete}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Garage List ──────────────────────────────────────────────────────────────

function GarageList({ user, setUser, activeCar, setActiveCar, onEnterDashboard, onAddCar }) {
  if (!user.vehicles || user.vehicles.length === 0) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: 'var(--space-3xl) 0' }}>
        <h3 className="mb-l">Your Garage is Empty</h3>
        <button className="btn btn-primary" onClick={onAddCar}>
          <Icons.Car size={16} /> Register New Vehicle
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header mb-2xl">
        <h2>My Vehicles</h2>
        <button className="btn btn-primary" onClick={onAddCar}>
          <Icons.Car size={16} /> Add Vehicle
        </button>
      </div>
      <div>
        {user.vehicles.map(v => (
          <div key={v.id} className="card garage-list-card">
            <div className="card-img-wrap">
              <img
                src={`https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=${v.make.toLowerCase()}&modelFamily=${v.model.toLowerCase().replace(' ','')}&modelYear=${v.year}`}
                alt={`${v.make} ${v.model}`}
                onError={e => { e.target.src = 'https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=tesla&modelFamily=models'; }}
              />
            </div>
            <div className="card-content">
              <h3 className="mb-s">{v.year} {v.make} {v.model}{v.submodel ? ` · ${v.submodel}` : ''}</h3>
              <div style={{ display: 'flex', gap: 'var(--space-m)', flexWrap: 'wrap', marginBottom: 'var(--space-l)' }}>
                <span className="text-mono text-muted" style={{ fontSize: '0.875rem' }}>VIN: {v.vin}</span>
                {v.powertrain && <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>{v.powertrain}</span>}
              </div>
              <button className="btn btn-secondary" style={{ width: 'fit-content' }} onClick={() => { setActiveCar(v); onEnterDashboard(); }}>
                <Icons.Activity size={16} /> Enter Telemetry Dashboard
              </button>
            </div>
            <div className="card-stats">
              <div className="stat-box">
                <div className="stat-val">{(Math.floor(Math.random() * 50000 + 10000)).toLocaleString()}</div>
                <div className="stat-lbl">Miles</div>
              </div>
              <div className="stat-box">
                <div className="stat-val" style={{ color: 'var(--success)' }}>{Math.floor(Math.random() * 15 + 85)}%</div>
                <div className="stat-lbl">Health</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Single Page Vehicle Builder Form ─────────────────────────────────────────

function VehicleBuilderForm({ user, setUser, setActiveCar, onCancel, editModeCar = null }) {
  const toast = useToast();

  const currentY = new Date().getFullYear();
  const allYears = useMemo(() => Array.from({ length: currentY - 1979 + 2 }, (_, i) => String(currentY + 1 - i)), [currentY]);

  const [year,      setYear]      = useState(editModeCar?.year     ? String(editModeCar.year) : '');
  const [make,      setMake]      = useState(editModeCar?.make     || '');
  const [family,    setFamily]    = useState('');           
  const [subModel,  setSubModel]  = useState(editModeCar?.model    || '');  
  const [vin,       setVin]       = useState(editModeCar?.vin      || '');

  const [color,     setColor]     = useState(editModeCar?.color    || '');
  const [colorName, setColorName] = useState(editModeCar?.color_name || '');
  const [packages,  setPackages]  = useState(editModeCar?.packages || '');

  // Cached decoded specs
  const [bodyClass,       setBodyClass]       = useState(editModeCar?.body_class       || '');
  const [engineCylinders, setEngineCylinders] = useState(editModeCar?.engine_cylinders || '');
  const [fuelType,        setFuelType]        = useState(editModeCar?.fuel_type        || '');
  const [driveType,       setDriveType]       = useState(editModeCar?.drive_type       || '');
  const [displacement,    setDisplacement]    = useState(editModeCar?.displacement     || '');
  const [engineHp,        setEngineHp]        = useState(editModeCar?.engine_hp        || '');
  const [powertrain,      setPowertrain]      = useState(editModeCar?.powertrain       || '');

  // Loading flags
  const [makesLoading,  setMakesLoading]  = useState(false);
  const [feModLoading,  setFEModLoading]  = useState(false);
  const [specsLoading,  setSpecsLoading]  = useState(false);
  const [vinLoading,    setVinLoading]    = useState(false);

  // Source options
  const [allMakes,     setAllMakes]     = useState(editModeCar?.make ? [editModeCar.make] : []);
  const [allFEModels,  setAllFEModels]  = useState([]);  
  const [allSubModels, setAllSubModels] = useState(editModeCar?.model ? [editModeCar.model] : []);  

  const allFamilies = useMemo(() => {
    return [...new Set(allFEModels.map(extractModelFamily))].sort();
  }, [allFEModels]);

  useEffect(() => {
    if (!family && allFEModels.length) { setAllSubModels([]); return; }
    if (family && allFEModels.length) {
      setAllSubModels(allFEModels.filter(m => extractModelFamily(m) === family));
    }
  }, [family, allFEModels]);

  // Progressive fetching
  // 1. When Year changes -> Fetch Makes from Backend Proxy
  useEffect(() => {
    if (!year) { setAllMakes([]); return; }
    setMakesLoading(true);
    fetchFEMakes(year)
      .then(ms => { if(ms.length > 0) setAllMakes(ms); setMakesLoading(false); })
      .catch(() => setMakesLoading(false));
  }, [year]);

  // 2. When Make changes -> Fetch Models from Backend Proxy
  useEffect(() => {
    if (!year || !make) { setAllFEModels([]); return; }
    setFEModLoading(true);
    fetchFEModels(year, make)
      .then(ms => { 
         if (ms.length > 0) setAllFEModels(ms);
         setFEModLoading(false); 
      })
      .catch(() => setFEModLoading(false));
  }, [year, make]);

  // 3. Auto decode specs from NHTSA when submodel completes
  useEffect(() => {
    if (!year || !make || !subModel) return;
    setSpecsLoading(true);
    fetch(`${NHTSA_BASE}/DecodeVinValues/?format=json&modelyear=${year}&make=${make}&model=${subModel}`)
      .then(r => r.json())
      .then(data => {
        if (data.Results?.[0]) {
          const r = data.Results[0];
          if (r.BodyClass)        setBodyClass(r.BodyClass);
          if (r.EngineCylinders)  setEngineCylinders(r.EngineCylinders);
          if (r.FuelTypePrimary)  setFuelType(r.FuelTypePrimary);
          if (r.DriveType)        setDriveType(r.DriveType);
          if (r.DisplacementL)    setDisplacement(`${parseFloat(r.DisplacementL).toFixed(1)}L`);
          if (r.EngineHP)         setEngineHp(`${r.EngineHP} HP`);
          setPowertrain(r.ElectrificationLevel && r.ElectrificationLevel !== 'Not Applicable' ? r.ElectrificationLevel : (r.FuelTypePrimary || ''));
        }
        setSpecsLoading(false);
      })
      .catch(() => setSpecsLoading(false));
  }, [year, make, subModel]);


  const handleVinLookup = async () => {
    if (!vin || vin.length < 11) {
      toast("Please enter a valid 17-character VIN.", "error"); return;
    }
    setVinLoading(true);
    try {
      const r = await decodeVIN(vin);
      if (r && r.Make) {
        setYear(r.ModelYear); 
        // We will mock populate Make/Model if they exist from API.
        // FE.gov usually returns Sentence case, NHTSA is all uppercase. Safe fallback is assigning text.
        setMake(r.Make.charAt(0).toUpperCase() + r.Make.slice(1).toLowerCase()); 
        setSubModel(r.Model || ''); 
        setVin(vin.toUpperCase());
        setBodyClass(r.BodyClass || '');
        setEngineCylinders(r.EngineCylinders || '');
        setFuelType(r.FuelTypePrimary || '');
        setDriveType(r.DriveType || '');
        setDisplacement(r.DisplacementL ? `${parseFloat(r.DisplacementL).toFixed(1)}L` : '');
        setEngineHp(r.EngineHP ? `${r.EngineHP} HP` : '');
        setPowertrain(r.ElectrificationLevel && r.ElectrificationLevel !== 'Not Applicable' ? r.ElectrificationLevel : (r.FuelTypePrimary || ''));
        if (r.Model) setFamily(extractModelFamily(r.Model));
        toast("Vehicle decoded successfully via NHTSA", "success");
      } else {
        toast('Could not decode this VIN', 'error');
      }
    } catch { toast('VIN lookup failed. Entering manual mode.', 'error'); }
    setVinLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!year || !make || !subModel) {
      toast("Please complete Year, Make, and Model requirements.", "error");
      return;
    }
    try {
      const isEdit = !!editModeCar;
      const url = isEdit ? `${API_URL}/vehicles/${editModeCar.id}` : `${API_URL}/vehicles?user_id=${user.id}`;
      const payload = {
        make, model: subModel, year: parseInt(year),
        vin: vin || `AA${Date.now()}`,
        submodel: null, powertrain: powertrain || fuelType || null,
        body_class: bodyClass || null, engine_cylinders: engineCylinders || null,
        fuel_type: fuelType || null, drive_type: driveType || null,
        displacement: displacement || null, engine_hp: engineHp || null,
        color: color || null, color_name: colorName || null, packages: packages || null,
      };
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to save');
      const data = await res.json();
      const nVehs = isEdit ? user.vehicles.map(v => v.id === data.id ? data : v) : [...(user.vehicles || []), data];
      setUser({ ...user, vehicles: nVehs });
      setActiveCar(data);
      toast(`Vehicle ${isEdit ? 'updated' : 'registered'}`, 'success');
      onCancel();
    } catch (err) { toast(err.message, 'error'); }
  };

  return (
    <div className="dashboard-container" style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <div className="dashboard-header mb-xl pb-m" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-m)' }}>
          <button className="btn btn-secondary" onClick={onCancel}><Icons.ChevronLeft size={16} /> Back</button>
          <h2>{editModeCar ? 'Edit Vehicle Profile' : 'Register New Vehicle'}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="setup-form-wrapper" style={{ display: 'grid', gap: 'var(--space-2xl)', maxWidth: 860, margin: '0 auto' }}>

        {/* Top Choices Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-l)' }}>
          <div className="card" style={{ padding: 'var(--space-l)', display: 'flex', flexDirection: 'column' }}>
            <h3 className="mb-s" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}>
               <Icons.Scan size={18} /> Option 1: Validated VIN Decode
            </h3>
            <p className="text-secondary mb-m" style={{ fontSize: '0.875rem', flex: 1 }}>Provide a 17-character VIN. AutoAgent will instantly prepopulate configurations mapped securely from the public database.</p>
            <div style={{ display: 'flex', gap: 'var(--space-m)' }}>
              <input type="text" className="input-field text-mono" style={{ textTransform: 'uppercase' }} placeholder="Enter 17-Char VIN" value={vin} onChange={e => setVin(e.target.value.toUpperCase())} maxLength={17} />
              <button type="button" className="btn btn-primary" onClick={handleVinLookup} disabled={vinLoading || vin.length < 11}>
                {vinLoading ? 'Decoding...' : 'Search'}
              </button>
            </div>
          </div>
          <div className="card" style={{ padding: 'var(--space-l)', display: 'flex', flexDirection: 'column' }}>
             <h3 className="mb-s" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}>
               <Icons.Pencil size={18} /> Option 2: Select Manually
             </h3>
             <p className="text-secondary mb-m" style={{ fontSize: '0.875rem' }}>Don't have your VIN on hand? No problem. Use the form options below to construct your vehicle profile manually.</p>
          </div>
        </div>

        {/* Primary Identification */}
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h3 className="mb-l" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}><Icons.Grid size={18} color="var(--primary)" /> Vehicle Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-l)', marginBottom: 'var(--space-l)' }}>
            <div>
              <label className="text-secondary mb-s" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>Model Year</label>
              <NativeSelect options={allYears} value={year} onChange={v => { setYear(v); setMake(''); setFamily(''); setSubModel(''); }} placeholder="Select Year..." />
            </div>
            <div style={{ opacity: year ? 1 : 0.4, pointerEvents: year ? 'auto' : 'none', transition: 'var(--transition-normal)' }}>
              <label className="text-secondary mb-s" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>Manufacturer</label>
              <NativeSelect options={allMakes} value={make} onChange={v => { setMake(v); setFamily(''); setSubModel(''); }} placeholder="Select Make..." loading={makesLoading} disabled={!year} />
            </div>
          </div>

          <div style={{ opacity: make ? 1 : 0.4, pointerEvents: make ? 'auto' : 'none', transition: 'var(--transition-normal)', marginBottom: 'var(--space-l)' }}>
            <label className="text-secondary mb-s" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>Model Family</label>
            {feModLoading ? <SkeletonLoader rows={2} /> : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-s)' }}>
                {allFamilies.map(f => (
                  <button type="button" key={f} className={`btn btn-sm ${family === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFamily(f); setSubModel(''); }}>
                    {f}
                  </button>
                ))}
                {!allFamilies.length && <span className="text-muted" style={{ display: 'block', padding: 'var(--space-s) 0' }}>No models found for this make.</span>}
              </div>
            )}
          </div>

          <div style={{ opacity: family ? 1 : 0.4, pointerEvents: family ? 'auto' : 'none', transition: 'var(--transition-normal)' }}>
            <label className="text-secondary mb-s" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>Specific Model Selection</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-m)' }}>
              {allSubModels.map(s => (
                <button type="button" key={s} className={`btn ${subModel === s ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'space-between', padding: '0 var(--space-m)' }} onClick={() => setSubModel(s)}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s}</span> 
                  {subModel === s && <Icons.Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Specifications and Setup */}
        <div className="card" style={{ padding: 'var(--space-xl)', opacity: subModel ? 1 : 0.4, pointerEvents: subModel ? 'auto' : 'none', transition: 'var(--transition-normal)' }}>
          <h3 className="mb-l" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}><Icons.Sliders size={18} color="var(--primary)" /> Specifics & Inferred Specifications</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
            <div>
              <label className="text-secondary mb-s" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>Technical Specifications</label>
              {specsLoading ? <SkeletonLoader rows={4} /> : (
                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-m)' }}>
                  {powertrain && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><span className="text-muted">Powertrain</span> <span>{powertrain}</span></div>}
                  {bodyClass && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><span className="text-muted">Body Class</span> <span>{bodyClass}</span></div>}
                  {engineCylinders && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><span className="text-muted">Cylinders</span> <span>{engineCylinders} Cyl</span></div>}
                  {driveType && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><span className="text-muted">Drivetrain</span> <span>{driveType}</span></div>}
                  {!powertrain && !bodyClass && !engineCylinders && <div className="text-muted text-center py-s">No spec mapped yet.</div>}
                </div>
              )}
            </div>

            <div>
              <label className="text-secondary mb-s" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>Added Options & Packages (Optional)</label>
              <ValidatedInput type="textarea" value={packages} onChange={setPackages} placeholder="List out specific options (e.g. Navigation, Cold Weather)" />
              <div style={{ display: 'flex', gap: 'var(--space-s)', flexWrap: 'wrap' }}>
                {['Sport Package', 'Premium Audio', 'Driver Assist', 'Panoramic Roof', 'Extended Range'].map(pkg => (
                  <button type="button" key={pkg} className="btn btn-sm btn-secondary" style={{ borderRadius: '24px' }} onClick={() => setPackages(packages ? packages + `\n${pkg}` : pkg)}>+ {pkg}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Identity Verification Render */}
        <div className="card" style={{ padding: 'var(--space-xl)', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2xl)' }}>
            <div style={{ flex: 1 }}>
              <div className="text-secondary text-mono mb-s text-sm">FINAL IDENTITY VERIFICATION</div>
              <div className="text-primary mb-m" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{year || '___'} {make || '___'} {subModel || ''}</div>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>If the digital preview matches physically, commit to garage.</p>
            </div>
            <div style={{ width: 240, flexShrink: 0, opacity: 0.8 }}>
              <VehicleSilhouette bodyClass={bodyClass} color={color ? AUTOMOTIVE_COLORS.find(c => c.name === color)?.hex || 'var(--primary)' : 'var(--primary)'} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-m)', paddingTop: 'var(--space-m)' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!year || !make || !subModel}>
            <Icons.CheckCircle size={18} /> {editModeCar ? 'Save Changes' : 'Add Vehicle'}
          </button>
        </div>

      </form>
    </div>
  );
}

// ─── Digital Dashboard & Maintenance remain unchanged... 
function DigitalDashboard({ activeCar, onBack }) {
  const [telemetry, setTelemetry] = useState({ speed: 0, rpm: 0 });
  const [crashDetected, setCrashDetected] = useState(false);
  const [diagnostic, setDiagnostic] = useState('');
  const [summary, setSummary] = useState('');
  const [scanning, setScanning] = useState(false);
  const ws = useRef(null);
  const telemetryInterval = useRef(null);
  const toast = useToast();

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);
    ws.current.onmessage = event => {
      const data = JSON.parse(event.data);
      if (activeCar && data.vin === activeCar.vin) {
        setTelemetry({ speed: data.speed, rpm: data.rpm });
        setCrashDetected(data.crash_detected);
        if (data.deep_diagnostic) { setDiagnostic(data.deep_diagnostic); setScanning(false); toast("Diagnostic complete", "success"); }
        if (data.summary) setSummary(data.summary);
      }
    };
    if (activeCar) {
      telemetryInterval.current = setInterval(() => {
        const speed = Math.max(0, 50 + Math.sin(Date.now() / 1000) * 10 + (Math.random() - 0.5) * 5);
        const rpm = Math.max(800, 2000 + Math.sin(Date.now() / 800) * 500 + (Math.random() - 0.5) * 100);
        fetch(`${API_URL}/telemetry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vin: activeCar.vin, speed, rpm, timestamp: Date.now() / 1000, ignition_on: true, scan_requested: false }) }).catch(() => {});
      }, 200);
    }
    return () => { ws.current?.close(); clearInterval(telemetryInterval.current); };
  }, [activeCar, toast]);

  const handleScan = async () => {
    if (!activeCar) return;
    setScanning(true); setDiagnostic('');
    await fetch(`${API_URL}/telemetry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vin: activeCar.vin, speed: telemetry.speed, rpm: telemetry.rpm, timestamp: Date.now() / 1000, ignition_on: true, scan_requested: true }) });
  };

  const triggerCrash = async () => {
    if (!activeCar) return;
    toast("Simulating crash event...", "error");
    await fetch(`${API_URL}/telemetry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vin: activeCar.vin, speed: 80, rpm: 3000, timestamp: Date.now() / 1000, ignition_on: true, scan_requested: false }) });
    setTimeout(async () => {
      await fetch(`${API_URL}/telemetry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vin: activeCar.vin, speed: 10, rpm: 0, timestamp: Date.now() / 1000 + 0.1, ignition_on: true, scan_requested: false }) });
    }, 100);
  };

  if (!activeCar) return <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>No vehicle selected.</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header mb-2xl">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-m)' }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            <Icons.ChevronLeft size={16} /> Back to Garage
          </button>
          <h2>Live Telemetry</h2>
        </div>
      </div>

      <div className="settings-layout" style={{ margin: 0, padding: 0, maxWidth: '100%', gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h3 className="mb-l">{activeCar.year} {activeCar.make} {activeCar.model}</h3>
          <div className="text-secondary text-mono mb-xl" style={{ fontSize: '0.875rem' }}>VIN: {activeCar.vin}</div>
          
          <button className="btn btn-primary mb-m" style={{ width: '100%' }} onClick={handleScan} disabled={scanning}>
            {scanning ? 'Running Diagnostic...' : 'Run Deep Scan'}
          </button>
          
          <button className="btn btn-secondary" style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={triggerCrash}>
             Simulate Crash Event
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-m)' }}>
            <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{telemetry.speed.toFixed(0)}</div>
              <div className="text-secondary" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '2px', marginTop: 'var(--space-s)' }}>Speed (MPH)</div>
            </div>
            <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{telemetry.rpm.toFixed(0)}</div>
              <div className="text-secondary" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '2px', marginTop: 'var(--space-s)' }}>Engine RPM</div>
            </div>
          </div>

          {crashDetected && (
            <div className="card" style={{ padding: 'var(--space-l)', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 'var(--space-m)', fontWeight: 600 }}>
              <Icons.AlertCircle size={24} /> S.O.S: CRASH DETECTED. Emergency response notified.
            </div>
          )}

          {diagnostic && (
            <div className="card" style={{ padding: 'var(--space-xl)' }}>
              <h4 className="mb-m text-primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}><Icons.Activity size={18} /> Diagnostic Report</h4>
              <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>{diagnostic}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Maintenance({ activeCar }) {
  const [aiReport, setAiReport] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!activeCar) return <div className="dashboard-container" style={{ textAlign: 'center', padding: 'var(--space-3xl) 0' }}><h3>Select a vehicle from your Garage to view AI Predictive Maintenance.</h3></div>;

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/maintenance_suggestions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vin: activeCar.vin }) });
      const data = await res.json();
      setAiReport(data.reply);
      toast("AI analysis complete", "success");
    } catch { toast('Failed to load AI suggestions.', 'error'); }
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header mb-2xl">
        <h2>AI Predictive Maintenance</h2>
      </div>
      
      <div className="settings-layout" style={{ margin: 0, padding: 0, maxWidth: '100%', gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
        <div className="card" style={{ padding: 'var(--space-xl)', height: 'fit-content' }}>
          <h3 className="mb-m">Health Assessment</h3>
          <p className="text-secondary mb-xl" style={{ fontSize: '0.9rem' }}>Have AutoAgent AI parse the latest OBD-II telemetry from your {activeCar.make} to generate an intelligent maintenance plan.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleRequest} disabled={loading}>
            {loading ? 'Analyzing Sensors...' : 'Run Diagnostics Analysis'}
          </button>
        </div>
        
        <div className="card" style={{ padding: 'var(--space-xl)', minHeight: '300px' }}>
          <h3 className="mb-m" style={{ color: 'var(--primary)' }}>AI Mechanic Report</h3>
          {aiReport ? (
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{aiReport}</div>
          ) : (
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
               No analysis generated yet.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Chat Widget ──────────────────────────────────────────────────────────────

function ChatWidget({ activeCar }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'ai', text: 'Hi! I am AutoAgent AI. Ask me about your vehicle...' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const sendMsg = async e => {
    e.preventDefault(); if (!input.trim()) return;
    const userMsg = input;
    setMessages(p => [...p, { sender: 'user', text: userMsg }]); setInput(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg, vin_context: activeCar?.vin || null }) });
      const data = await res.json();
      setMessages(p => [...p, { sender: 'ai', text: data.reply }]);
    } catch { setMessages(p => [...p, { sender: 'ai', text: 'Network area occurred.' }]); }
    setLoading(false);
  };

  if (!open) return (
    <button className="btn btn-primary" style={{ position: 'fixed', bottom: 'var(--space-xl)', right: 'var(--space-xl)', width: 56, height: 56, borderRadius: '50%', padding: 0, boxShadow: 'var(--shadow-xl)' }} onClick={() => setOpen(true)}>
      <Icons.MessageSquare size={24} />
    </button>
  );
  
  return (
    <div style={{ position: 'fixed', bottom: 'var(--space-xl)', right: 'var(--space-xl)', width: 340, height: 480, background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', zIndex: 1000, overflow: 'hidden', animation: 'scaleFadeIn var(--transition-normal)' }}>
      <div style={{ background: 'rgba(0,0,0,0.4)', padding: 'var(--space-m) var(--space-l)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
        <span>AutoAgent AI</span>
        <button className="btn btn-secondary btn-sm" style={{ padding: 'var(--space-xs)', height: 'auto', border: 'none' }} onClick={() => setOpen(false)}><Icons.X size={16} /></button>
      </div>
      <div style={{ flex: 1, padding: 'var(--space-m)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-s)' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: '82%', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', lineHeight: 1.45, alignSelf: m.sender === 'ai' ? 'flex-start' : 'flex-end', background: m.sender === 'ai' ? 'var(--surface-hover)' : 'var(--primary)', color: m.sender === 'user' ? '#fff' : 'inherit', borderBottomLeftRadius: m.sender === 'ai' ? 2 : 'var(--radius-md)', borderBottomRightRadius: m.sender === 'user' ? 2 : 'var(--radius-md)' }}>
            {m.text}
          </div>
        ))}
        {loading && <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)' }}>Thinking...</div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={sendMsg} style={{ display: 'flex', padding: '10px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border-color)', gap: 'var(--space-xs)' }}>
        <input type="text" className="input-field" placeholder="Ask about your car..." value={input} onChange={e => setInput(e.target.value)} style={{ flex: 1, height: 36, padding: '0 12px' }} />
        <button type="submit" className="btn btn-primary btn-sm" style={{ height: 36 }}>Send</button>
      </form>
    </div>
  );
}

export default App;
