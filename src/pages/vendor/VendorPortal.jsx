/**
 * VendorPortal.jsx — Vendor Management Control Center
 * v3: Dark/Light theme, proper header, full image lightbox, brand rename
 */
import React, { useState, useEffect } from 'react';
import { useApp } from '../../App';
import { Sidebar } from '../../components/Sidebar';
import { ComplaintCard, VendorComplaintModal } from '../../components/ComplaintCard';
import { KPI, ProgressBar, NotifBanner } from '../../components/UI';
import LiveMap from '../../components/LiveMap';

import { db } from '../../utils/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';

// ── Theme Tokens ──────────────────────────────────────────────────────────────
const LIGHT = {
  accent:      '#1C3D8F', accentLight: '#EEF2FF', accentDark: '#0F2660',
  green:       '#0D6E52', greenLight:  '#E8F5F1',
  red:         '#A32D2D', redLight:    '#FDEFEF',
  amber:       '#854F0B', amberLight:  '#FFF8ED',
  text:        '#111827', text2: '#374151', text3: '#6B7280', text4: '#9CA3AF',
  surface:     '#FFFFFF', surface2: '#F7F8FA', surface3: '#ECEEF2',
  border:      '#D4D8E2', border2: '#E8EAF0',
  bg:          '#F0F1F3',
  headerBg:    '#1C3D8F', headerText: '#FFFFFF',
  sidebarBg:   '#FFFFFF',
};
const DARK = {
  accent:      '#4F7FE8', accentLight: '#1A2A4A', accentDark: '#2250C4',
  green:       '#10B981', greenLight:  '#042F22',
  red:         '#F87171', redLight:    '#2D1515',
  amber:       '#FBBF24', amberLight:  '#2D2010',
  text:        '#F1F5F9', text2: '#CBD5E1', text3: '#94A3B8', text4: '#64748B',
  surface:     '#0F172A', surface2: '#1E293B', surface3: '#263347',
  border:      '#2D3F55', border2: '#1E2D40',
  bg:          '#080F1E',
  headerBg:    '#060D1A', headerText: '#F1F5F9',
  sidebarBg:   '#0F172A',
};

// ── Theme-aware Btn ───────────────────────────────────────────────────────────
const Btn = ({ children, onClick, color, outline = false, small = false, type = 'button', icon, t }) => {
  const bg = color || t.accent;
  return (
    <button type={type} onClick={onClick} style={{
      padding: small ? '5px 11px' : '8px 14px', borderRadius: 5,
      fontSize: small ? 11 : 12, fontWeight: 600, cursor: 'pointer',
      background: outline ? 'transparent' : bg,
      color: outline ? bg : '#fff',
      border: outline ? `1px solid ${bg}` : 'none',
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: 'IBM Plex Sans, sans-serif', letterSpacing: '.02em',
    }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: small ? 12 : 14 }} aria-hidden="true" />}
      {children}
    </button>
  );
};

// ── Full Image Lightbox ───────────────────────────────────────────────────────
function ImageLightbox({ imageUrl, onClose }) {
  useEffect(() => {
    if (!imageUrl) return;
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(4,8,20,0.96)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'zoom-out', backdropFilter: 'blur(4px)',
    }}>
      <div style={{ position: 'relative', maxWidth: '96vw', maxHeight: '96vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        onClick={e => e.stopPropagation()}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 0 10px', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono,monospace', letterSpacing: '.04em', textTransform: 'uppercase' }}>
            Evidence Photo
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={imageUrl} download target="_blank" rel="noreferrer"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', width: 32, height: 32, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
              aria-label="Download">
              <i className="ti ti-download" style={{ fontSize: 14 }} aria-hidden="true" />
            </a>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', width: 32, height: 32, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close">
              <i className="ti ti-x" style={{ fontSize: 14 }} aria-hidden="true" />
            </button>
          </div>
        </div>
        <img src={imageUrl} alt="Evidence proof" style={{ maxWidth: '100%', maxHeight: 'calc(96vh - 60px)', borderRadius: 8, objectFit: 'contain', display: 'block' }} />
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 8, fontFamily: 'IBM Plex Mono,monospace' }}>Click outside or press ESC to close</div>
      </div>
    </div>
  );
}

