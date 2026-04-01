import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/telemetry";

const CAR_MAKES = ["Acura", "Audi", "BMW", "Chevrolet", "Ford", "Honda", "Hyundai", "Jeep", "Kia", "Lexus", "Mercedes-Benz", "Nissan", "Porsche", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo"];

function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  
  if (user) return <MainLayout user={user} setUser={setUser} />;
  if (showAuth) return <Auth onAuth={setUser} onBack={() => setShowAuth(false)} />;
  return <LandingPage onEnter={() => setShowAuth(true)} />;
}

function LandingPage({ onEnter }) {
  return (
    <div className="app-container landing-bg">
      <nav className="landing-nav">
        <div className="nav-logo">AutoAgent</div>
        <div className="nav-links">
          <div className="dropdown">
            <button className="dropbtn">Products ▼</button>
            <div className="dropdown-content">
              <a href="#">Telemetry Pro</a>
              <a href="#">Fleet Management</a>
              <a href="#">AI Diagnostics</a>
            </div>
          </div>
          <button className="nav-btn-outline" onClick={onEnter}>Log In</button>
          <button className="nav-btn-solid" onClick={onEnter}>Sign Up</button>
        </div>
      </nav>
      <div className="hero-section">
        <h1>The Future of Vehicle Intelligence.</h1>
        <p>Real-time telemetry, advanced AI diagnostics, and predictive maintenance in your pocket.</p>
        <button className="premium-btn hero-btn" onClick={onEnter}>Get Started</button>
      </div>
    </div>
  );
}

function Auth({ onAuth, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const endpoint = isLogin ? "/login" : "/signup";
    const payload = isLogin ? { email, password } : { name, email, password };
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed");
      onAuth(data);
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="app-container">
      <div className="auth-container">
        <div className="auth-card">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h2 className="auth-title">AutoAgent <br/> <span style={{fontSize: "1rem", fontWeight: "300", color: "var(--text-secondary)"}}>Vehicle Ecosystem</span></h2>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" className="premium-input" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" className="premium-input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" className="premium-input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div style={{color: "var(--danger-color)", fontSize: "0.85rem", marginBottom: "1rem"}}>{error}</div>}
            <button type="submit" className="premium-btn">{isLogin ? "Sign In" : "Initialize Account"}</button>
          </form>
          <div className="switch-auth">
            {isLogin ? "New to AutoAgent?" : "Already registered?"}
            <span onClick={() => { setIsLogin(!isLogin); setError(""); }}>{isLogin ? "Sign Up" : "Log In"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainLayout({ user, setUser }) {
  const [view, setView] = useState('garage');
  const [activeCar, setActiveCar] = useState(user.vehicles?.[0] || null);
  return (
    <div className="app-container">
      <div className="dashboard">
        <header className="dash-header">
          <div className="welcome-text">Welcome, <span>{user.name}</span></div>
          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <button className="logout-btn" onClick={() => setView('garage')} style={{color: view === 'garage' ? 'var(--accent-color)' : ''}}>Garage</button>
            <button className="logout-btn" onClick={() => setView('maintenance')} style={{color: view === 'maintenance' ? 'var(--accent-color)' : ''}}>Maintenance</button>
            <button className="logout-btn" onClick={() => setView('settings')} style={{color: view === 'settings' ? 'var(--accent-color)' : ''}}>Settings</button>
            <button className="logout-btn" style={{borderColor: 'var(--danger-color)', color: 'var(--danger-color)'}} onClick={() => setUser(null)}>Logout</button>
          </div>
        </header>
        {view === 'settings' && <Settings user={user} setUser={setUser} activeCar={activeCar} setActiveCar={setActiveCar} />}
        {view === 'garage' && <Garage user={user} setUser={setUser} activeCar={activeCar} setActiveCar={setActiveCar} />}
        {view === 'maintenance' && <Maintenance activeCar={activeCar} />}
      </div>
      <ChatWidget activeCar={activeCar} />
    </div>
  );
}

function Maintenance({ activeCar }) {
  const [mockData, setMockData] = useState("");
  const [aiReport, setAiReport] = useState("");
  const [loading, setLoading] = useState(false);

  if (!activeCar) return <div style={{textAlign: 'center', marginTop: '2rem'}}>Select a vehicle in Garage to view Maintenance.</div>;

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/maintenance_suggestions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vin: activeCar.vin }) });
      const data = await res.json();
      setMockData(data.mock_data); setAiReport(data.reply);
    } catch (e) { setAiReport("Failed to load AI suggestions."); }
    setLoading(false);
  };

  return (
    <div className="garage-grid">
      <div className="car-card" style={{height: 'fit-content'}}>
        <h3 style={{marginBottom: "1rem"}}>Health Assessment</h3>
        <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem'}}>Request AutoAgent AI to scan your local OBD2 sensors and generate predictive maintenance actions.</p>
        <button className={`premium-btn ${loading ? "scanning" : ""}`} onClick={handleRequest} disabled={loading}>{loading ? "Analyzing Sensors..." : "Run AI Diagnostics"}</button>
        {mockData && (
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--danger-color)', borderLeft: '4px solid var(--danger-color)'}}>
            <strong>Raw Sensor Data (Mock):</strong><br/>{mockData}
          </div>
        )}
      </div>
      <div className="telemetry-panel" style={{display: 'flex', flexDirection: 'column'}}>
        {aiReport ? (
          <><h3 style={{color: 'var(--accent-color)'}}>AI Mechanic Report</h3><div style={{whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem'}}>{aiReport}</div></>
        ) : (<div style={{textAlign: 'center', margin: 'auto', color: 'var(--text-secondary)'}}>No reports generated yet. Run diagnostic.</div>)}
      </div>
    </div>
  );
}

