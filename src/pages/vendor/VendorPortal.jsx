import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../App';
import { Sidebar } from '../../components/Sidebar';
import { ComplaintCard, VendorComplaintModal } from '../../components/ComplaintCard';
import { KPI, ProgressBar, NotifBanner } from '../../components/UI';
import LiveMap from '../../components/LiveMap';
import { db } from '../../utils/firebase';
import {
  doc, getDoc, setDoc, deleteDoc, query, where,
  collection, onSnapshot, serverTimestamp,
} from 'firebase/firestore';

/* ── Premium UI Theme Tokens ── */
const LIGHT = {
  accent: '#1C3D8F', accentLight: '#EEF2FF', accentDark: '#0F2660',
  green: '#0D6E52', greenLight: '#E8F5F1',
  red: '#A32D2D', redLight: '#FDEFEF',
  amber: '#854F0B', amberLight: '#FFF8ED',
  text: '#111827', text2: '#374151', text3: '#6B7280', text4: '#9CA3AF',
  surface: '#FFFFFF', surface2: '#F8FAFC', surface3: '#F1F5F9',
  border: '#E2E8F0', border2: '#F1F5F9',
  bg: '#F8FAFC', headerBg: '#1C3D8F', headerText: '#FFFFFF', sidebarBg: '#FFFFFF',
};

const DARK = {
  accent: '#3B82F6', accentLight: '#1E293B', accentDark: '#1D4ED8',
  green: '#10B981', greenLight: '#064E3B',
  red: '#EF4444', redLight: '#451A1A',
  amber: '#F59E0B', amberLight: '#451A03',
  text: '#F8FAFC', text2: '#CBD5E1', text3: '#94A3B8', text4: '#64748B',
  surface: '#0F172A', surface2: '#1E293B', surface3: '#334155',
  border: '#334155', border2: '#1E293B',
  bg: '#020617', headerBg: '#0F172A', headerText: '#F8FAFC', sidebarBg: '#0F172A',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/tabler-icons.min.css');
`;

const getImg = c => c.photoURL || c.image || c.imageUrl || c.photo || c.photoUrl || null;

/* ── Premium Buttons ── */
const Btn = ({ children, onClick, color, outline = false, small = false, type = 'button', icon, t, style }) => {
  const bg = color || t.accent;
  return (
    <button type={type} onClick={onClick} style={{
      padding: small ? '6px 12px' : '10px 16px', 
      borderRadius: '8px',
      fontSize: small ? '11px' : '13px', 
      fontWeight: 600, 
      cursor: 'pointer',
      background: outline ? 'transparent' : bg,
      color: outline ? bg : '#ffffff',
      border: `1px solid ${bg}`,
      display: 'inline-flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '6px',
      fontFamily: 'Plus Jakarta Sans, sans-serif', 
      transition: 'all 0.2s ease',
      boxShadow: outline ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
      ...style
    }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: small ? '13px' : '15px' }} aria-hidden="true" />}
      {children}
    </button>
  );
};

/* ── Lightbox Component ── */
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
      position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.95)', zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'zoom-out', backdropFilter: 'blur(8px)',
    }}>
      <div style={{ position: 'relative', maxWidth: '92vw', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
        <img src={imageUrl} alt="Evidence View" style={{ maxWidth: '100%', maxHeight: '92vh', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', objectFit: 'contain' }} />
      </div>
    </div>
  );
}

/* ── Header Custom UI ── */
function TopHeader({ t, dark, onToggleDark, vendorData, onLogout, onHamburger }) {
  return (
    <header style={{
      background: t.headerBg, padding: '0 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '64px', flexShrink: 0,
      borderBottom: `1px solid ${t.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onHamburger} className="vp-hamburger" style={{
          background: 'transparent', border: 'none', color: dark ? '#fff' : t.text,
          cursor: 'pointer', display: 'none', padding: '4px'
        }}>
          <i className="ti ti-menu-2" style={{ fontSize: '22px' }} />
        </button>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `1px solid ${t.border}` }}>
          <img src="/logo.jpeg" alt="Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: 700, color: dark ? '#fff' : '#ffffff', margin: 0, fontFamily: 'Plus Jakarta Sans' }}>Vendor Management Workspace</h1>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono', margin: '2px 0 0' }}>
            {vendorData?.stationName || 'NAGPUR JUNCTION · CR'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onToggleDark} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
        }}>
          <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} style={{ fontSize: '18px' }} />
        </button>

        {vendorData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: t.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
              {(vendorData.name || 'VD').slice(0, 2).toUpperCase()}
            </div>
            <div className="vp-hide-xs">
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', lineHeight: 1 }}>{vendorData.name || 'Vendor Panel'}</div>
            </div>
          </div>
        )}

        <button onClick={onLogout} style={{
          background: t.red, color: '#fff', border: 'none', borderRadius: '8px',
          padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Plus Jakarta Sans'
        }}>
          <i className="ti ti-logout" style={{ fontSize: '14px' }} />
          <span className="vp-hide-xs">Logout</span>
        </button>
      </div>
    </header>
  );
}