// ── Top Header Bar ────────────────────────────────────────────────────────────
function TopHeader({ t, dark, onToggleDark, vendorData, onLogout }) {
  return (
    <div style={{ background: t.headerBg, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, flexShrink: 0, borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)'}` }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 5, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-train" style={{ fontSize: 16, color: '#fff' }} aria-hidden="true" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-.01em', lineHeight: 1 }}>NagpurRail GRWMS</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono,monospace', letterSpacing: '.05em', marginTop: 2 }}>
            {vendorData?.stationName || 'VENDOR CONTROL CENTER'}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Dark/Light Toggle */}
        <button onClick={onToggleDark}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, padding: '5px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 600, fontFamily: 'IBM Plex Sans,sans-serif' }}
          aria-label="Toggle theme">
          <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} style={{ fontSize: 14 }} aria-hidden="true" />
          {dark ? 'Light' : 'Dark'}
        </button>

        {/* User */}
        {vendorData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 8px', background: 'rgba(255,255,255,0.08)', borderRadius: 5, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'IBM Plex Mono,monospace' }}>
              {(vendorData.name || 'VA').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', lineHeight: 1 }}>{vendorData.name || 'Vendor Admin'}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono,monospace' }}>Vendor</div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={onLogout}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, padding: '5px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600, fontFamily: 'IBM Plex Sans,sans-serif' }}>
          <i className="ti ti-logout" style={{ fontSize: 13 }} aria-hidden="true" />
          Exit
        </button>
      </div>
    </div>
  );
}