function Garage({ user, setUser, activeCar, setActiveCar }) {
  const [telemetry, setTelemetry] = useState({ speed: 0, rpm: 0 });
  const [crashDetected, setCrashDetected] = useState(false);
  const [diagnostic, setDiagnostic] = useState("");
  const [summary, setSummary] = useState("");
  const [scanning, setScanning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const ws = useRef(null); const telemetryInterval = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (activeCar && data.vin === activeCar.vin) {
        setTelemetry({ speed: data.speed, rpm: data.rpm }); setCrashDetected(data.crash_detected);
        if (data.deep_diagnostic) { setDiagnostic(data.deep_diagnostic); setScanning(false); }
        if (data.summary) { setSummary(data.summary); }
      }
    };
    if (activeCar) {
      telemetryInterval.current = setInterval(() => {
        const speed = Math.max(0, 50 + Math.sin(Date.now() / 1000) * 10 + (Math.random() - 0.5) * 5);
        const rpm = Math.max(800, 2000 + Math.sin(Date.now() / 800) * 500 + (Math.random() - 0.5) * 100);
        fetch(`${API_URL}/telemetry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vin: activeCar.vin, speed, rpm, timestamp: Date.now() / 1000, ignition_on: true, scan_requested: false }) }).catch(() => {});
      }, 200);
    }
    return () => { if (ws.current) ws.current.close(); if (telemetryInterval.current) clearInterval(telemetryInterval.current); };
  }, [activeCar]);

  const handleScan = async () => {
    if (!activeCar) return; setScanning(true); setDiagnostic("");
    await fetch(`${API_URL}/telemetry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vin: activeCar.vin, speed: telemetry.speed, rpm: telemetry.rpm, timestamp: Date.now() / 1000, ignition_on: true, scan_requested: true }) });
  };
  const triggerCrash = async () => {
    if (!activeCar) return;
    await fetch(`${API_URL}/telemetry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vin: activeCar.vin, speed: 80, rpm: 3000, timestamp: Date.now() / 1000, ignition_on: true, scan_requested: false }) });
    setTimeout(async () => {
      await fetch(`${API_URL}/telemetry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vin: activeCar.vin, speed: 10, rpm: 0, timestamp: Date.now() / 1000 + 0.1, ignition_on: true, scan_requested: false }) });
    }, 100);
  };

  if (!activeCar && !showAddForm) {
    return (
      <div style={{ textAlign: "center", marginTop: "4rem" }}>
        <h3>No vehicles registered in Garage.</h3>
        <button className="premium-btn" style={{ maxWidth: "250px", marginTop: "1rem" }} onClick={() => setShowAddForm(true)}>Register New Vehicle</button>
      </div>
    );
  }
  if (showAddForm) return <SaveCarForm user={user} setUser={setUser} setActiveCar={setActiveCar} onCancel={() => setShowAddForm(false)} />;

  return (
    <div className="garage-grid">
      <div className="car-card">
        <div className="car-make-model">{activeCar.year} {activeCar.make} {activeCar.model}</div>
        <div className="car-details">VIN: {activeCar.vin}</div>
        <button className={`scan-btn ${scanning ? "scanning" : ""}`} onClick={handleScan} disabled={scanning}>{scanning ? "Running Deep-Dive Diagnostic..." : "Scan Now"}</button>
        <button className="scan-btn" style={{ marginTop: "1rem", color: "var(--danger-color)", borderColor: "var(--danger-color)" }} onClick={triggerCrash}>Simulate Crash Event</button>
      </div>
      <div className="telemetry-panel">
        <div className="telemetry-item"><div className="telemetry-value">{telemetry.speed.toFixed(0)}</div><div className="telemetry-label">MPH</div></div>
        <div className="telemetry-item"><div className="telemetry-value">{telemetry.rpm.toFixed(0)}</div><div className="telemetry-label">RPM</div></div>
        {crashDetected && <div className="crash-alert">⚠️ S.O.S: CRASH DETECTED. Emergency systems notified.</div>}
        {diagnostic && <div className="diagnostic-result"><h4>Diagnostic Results</h4><p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>{diagnostic}</p></div>}
        {summary && <div className="summary-result"><h4>Trip Summary</h4><p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>{summary}</p></div>}
      </div>
    </div>
  );
}