/* ── Modern Status Badges ── */
const STATUS_META = {
  NEW: { label: 'New Ticket', bg: '#FEF3C7', color: '#D97706' },
  ACCEPTED: { label: 'Accepted', bg: '#DBEAFE', color: '#2563EB' },
  ASSIGNED_TO_CLEANER: { label: 'Assigned Crew', bg: '#F3E8FF', color: '#9333EA' },
  CLEANED_BY_FORCE: { label: 'Verification Needed', bg: '#D1FAE5', color: '#059669' },
  COMPLETED: { label: 'Completed', bg: '#D1FAE5', color: '#059669' },
  REJECTED: { label: 'Rejected', bg: '#F1F5F9', color: '#475569' },
  ESCALATED: { label: 'Escalated', bg: '#FEE2E2', color: '#DC2626' },
};

const SBadge = ({ status }) => {
  const m = STATUS_META[status] || { label: status, bg: '#F1F5F9', color: '#475569' };
  return (
    <span style={{
      background: m.bg, color: m.color, padding: '4px 10px', borderRadius: '6px',
      fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center'
    }}>
      {m.label}
    </span>
  );
};

/* ── Premium Crafted Task Card ── */
function TaskCard({ c, onAction, onSelect, onOpenAssignModal, onViewImage, t }) {
  const img = getImg(c);
  const stationName = typeof c.station === 'object' ? c.station?.name : c.station;

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}>
      {img ? (
        <div style={{ position: 'relative', cursor: 'zoom-in', height: '160px', overflow: 'hidden' }} onClick={() => onViewImage(img)}>
          <img src={img} alt="Incident Track" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: '12px', left: '12px' }}><SBadge status={c.status} /></div>
          <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.75)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: '#fff', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i className="ti ti-maximize" /> Maximize
          </div>
        </div>
      ) : (
        <div style={{ height: '70px', background: t.surface2, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: `1px solid ${t.border}` }}>
          <SBadge status={c.status} />
        </div>
      )}

      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '11px', color: t.text3, fontFamily: 'JetBrains Mono', fontWeight: 500 }}>
            {c.customTicketId || c.id || 'N/A'}
          </span>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: t.text, margin: '4px 0 0', fontFamily: 'Plus Jakarta Sans' }}>
            {c.gtype || c.title || 'General Maintenance'}
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: t.surface2, padding: '10px', borderRadius: '8px' }}>
          {stationName && <div style={{ fontSize: '12px', color: t.text2, display: 'flex', alignItems: 'center', gap: '6px' }}><i className="ti ti-train" style={{ color: t.accent }} /> {stationName}</div>}
          {c.area && <div style={{ fontSize: '12px', color: t.text2, display: 'flex', alignItems: 'center', gap: '6px' }}><i className="ti ti-map-pin" style={{ color: t.accent }} /> {c.area}</div>}
          {c.severity && <div style={{ fontSize: '12px', color: t.text2, display: 'flex', alignItems: 'center', gap: '6px' }}><i className="ti ti-alert-circle" style={{ color: c.severity.toLowerCase() === 'critical' ? t.red : t.amber }} /> Priority: <strong style={{ textTransform: 'capitalize' }}>{c.severity}</strong></div>}
        </div>

        {c.status === 'CLEANED_BY_FORCE' && c.cleanerPhoto && (
          <div style={{ border: `1px solid ${t.green}33`, background: `${t.green}08`, borderRadius: '8px', padding: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: t.green, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="ti ti-camera" /> Crew Resolution Proof:</div>
            <img src={c.cleanerPhoto} alt="Proof Node" style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '6px', cursor: 'zoom-in' }} onClick={() => onViewImage(c.cleanerPhoto)} />
          </div>
        )}

        {c.status === 'ASSIGNED_TO_CLEANER' && (
          <div style={{ fontSize: '12px', color: t.amber, fontWeight: 600, background: `${t.amber}10`, padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ti ti-user-check" /> Deployed: {c.assignedTo || 'Staff Operator'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
          {c.status === 'NEW' && <Btn t={t} onClick={() => onAction(c.id, 'ACCEPTED')} color={t.accent} icon="ti-check">Accept Inspection</Btn>}
          {c.status === 'ACCEPTED' && <Btn t={t} onClick={() => onOpenAssignModal(c)} color="#7C3AED" icon="ti-user-plus">Assign Field Crew</Btn>}
          {c.status === 'CLEANED_BY_FORCE' && <Btn t={t} onClick={() => onAction(c.id, 'COMPLETED')} color={t.green} icon="ti-circle-check">Approve &amp; Close Task</Btn>}
          <Btn t={t} onClick={() => onSelect(c)} outline small icon="ti-eye">View Audit Log</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── UI Tasks Box Dashboard ── */
function TaskInbox({ tasks, onAction, onSelect, onOpenAssignModal, onViewImage, t }) {
  const active = tasks.filter(c => !['COMPLETED', 'REJECTED'].includes(c.status));
  const stats = [
    { label: 'Total Node Tracks', value: tasks.length, color: t.text, icon: 'ti-folders' },
    { label: 'Unassigned New', value: tasks.filter(c => c.status === 'NEW').length, color: t.red, icon: 'ti-bell-ringing' },
    { label: 'In Progress Ops', value: tasks.filter(c => ['ACCEPTED', 'ASSIGNED_TO_CLEANER', 'CLEANED_BY_FORCE'].includes(c.status)).length, color: t.accent, icon: 'ti-adjustments' },
    { label: 'Resolved Node', value: tasks.filter(c => c.status === 'COMPLETED').length, color: t.green, icon: 'ti-circle-check' },
  ];

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: t.text, margin: 0, fontFamily: 'Plus Jakarta Sans' }}>Analytics &amp; Operational Logs</h2>
        <p style={{ fontSize: '12px', color: t.text3, margin: '4px 0 0' }}>Real-time spatial verification updates</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {stats.map(k => (
          <div key={k.label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: k.color, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '11px', color: t.text3, marginTop: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.03em' }}>{k.label}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${k.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>
              <i className={`ti ${k.icon}`} style={{ fontSize: '20px' }} />
            </div>
          </div>
        ))}
      </div>

      {active.length === 0 ? (
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <i className="ti ti-shield-check" style={{ fontSize: '44px', color: t.green, display: 'block', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text, margin: 0 }}>All Tracks Cleaned</h3>
          <p style={{ fontSize: '13px', color: t.text3, marginTop: '4px' }}>No pending active alerts recorded for your station area boundary.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px' }}>
          {active.map(c => (
            <TaskCard key={c.id} c={c} onAction={onAction} onSelect={onSelect} onOpenAssignModal={onOpenAssignModal} onViewImage={onViewImage} t={t} />
          ))}
        </div>
      )}
    </>
  );
}

/* ── Dynamic Cleaner Crew Section ── */
function DynamicCleanersTab({ cleaners, onAddCleaner, onDeleteCleaner, t }) {
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [showPassId, setShowPassId] = useState(null);

  const handleSubmit = e => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim() || !cPassword.trim()) return alert('Complete credential sequence fields.');
    onAddCleaner({ name: cName.trim(), phone: cPhone.trim(), password: cPassword.trim() });
    setCName(''); setCPhone(''); setCPassword('');
  };

  const inp = { width: '100%', padding: '10px 14px', fontSize: '13px', borderRadius: '8px', border: `1px solid ${t.border}`, boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans', background: t.surface2, color: t.text, outline: 'none', transition: 'border 0.2s' };
  const lbl = { fontSize: '11px', fontWeight: 600, color: t.text2, display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono' };

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: t.text, margin: 0 }}>Ground Operations Crew</h2>
        <p style={{ fontSize: '12px', color: t.text3, margin: '4px 0 0' }}>Manage credentials and dynamic deployment authentications</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: t.surface, padding: '20px', borderRadius: '12px', border: `1px solid ${t.border}`, marginBottom: '24px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '200px' }}><span style={lbl}>Crew Name</span><input type="text" value={cName} onChange={e => setCName(e.target.value)} placeholder="e.g., Sunil Verma" style={inp} /></div>
        <div style={{ flex: 1, minWidth: '200px' }}><span style={lbl}>Phone / Operator ID</span><input type="text" value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="e.g., sunil99" style={inp} /></div>
        <div style={{ flex: 1, minWidth: '180px' }}><span style={lbl}>Security Key</span><input type="password" value={cPassword} onChange={e => setCPassword(e.target.value)} placeholder="••••••••" style={inp} /></div>
        <Btn t={t} type="submit" color={t.green} icon="ti-user-plus" style={{ height: '42px' }}>Onboard Member</Btn>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {cleaners.length === 0 ? (
          <div style={{ color: t.text3, fontSize: '13px', padding: '16px', background: t.surface, borderRadius: '8px', border: `1px solid ${t.border}` }}>No field staff currently configured.</div>
        ) : cleaners.map(c => (
          <div key={c.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: t.accentLight, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', fontFamily: 'JetBrains Mono' }}>
                {c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: t.text }}>{c.name}</div>
                <div style={{ fontSize: '11px', color: t.text3, fontFamily: 'JetBrains Mono', marginTop: '2px' }}>ID: <span style={{ color: t.accent, fontWeight: 600 }}>{c.phone}</span></div>
                <div style={{ fontSize: '11px', color: t.text3, fontFamily: 'JetBrains Mono' }}>
                  Pass: <span>{showPassId === c.id ? c.password : '••••••••'}</span>
                  <button onClick={() => setShowPassId(showPassId === c.id ? null : c.id)} style={{ marginLeft: '6px', background: 'none', border: 'none', color: t.accent, cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>
                    {showPassId === c.id ? '[Hide]' : '[Reveal]'}
                  </button>
                </div>
              </div>
            </div>
            <button onClick={() => onDeleteCleaner(c.id)} style={{ background: `${t.red}10`, border: 'none', color: t.red, cursor: 'pointer', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} aria-label="Revoke Crew Access">
              <i className="ti ti-trash" style={{ fontSize: '16px' }} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ════════════════════════════════════════
    CORE BOOTSTRAP EXPORT LOGIC
════════════════════════════════════════ */
export default function VendorPortal() {
  const { complaints, updateComplaint } = useApp();

  const [dark, setDark] = useState(false);
  const t = dark ? DARK : LIGHT;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vendorLoginId, setVendorLoginId] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [currentVendorData, setCurrentVendorData] = useState(null);

  const [tab, setTab] = useState('tasks');
  const [selected, setSelected] = useState(null);
  const [notif, setNotif] = useState(null);
  const [assignModalTask, setAssignModalTask] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [cleaners, setCleaners] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendorComplaints, setVendorComplaints] = useState([]);

  const handleTabChange = useCallback(newTab => {
    setTab(newTab);
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !vendorLoginId) return;
    return onSnapshot(
      collection(db, 'vendors', vendorLoginId.trim(), 'cleaners'),
      snap => setCleaners(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [isAuthenticated, vendorLoginId]);

  useEffect(() => {
    if (!currentVendorData) return;
    const q = query(
      collection(db, 'complaints'),
      where('area', '==', currentVendorData.areaName || '')
    );
    return onSnapshot(q, snap => {
      setVendorComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [currentVendorData]);

  const handleVendorAuth = async e => {
    e.preventDefault();
    if (!vendorLoginId.trim() || !vendorPassword) return alert('Input credentials.');
    try {
      const res = await getDoc(doc(db, 'vendors', vendorLoginId.trim()));
      if (res.exists() && res.data().password === vendorPassword) {
        setCurrentVendorData({ id: res.id, ...res.data() });
        setIsAuthenticated(true);
      } else {
        alert('Invalid Secure Node Token matching parameters.');
      }
    } catch { alert('Database network synchronization failure.'); }
  };

  const handleAddCleaner = async payload => {
    try {
      await setDoc(doc(collection(db, 'vendors', vendorLoginId.trim(), 'cleaners')), { ...payload, createdAt: serverTimestamp() });
      setNotif(`Crew member ${payload.name} deployed onto active matrix.`);
    } catch { alert('Write verification failure.'); }
  };

  const handleDeleteCleaner = async id => {
    if (!window.confirm('Revoke access clearance for this token node?')) return;
    try {
      await deleteDoc(doc(db, 'vendors', vendorLoginId.trim(), 'cleaners', id));
      setNotif('Operator wiped from terminal.');
    } catch { alert('Mutation failure.'); }
  };

  const act = async (id, status) => {
    await updateComplaint(id, status === 'COMPLETED'
      ? { status, cleanerStatus: 'DONE', resolvedAt: new Date() }
      : { status }
    );
    setNotif('Spatial node status committed.');
  };

  const handleAssignCleaner = async cleanerName => {
    if (!assignModalTask) return;
    await updateComplaint(assignModalTask.id, {
      status: 'ASSIGNED_TO_CLEANER',
      assignedTo: cleanerName,
      cleanerStatus: 'ASSIGNED',
    });
    setNotif(`Task routed to crew asset [${cleanerName}]`);
    setAssignModalTask(null);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentVendorData(null);
    setVendorLoginId('');
    setVendorPassword('');
  };

  const combinedComplaints = vendorComplaints.length > 0 ? vendorComplaints : complaints;
  const filteredComplaints = combinedComplaints.filter(c => {
    if (!c || !currentVendorData) return false;
    const idMatch = c.vendorId === currentVendorData.id;
    const complaintArea = String(c.area || '').trim().toLowerCase();
    const vendorArea = String(currentVendorData.areaName || '').trim().toLowerCase();
    return idMatch || (complaintArea !== '' && complaintArea === vendorArea);
  });

  const css = `
    ${FONTS}
    * { box-sizing: border-box; }
    body { margin: 0; background: ${t.bg}; font-family: 'Plus Jakarta Sans', sans-serif; }
    @media (max-width: 768px) {
      .vp-hamburger { display: flex !important; }
      .vp-hide-xs { display: none !important; }
      .vp-sidebar {
        position: fixed !important; left: 0; top: 0; bottom: 0; z-index: 1000;
        transform: translateX(-100%); transition: transform .2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 10px 0 30px rgba(0,0,0,0.15);
      }
      .vp-sidebar.open { transform: translateX(0) !important; }
      .vp-sidebar-overlay { position: fixed; inset: 0; background: rgba(2,6,23,0.4); z-index: 999; backdrop-filter: blur(4px); }
    }
  `;

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', background: dark ? '#020617' : '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <style>{css}</style>
        <div style={{ background: '#1C3D8F', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.jpeg" alt="Logo" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>Rail Cleanliness Monitoring Ecosystem</h1>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono', margin: 0 }}>CENTRAL RAILWAY · DIVISION WORKSPACE</p>
            </div>
          </div>
          <button onClick={() => setDark(!dark)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '36px', height: '36px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
            <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} style={{ fontSize: '16px' }} />
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: t.surface, padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: `1px solid ${t.border}`, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: t.text, margin: '0 0 6px 0' }}>Terminal Authentication</h2>
            <p style={{ fontSize: '13px', color: t.text3, margin: '0 0 24px 0' }}>Provide security credentials to check status</p>
            <form onSubmit={handleVendorAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: t.text2, fontFamily: 'JetBrains Mono', display: 'block', marginBottom: '6px' }}>Vendor Secure Token ID</label>
                <input type="text" value={vendorLoginId} onChange={e => setVendorLoginId(e.target.value)} placeholder="Terminal Code Node" style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.surface2, color: t.text, outline: 'none' }} required />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: t.text2, fontFamily: 'JetBrains Mono', display: 'block', marginBottom: '6px' }}>Secret Passkey</label>
                <input type="password" value={vendorPassword} onChange={e => setVendorPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.surface2, color: t.text, outline: 'none' }} required />
              </div>
              <Btn t={t} type="submit" color={t.accent} icon="ti-login" style={{ width: '100%', marginTop: '8px', height: '46px' }}>Verify Identity</Btn>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', background: t.bg, color: t.text }}>
      <style>{css}</style>
      <TopHeader t={t} dark={dark} onToggleDark={() => setDark(!dark)} vendorData={currentVendorData} onLogout={handleLogout} onHamburger={() => setSidebarOpen(true)} />

      {notif && <NotifBanner message={notif} onClose={() => setNotif(null)} t={t} />}

      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {sidebarOpen && <div className="vp-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        <nav className={`vp-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '240px', background: t.sidebarBg, borderRight: `1px solid ${t.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: '8px' }}>
          <button onClick={() => handleTabChange('tasks')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: tab === 'tasks' ? t.accentLight : 'transparent', color: tab === 'tasks' ? t.accent : t.text2, border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <i className="ti ti-activity" style={{ fontSize: '18px' }} /> Tracking Monitor
          </button>
          <button onClick={() => handleTabChange('staff')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: tab === 'staff' ? t.accentLight : 'transparent', color: tab === 'staff' ? t.accent : t.text2, border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <i className="ti ti-users-group" style={{ fontSize: '18px' }} /> Ground Staff Crew
          </button>
        </nav>

        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {tab === 'tasks' ? (
            <TaskInbox tasks={filteredComplaints} onAction={act} onSelect={setSelected} onOpenAssignModal={setAssignModalTask} onViewImage={setLightboxImage} t={t} />
          ) : (
            <DynamicCleanersTab cleaners={cleaners} onAddCleaner={handleAddCleaner} onDeleteCleaner={handleDeleteCleaner} t={t} />
          )}
        </main>
      </div>

      {selected && <VendorComplaintModal complaint={selected} onClose={() => setSelected(null)} t={t} />}

      {assignModalTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.4)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setAssignModalTask(null)}>
          <div style={{ background: t.surface, padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '420px', border: `1px solid ${t.border}`, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: t.text }}>Select Deployment Crew Asset</h3>
            <p style={{ fontSize: '13px', color: t.text3, marginBottom: '16px' }}>Route this track ticket to an on-duty node</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '20px' }}>
              {cleaners.length === 0 ? (
                <p style={{ fontSize: '13px', color: t.text3, padding: '12px', background: t.surface2, borderRadius: '6px' }}>No workers mapped. Initialize staff setup under the Ground Staff tab.</p>
              ) : cleaners.map(c => (
                <button key={c.id} onClick={() => handleAssignCleaner(c.name)} style={{ width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '12px', textAlign: 'left', cursor: 'pointer', color: t.text, display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s' }}>
                  <i className="ti ti-user-bolt" style={{ color: t.accent, fontSize: '16px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: t.text3, fontFamily: 'JetBrains Mono' }}>ID: {c.phone}</div>
                  </div>
                </button>
              ))}
            </div>
            <Btn t={t} outline onClick={() => setAssignModalTask(null)} style={{ width: '100%' }}>Abort Routing</Btn>
          </div>
        </div>
      )}

      <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}