// ── Task Inbox ────────────────────────────────────────────────────────────────
function TaskInbox({ tasks, onAction, onSelect, onOpenAssignModal, onViewImage, t }) {
  const active = tasks.filter(c => !['COMPLETED', 'REJECTED'].includes(c.status));
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: t.text, letterSpacing: '-.01em' }}>Tasks Workspace</div>
        <div style={{ fontSize: 11, color: t.text3, marginTop: 2, fontFamily: 'IBM Plex Mono,monospace' }}>Nagpur Junction — Live Nodes</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Total', value: tasks.length, color: t.text },
          { label: 'New', value: tasks.filter(c => c.status === 'NEW').length, color: t.red },
          { label: 'Active', value: tasks.filter(c => ['ACCEPTED','ASSIGNED_TO_CLEANER','CLEANED_BY_FORCE'].includes(c.status)).length, color: t.accent },
          { label: 'Done', value: tasks.filter(c => c.status === 'COMPLETED').length, color: t.green },
        ].map(k => (
          <div key={k.label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: 'IBM Plex Mono,monospace', lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 10, color: t.text3, marginTop: 4, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {active.length === 0 ? (
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 32, textAlign: 'center', color: t.text3 }}>
          <i className="ti ti-circle-check" style={{ fontSize: 28, display: 'block', marginBottom: 8, color: t.green }} aria-hidden="true" />
          No pending cleaning tracks available.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {active.map(c => (
            <ComplaintCard key={c.id} complaint={c} onClick={() => onSelect(c)} onViewImage={onViewImage} actions={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                {c.status === 'NEW' && <Btn t={t} onClick={e => { e.stopPropagation(); onAction(c.id, 'ACCEPTED'); }} icon="ti-circle-check">Accept Task</Btn>}
                {c.status === 'ACCEPTED' && <Btn t={t} onClick={e => { e.stopPropagation(); onOpenAssignModal(c); }} color="#4527A0" icon="ti-user-plus">Assign Cleaner</Btn>}
                {c.status === 'ASSIGNED_TO_CLEANER' && (
                  <div style={{ fontSize: 11, color: t.amber, fontWeight: 600, background: t.amberLight, padding: '6px 10px', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="ti ti-user-check" style={{ fontSize: 13 }} aria-hidden="true" />
                    On Duty: {c.assignedTo || 'Cleaner'}
                  </div>
                )}
                {c.status === 'CLEANED_BY_FORCE' && (
                  <div style={{ background: t.greenLight, padding: 9, borderRadius: 7, border: `1px solid rgba(13,110,82,.2)` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: t.green, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>Cleaner Proof:</div>
                    {c.cleanerPhoto && (
                      <img src={c.cleanerPhoto} alt="Proof"
                        onClick={e => { e.stopPropagation(); onViewImage(c.cleanerPhoto); }}
                        style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 5, marginBottom: 6, cursor: 'zoom-in', display: 'block' }} />
                    )}
                    <Btn t={t} onClick={e => { e.stopPropagation(); onAction(c.id, 'COMPLETED'); }} color={t.green} icon="ti-check">Complete & Close</Btn>
                  </div>
                )}
                <Btn t={t} onClick={e => { e.stopPropagation(); onSelect(c); }} outline small icon="ti-eye">View Details</Btn>
              </div>
            } />
          ))}
        </div>
      )}
    </>
  );
}

// ── Cleaner Staff Management ──────────────────────────────────────────────────
function DynamicCleanersTab({ cleaners, onAddCleaner, onDeleteCleaner, t }) {
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [showPassId, setShowPassId] = useState(null);

  const handleSubmit = e => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim() || !cPassword.trim()) return alert('Please fill all fields.');
    onAddCleaner({ name: cName.trim(), phone: cPhone.trim(), password: cPassword.trim() });
    setCName(''); setCPhone(''); setCPassword('');
  };

  const inp = { width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 5, border: `1px solid ${t.border}`, boxSizing: 'border-box', fontFamily: 'IBM Plex Sans,sans-serif', background: t.surface2, color: t.text, outline: 'none' };
  const lbl = { fontSize: 10, fontWeight: 600, color: t.text3, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'IBM Plex Mono,monospace' };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: t.text, letterSpacing: '-.01em' }}>Cleaner Staff</div>
        <div style={{ fontSize: 11, color: t.text3, marginTop: 2 }}>Manage ground deployment crews</div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, background: t.surface, padding: 14, borderRadius: 8, border: `1px solid ${t.border}`, marginBottom: 18, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 140 }}><span style={lbl}>Cleaner Name</span><input type="text" value={cName} onChange={e => setCName(e.target.value)} placeholder="e.g. Ramesh Kumar" style={inp} /></div>
        <div style={{ flex: 1, minWidth: 140 }}><span style={lbl}>Phone / Login ID</span><input type="text" value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="e.g. ramesh98" style={inp} /></div>
        <div style={{ flex: 1, minWidth: 110 }}><span style={lbl}>Password</span><input type="password" value={cPassword} onChange={e => setCPassword(e.target.value)} placeholder="••••••" style={inp} /></div>
        <Btn t={t} type="submit" color={t.green} icon="ti-user-plus">Add Cleaner</Btn>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        {cleaners.length === 0
          ? <div style={{ color: t.text3, fontSize: 12 }}>No staff onboarded yet.</div>
          : cleaners.map(c => (
          <div key={c.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <div style={{ width: 30, height: 30, borderRadius: 5, background: t.accentLight, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, fontFamily: 'IBM Plex Mono,monospace' }}>
                  {c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, color: t.text }}>{c.name}</div>
              </div>
              <div style={{ fontSize: 10, color: t.text3, fontFamily: 'IBM Plex Mono,monospace' }}>ID: <strong style={{ color: t.accent }}>{c.phone}</strong></div>
              <div style={{ fontSize: 10, color: t.text3, marginTop: 2, fontFamily: 'IBM Plex Mono,monospace' }}>
                Pass: <strong>{showPassId === c.id ? c.password : '••••••'}</strong>
                <span onClick={() => setShowPassId(showPassId === c.id ? null : c.id)} style={{ marginLeft: 5, color: t.accent, cursor: 'pointer', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  [{showPassId === c.id ? 'Hide' : 'Show'}]
                </span>
              </div>
            </div>
            <button onClick={() => onDeleteCleaner(c.id)} style={{ background: t.redLight, border: `1px solid rgba(163,45,45,.2)`, color: t.red, cursor: 'pointer', width: 32, height: 32, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label={`Remove ${c.name}`}>
              <i className="ti ti-trash" style={{ fontSize: 14 }} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Cleaner Dashboard ─────────────────────────────────────────────────────────
function CleanerDashboard({ cleanerData, vendorId, tasks, onUpdateComplaint, onLogout, t }) {
  const myTasks = tasks.filter(c => c.assignedTo === cleanerData.name && c.status === 'ASSIGNED_TO_CLEANER');
  const [inputUrl, setInputUrl] = useState({});

  const handleCompleteTask = async id => {
    const url = inputUrl[id];
    if (!url || !url.trim()) return alert('Please enter a valid proof image URL.');
    await onUpdateComplaint(id, { status: 'CLEANED_BY_FORCE', cleanerStatus: 'DONE', cleanerPhoto: url.trim() });
    alert('Task submitted for verification!');
  };

  return (
    <div style={{ padding: 16, maxWidth: 540, margin: '0 auto', fontFamily: 'IBM Plex Sans,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, background: t.surface, border: `1px solid ${t.border}`, padding: '12px 14px', borderRadius: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, color: t.text }}>
            <i className="ti ti-user-check" style={{ fontSize: 16, color: t.accent }} aria-hidden="true" />
            {cleanerData.name}
          </div>
          <div style={{ fontSize: 10, color: t.text3, marginTop: 2, fontFamily: 'IBM Plex Mono,monospace' }}>Vendor: {vendorId}</div>
        </div>
        <button onClick={onLogout} style={{ background: t.redLight, border: `1px solid rgba(163,45,45,.2)`, color: t.red, padding: '6px 11px', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
          <i className="ti ti-logout" style={{ fontSize: 13 }} aria-hidden="true" />Logout
        </button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 10 }}>
        Pending Tasks <span style={{ background: t.accentLight, color: t.accent, padding: '2px 8px', borderRadius: 3, fontSize: 11, fontFamily: 'IBM Plex Mono,monospace', marginLeft: 5 }}>{myTasks.length}</span>
      </div>

      {myTasks.length === 0 ? (
        <div style={{ background: t.surface, padding: 24, borderRadius: 8, border: `1px solid ${t.border}`, textAlign: 'center', color: t.text3, fontSize: 12 }}>
          <i className="ti ti-circle-check" style={{ fontSize: 24, display: 'block', marginBottom: 7, color: t.green }} aria-hidden="true" />
          No pending tasks right now.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {myTasks.map(task => (
            <div key={task.id} style={{ background: t.surface, padding: 13, borderRadius: 8, border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: t.text, fontSize: 13, marginBottom: 3 }}>
                <i className="ti ti-map-pin" style={{ fontSize: 14, color: t.accent }} aria-hidden="true" />
                {task.area || 'Platform Area'}
              </div>
              <div style={{ fontSize: 11, color: t.text3, marginBottom: 10 }}>{task.title || 'General Waste Issue'}</div>
              <div style={{ background: t.surface2, padding: 9, borderRadius: 6, border: `1px solid ${t.border2}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: t.text3, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'IBM Plex Mono,monospace' }}>Paste Cleaned Photo URL</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <input type="text" placeholder="https://example.com/photo.jpg" value={inputUrl[task.id] || ''} onChange={e => setInputUrl({ ...inputUrl, [task.id]: e.target.value })}
                    style={{ flex: 1, padding: '7px 10px', fontSize: 12, borderRadius: 5, border: `1px solid ${t.border}`, fontFamily: 'IBM Plex Sans,sans-serif', background: t.surface, color: t.text, outline: 'none' }} />
                  <button onClick={() => handleCompleteTask(task.id)} style={{ background: t.green, color: '#fff', border: 'none', padding: '7px 11px', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="ti ti-check" style={{ fontSize: 13 }} aria-hidden="true" />Mark Cleaned
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Vendor Portal ────────────────────────────────────────────────────────
export default function VendorPortal() {
  const { complaints, updateComplaint } = useApp();

  const [dark, setDark] = useState(false);
  const t = dark ? DARK : LIGHT;

  const [loginMode, setLoginMode] = useState('vendor');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vendorLoginId, setVendorLoginId] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [currentVendorData, setCurrentVendorData] = useState(null);
  const [cleanerUserId, setCleanerUserId] = useState('');
  const [cleanerPassword, setCleanerPassword] = useState('');
  const [activeCleanerData, setActiveCleanerData] = useState(null);

  const [tab, setTab] = useState('tasks');
  const [selected, setSelected] = useState(null);
  const [notif, setNotif] = useState(null);
  const [assignModalTask, setAssignModalTask] = useState(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const [cleaners, setCleaners] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !vendorLoginId || loginMode !== 'vendor') return;
    return onSnapshot(collection(db, 'vendors', vendorLoginId.trim(), 'cleaners'), snap => {
      setCleaners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [isAuthenticated, vendorLoginId, loginMode]);

  const handleVendorAuth = async e => {
    e.preventDefault();
    if (!vendorLoginId.trim() || !vendorPassword) return alert('Fill all fields.');
    try {
      const res = await getDoc(doc(db, 'vendors', vendorLoginId.trim()));
      if (res.exists() && res.data().password === vendorPassword) { setCurrentVendorData(res.data()); setIsAuthenticated(true); }
      else alert('Invalid Vendor Credentials.');
    } catch { alert('Database connection error.'); }
  };

  const handleCleanerAuth = async e => {
    e.preventDefault();
    if (!vendorLoginId.trim() || !cleanerUserId.trim() || !cleanerPassword) return alert('Fill all credentials.');
    try {
      const venSnap = await getDoc(doc(db, 'vendors', vendorLoginId.trim()));
      if (!venSnap.exists()) return alert('Vendor ID not found.');
      const unsub = onSnapshot(collection(db, 'vendors', vendorLoginId.trim(), 'cleaners'), snap => {
        const found = snap.docs.map(d => d.data()).find(c => c.phone === cleanerUserId.trim() && c.password === cleanerPassword);
        if (found) { setActiveCleanerData(found); setIsAuthenticated(true); }
        else alert('Invalid cleaner credentials.');
        unsub();
      });
    } catch { alert('Authentication error.'); }
  };

  const handleAddCleaner = async payload => {
    try {
      await setDoc(doc(collection(db, 'vendors', vendorLoginId.trim(), 'cleaners')), { ...payload, createdAt: serverTimestamp() });
      setNotif(`${payload.name} added to staff.`);
    } catch { alert('Failed to add cleaner.'); }
  };

  const handleDeleteCleaner = async id => {
    if (!window.confirm('Remove this staff member?')) return;
    try { await deleteDoc(doc(db, 'vendors', vendorLoginId.trim(), 'cleaners', id)); setNotif('Staff removed.'); }
    catch { alert('Error removing staff.'); }
  };

  const act = async (id, status) => {
    await updateComplaint(id, status === 'COMPLETED' ? { status, cleanerStatus: 'DONE', resolvedAt: new Date() } : { status });
    setNotif('Status updated.');
  };

  const handleAssignCleaner = async cleanerName => {
    if (!assignModalTask) return;
    await updateComplaint(assignModalTask.id, { status: 'ASSIGNED_TO_CLEANER', assignedTo: cleanerName, cleanerStatus: 'ASSIGNED' });
    setNotif(`Assigned to ${cleanerName}`);
    setAssignModalTask(null);
  };

  const handleLogout = () => { setIsAuthenticated(false); setActiveCleanerData(null); setCleanerUserId(''); setCleanerPassword(''); };

  const filteredComplaints = currentVendorData?.stationName
    ? complaints.filter(c => (typeof c.station === 'object' ? c.station?.name : c.station) === currentVendorData.stationName)
    : complaints;

  const FONTS = `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap'); @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/tabler-icons.min.css');`;

  const fieldStyle = { width: '100%', padding: '10px 12px', borderRadius: 6, border: `1px solid ${t.border}`, marginBottom: 14, boxSizing: 'border-box', fontSize: 13, fontFamily: 'IBM Plex Sans,sans-serif', background: t.surface2, color: t.text, outline: 'none' };
  const lblStyle = { display: 'block', fontSize: 10, fontWeight: 600, color: t.text3, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.07em', fontFamily: 'IBM Plex Mono,monospace' };

  // ── Auth Screen ──
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: dark ? '#030810' : '#0A1628', fontFamily: 'IBM Plex Sans,sans-serif' }}>
        <style>{FONTS}</style>

        {/* Theme toggle on auth screen */}
        <button onClick={() => setDark(v => !v)}
          style={{ position: 'fixed', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, padding: '5px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600, fontFamily: 'inherit' }}>
          <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} style={{ fontSize: 14 }} aria-hidden="true" />
          {dark ? 'Light' : 'Dark'}
        </button>

        <div style={{ background: t.surface, padding: '28px 24px', borderRadius: 10, width: 340, border: `1px solid ${t.border}` }}>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${t.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, background: t.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-train" style={{ fontSize: 20, color: t.accent }} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>NagpurRail GRWMS</div>
              <div style={{ fontSize: 10, color: t.text3, fontFamily: 'IBM Plex Mono,monospace' }}>Waste Management System</div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div style={{ display: 'flex', background: t.surface3, borderRadius: 6, padding: 3, marginBottom: 20 }}>
            {[{ key: 'vendor', label: 'Vendor Panel' }, { key: 'cleaner', label: 'Cleaner Panel' }].map(m => (
              <button key={m.key} onClick={() => setLoginMode(m.key)}
                style={{ flex: 1, padding: '6px 4px', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 11, cursor: 'pointer', background: loginMode === m.key ? t.surface : 'transparent', color: loginMode === m.key ? t.text : t.text3, fontFamily: 'inherit', transition: 'all .12s' }}>
                {m.label}
              </button>
            ))}
          </div>

          {loginMode === 'vendor' ? (
            <form onSubmit={handleVendorAuth}>
              <label style={lblStyle}>Vendor Station ID</label>
              <input type="text" value={vendorLoginId} onChange={e => setVendorLoginId(e.target.value)} placeholder="e.g. platform_no_1" style={fieldStyle} required />
              <label style={lblStyle}>Access Password</label>
              <input type="password" value={vendorPassword} onChange={e => setVendorPassword(e.target.value)} placeholder="••••••••" style={{ ...fieldStyle, marginBottom: 20 }} required />
              <button type="submit" style={{ width: '100%', padding: 11, background: t.accent, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <i className="ti ti-login" style={{ fontSize: 16 }} aria-hidden="true" />Authenticate Vendor
              </button>
            </form>
          ) : (
            <form onSubmit={handleCleanerAuth}>
              <label style={lblStyle}>Parent Vendor ID</label>
              <input type="text" value={vendorLoginId} onChange={e => setVendorLoginId(e.target.value)} placeholder="e.g. platform_no_1" style={fieldStyle} required />
              <label style={lblStyle}>Cleaner Login ID</label>
              <input type="text" value={cleanerUserId} onChange={e => setCleanerUserId(e.target.value)} placeholder="e.g. ramesh98" style={fieldStyle} required />
              <label style={lblStyle}>Password</label>
              <input type="password" value={cleanerPassword} onChange={e => setCleanerPassword(e.target.value)} placeholder="••••••" style={{ ...fieldStyle, marginBottom: 20 }} required />
              <button type="submit" style={{ width: '100%', padding: 11, background: t.green, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <i className="ti ti-login" style={{ fontSize: 16 }} aria-hidden="true" />Cleaner Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── Cleaner Dashboard ──
  if (loginMode === 'cleaner' && activeCleanerData) {
    return (
      <div style={{ minHeight: '100vh', background: t.bg, fontFamily: 'IBM Plex Sans,sans-serif' }}>
        <style>{FONTS}</style>
        {/* Cleaner Header */}
        <div style={{ background: t.headerBg, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 50, borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-train" style={{ fontSize: 16, color: '#fff' }} aria-hidden="true" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>NagpurRail GRWMS</span>
          </div>
          <button onClick={() => setDark(v => !v)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'inherit' }}>
            <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} style={{ fontSize: 13 }} aria-hidden="true" />
          </button>
        </div>
        <CleanerDashboard cleanerData={activeCleanerData} vendorId={vendorLoginId} tasks={complaints} onUpdateComplaint={updateComplaint} onLogout={handleLogout} t={t} />
      </div>
    );
  }

  // ── Vendor Control Center ──
  const navItems = [
    { key: 'tasks',    icon: 'ti-clipboard-list', label: 'Tasks Inbox', count: filteredComplaints.filter(c => ['NEW','ACCEPTED','ASSIGNED_TO_CLEANER','CLEANED_BY_FORCE'].includes(c.status)).length },
    { key: 'map',      icon: 'ti-map',             label: 'GIS Map' },
    { key: 'cleaners', icon: 'ti-users',            label: 'Cleaners' },
    { key: 'done',     icon: 'ti-circle-check',    label: 'Completed' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'IBM Plex Sans,sans-serif', background: t.bg, overflow: 'hidden' }}>
      <style>{FONTS}</style>

      {/* Top Header */}
      <TopHeader t={t} dark={dark} onToggleDark={() => setDark(v => !v)} vendorData={currentVendorData} onLogout={handleLogout} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          title="NagpurRail"
          subtitle={currentVendorData?.name || 'Vendor Control'}
          navItems={navItems}
          activeTab={tab}
          onTabChange={setTab}
          footerUser={{ initials: (currentVendorData?.name || 'VA').slice(0, 2).toUpperCase(), name: currentVendorData?.name || 'Vendor Admin', role: currentVendorData?.stationName || 'Platform Head', avatarColor: t.accent }}
        />

        <div style={{ flex: 1, overflowY: 'auto', background: t.bg }}>
          {notif && <NotifBanner msg={notif} type="green" onDone={() => setNotif(null)} />}

          <div style={{ padding: 20, maxWidth: 880, margin: '0 auto', width: '100%' }}>
            {tab === 'tasks' && <TaskInbox tasks={filteredComplaints} onAction={act} onSelect={setSelected} onOpenAssignModal={setAssignModalTask} onViewImage={setActiveLightboxImage} t={t} />}
            {tab === 'map' && <LiveMap complaints={filteredComplaints.filter(c => c.lat && c.lng)} height="350px" onPinClick={setSelected} />}
            {tab === 'cleaners' && <DynamicCleanersTab cleaners={cleaners} onAddCleaner={handleAddCleaner} onDeleteCleaner={handleDeleteCleaner} t={t} />}
            {tab === 'done' && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: t.text, letterSpacing: '-.01em' }}>Completed Logs</div>
                  <div style={{ fontSize: 11, color: t.text3, marginTop: 2 }}>{filteredComplaints.filter(c => c.status === 'COMPLETED').length} resolved tasks</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  {filteredComplaints.filter(c => c.status === 'COMPLETED').map(c => (
                    <ComplaintCard key={c.id} complaint={c} onClick={() => setSelected(c)} onViewImage={setActiveLightboxImage} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Assign Cleaner Modal */}
      {assignModalTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: t.surface, padding: 18, borderRadius: 10, width: 270, border: `1px solid ${t.border}` }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: t.text, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ti ti-user-plus" style={{ fontSize: 16, color: t.accent }} aria-hidden="true" />Select Cleaning Crew
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 200, overflowY: 'auto' }}>
              {cleaners.length === 0
                ? <div style={{ fontSize: 12, color: t.text3, textAlign: 'center', padding: 10 }}>No cleaners available. Go to Cleaners tab.</div>
                : cleaners.map(c => (
                <button key={c.id} onClick={() => handleAssignCleaner(c.name)}
                  style={{ padding: '9px 12px', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit', color: t.text }}>
                  <div style={{ width: 26, height: 26, borderRadius: 4, background: t.accentLight, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace' }}>
                    {c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  {c.name}
                </button>
              ))}
            </div>
            <button onClick={() => setAssignModalTask(null)} style={{ marginTop: 11, width: '100%', padding: 7, background: t.surface3, border: `1px solid ${t.border}`, borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', color: t.text2 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {selected && (
        <VendorComplaintModal complaint={complaints.find(c => c.id === selected?.id) || selected} onClose={() => setSelected(null)} onAction={(id, s) => act(id, s)} onViewImage={setActiveLightboxImage} />
      )}

      <ImageLightbox imageUrl={activeLightboxImage} onClose={() => setActiveLightboxImage(null)} />
    </div>
  );
}