function SaveCarForm({ user, setUser, setActiveCar, onCancel, editModeCar = null }) {
  const [make, setMake] = useState(editModeCar?.make || "");
  const [model, setModel] = useState(editModeCar?.model || "");
  const [year, setYear] = useState(editModeCar?.year || "");
  const [vin, setVin] = useState(editModeCar?.vin || "");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!editModeCar;
      const url = isEdit ? `${API_URL}/vehicles/${editModeCar.id}` : `${API_URL}/vehicles?user_id=${user.id}`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ make, model, year: parseInt(year), vin }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save vehicle");
      
      let newVehicles = isEdit ? user.vehicles.map(v => v.id === data.id ? data : v) : [...(user.vehicles || []), data];
      setUser({...user, vehicles: newVehicles}); setActiveCar(data); onCancel();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="auth-card" style={{ margin: "0 auto" }}>
      <h3 style={{marginBottom: "1.5rem"}}>{editModeCar ? "Edit Vehicle" : "Add New Vehicle"}</h3>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Make</label>
          <input list="car-makes" className="premium-input" value={make} onChange={e => setMake(e.target.value)} required placeholder="e.g. Tesla" />
          <datalist id="car-makes">{CAR_MAKES.map(m => <option key={m} value={m} />)}</datalist>
        </div>
        <div className="input-group">
          <label>Model</label>
          <input type="text" className="premium-input" value={model} onChange={e => setModel(e.target.value)} required placeholder="e.g. Model S"/>
        </div>
        <div className="input-group">
          <label>Year</label>
          <input type="number" className="premium-input" value={year} onChange={e => setYear(e.target.value)} required placeholder="e.g. 2024" />
        </div>
        <div className="input-group">
          <label>VIN (Vehicle Identification Number)</label>
          <input type="text" className="premium-input" value={vin} onChange={e => setVin(e.target.value)} required />
        </div>
        {error && <div style={{color: "var(--danger-color)", fontSize: "0.85rem", marginBottom: "1rem"}}>{error}</div>}
        <button type="submit" className="premium-btn">{editModeCar ? "Save Changes" : "Register Vehicle"}</button>
        <button type="button" className="scan-btn" style={{marginTop: "1rem"}} onClick={onCancel}>Cancel</button>
      </form>
    </div>
  );
}

function Settings({ user, setUser, activeCar, setActiveCar }) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [msg, setMsg] = useState("");
  const [curPass, setCurPass] = useState(""); const [newPass, setNewPass] = useState(""); const [passMsg, setPassMsg] = useState("");
  const [editingCar, setEditingCar] = useState(null);

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update profile");
      setUser({...user, name: data.name, email: data.email, vehicles: data.vehicles});
      setMsg("Profile updated successfully."); setTimeout(() => setMsg(""), 3000);
    } catch(err) { setMsg(err.message); }
  };
  const handlePasswordUpdate = async (e) => {
    e.preventDefault(); setPassMsg("");
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/password`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current_password: curPass, new_password: newPass }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update password");
      setPassMsg("Password updated successfully."); setCurPass(""); setNewPass(""); setTimeout(() => setPassMsg(""), 3000);
    } catch(err) { setPassMsg(err.message); }
  };
  const handleVehicleDelete = async (vehId) => {
    try {
      await fetch(`${API_URL}/vehicles/${vehId}`, { method: "DELETE" });
      const newVehicles = (user.vehicles || []).filter(v => v.id !== vehId);
      setUser({...user, vehicles: newVehicles});
      if (activeCar && activeCar.id === vehId) setActiveCar(newVehicles.length > 0 ? newVehicles[0] : null);
    } catch(err) { console.error(err); }
  };

  if (editingCar) return <SaveCarForm user={user} setUser={setUser} setActiveCar={setActiveCar} editModeCar={editingCar} onCancel={() => setEditingCar(null)} />;

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          <div className="auth-card" style={{margin: '0', maxWidth: '100%'}}>
            <h3 style={{marginBottom: "1.5rem"}}>Update User Profile</h3>
            <form onSubmit={handleUserUpdate}>
              <div className="input-group"><label>Full Name</label><input type="text" className="premium-input" value={name} onChange={e=>setName(e.target.value)} required /></div>
              <div className="input-group"><label>Registered Email</label><input type="email" className="premium-input" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
              {msg && <div style={{color: msg.includes("success") ? "var(--accent-color)" : "var(--danger-color)", fontWeight: "500", marginBottom: "1rem", fontSize: "0.9rem"}}>{msg}</div>}
              <button type="submit" className="premium-btn">Save Changes</button>
            </form>
          </div>
          <div className="auth-card" style={{margin: '0', maxWidth: '100%'}}>
            <h3 style={{marginBottom: "1.5rem"}}>Update Password</h3>
            <form onSubmit={handlePasswordUpdate}>
              <div className="input-group"><label>Current Password</label><input type="password" className="premium-input" value={curPass} onChange={e=>setCurPass(e.target.value)} required /></div>
              <div className="input-group"><label>New Password</label><input type="password" className="premium-input" value={newPass} onChange={e=>setNewPass(e.target.value)} required minLength={6} /></div>
              {passMsg && <div style={{color: passMsg.includes("success") ? "var(--accent-color)" : "var(--danger-color)", fontWeight: "500", marginBottom: "1rem", fontSize: "0.9rem"}}>{passMsg}</div>}
              <button type="submit" className="premium-btn" style={{background: 'linear-gradient(135deg, #1f1f1f 0%, #333 100%)', color: 'white'}}>Change Password</button>
            </form>
          </div>
      </div>
      <div className="auth-card" style={{margin: '0', maxWidth: '100%'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h3 style={{margin: 0}}>Manage Garage</h3>
        </div>
        {(!user.vehicles || user.vehicles.length === 0) ? (
          <p style={{color: 'var(--text-secondary)'}}>No vehicles registered to modify.</p>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {user.vehicles.map(v => (
              <div key={v.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px'}}>
                <div><div style={{fontWeight: 500}}>{v.year} {v.make} {v.model}</div><div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>VIN: {v.vin}</div></div>
                <div style={{display: "flex", gap: "8px"}}>
                  {activeCar && activeCar.id === v.id ? (<span style={{color: 'var(--accent-color)', alignSelf: 'center', marginRight: '0.5rem', fontWeight: 600}}>Active</span>) : (<button className="scan-btn" style={{width: 'auto', padding: '6px 10px', fontSize: '0.8rem'}} onClick={() => setActiveCar(v)}>Slct</button>)}
                  <button className="scan-btn" style={{width: 'auto', padding: '6px 10px', fontSize: '0.8rem', color: '#ccc', borderColor: '#444'}} onClick={() => setEditingCar(v)}>Edit</button>
                  <button className="scan-btn" style={{width: 'auto', padding: '6px 10px', fontSize: '0.8rem', color: "var(--danger-color)", borderColor: "var(--danger-color)"}} onClick={() => handleVehicleDelete(v.id)}>Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatWidget({ activeCar }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'ai', text: 'Hi! I am AutoAgent AI. Ask me about your vehicle...' }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open]);

  const sendMsg = async (e) => {
    e.preventDefault(); if (!input.trim()) return;
    const userMsg = input; setMessages(prev => [...prev, { sender: 'user', text: userMsg }]); setInput(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userMsg, vin_context: activeCar?.vin || null }) });
      const data = await res.json(); setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
    } catch(err) { setMessages(prev => [...prev, { sender: 'ai', text: "Network error occurred." }]); }
    setLoading(false);
  };

  if (!open) return <button className="chat-toggle-btn" onClick={() => setOpen(true)} title="AutoAgent AI">💬</button>;

  return (
    <div className="chat-window">
      <div className="chat-header"><span>🤖 AutoAgent AI</span><button className="close-btn" onClick={() => setOpen(false)}>×</button></div>
      <div className="chat-messages">{messages.map((m, i) => (<div key={i} className={`chat-bubble ${m.sender}`}>{m.text}</div>))}{loading && <div className="chat-bubble ai pulse-txt">Thinking...</div>}<div ref={messagesEndRef} /></div>
      <form onSubmit={sendMsg} className="chat-input-area"><input type="text" placeholder="Ask about your car..." value={input} onChange={e=>setInput(e.target.value)} /><button type="submit">Send</button></form>
    </div>
  );
}

export default App;
