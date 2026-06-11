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

/* ── Theme Tokens ── */
const LIGHT = {
  accent:'#1C3D8F', accentLight:'#EEF2FF', accentDark:'#0F2660',
  green:'#0D6E52',  greenLight:'#E8F5F1',
  red:'#A32D2D',    redLight:'#FDEFEF',
  amber:'#854F0B',  amberLight:'#FFF8ED',
  text:'#111827', text2:'#374151', text3:'#6B7280', text4:'#9CA3AF',
  surface:'#FFFFFF', surface2:'#F7F8FA', surface3:'#ECEEF2',
  border:'#D4D8E2',  border2:'#E8EAF0',
  bg:'#F0F1F3', headerBg:'#1C3D8F', headerText:'#FFFFFF', sidebarBg:'#FFFFFF',
};
const DARK = {
  accent:'#4F7FE8', accentLight:'#1A2A4A', accentDark:'#2250C4',
  green:'#10B981',  greenLight:'#042F22',
  red:'#F87171',    redLight:'#2D1515',
  amber:'#FBBF24',  amberLight:'#2D2010',
  text:'#F1F5F9', text2:'#CBD5E1', text3:'#94A3B8', text4:'#64748B',
  surface:'#0F172A', surface2:'#1E293B', surface3:'#263347',
  border:'#2D3F55',  border2:'#1E2D40',
  bg:'#080F1E', headerBg:'#060D1A', headerText:'#F1F5F9', sidebarBg:'#0F172A',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/tabler-icons.min.css');
`;

/* ── helper — pick first truthy image field ── */
const getImg = c => c.photoURL || c.image || c.imageUrl || c.photo || c.photoUrl || null;

/* ── Btn ── */
const Btn = ({ children, onClick, color, outline=false, small=false, type='button', icon, t }) => {
  const bg = color || t.accent;
  return (
    <button type={type} onClick={onClick} style={{
      padding: small ? '5px 11px' : '8px 14px', borderRadius:5,
      fontSize: small ? 11 : 12, fontWeight:600, cursor:'pointer',
      background: outline ? 'transparent' : bg,
      color: outline ? bg : '#fff',
      border: outline ? `1px solid ${bg}` : 'none',
      display:'inline-flex', alignItems:'center', gap:5,
      fontFamily:'IBM Plex Sans, sans-serif', letterSpacing:'.02em',
    }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: small ? 12 : 14 }} aria-hidden="true" />}
      {children}
    </button>
  );
};

/* ── Image Lightbox ── */
function ImageLightbox({ imageUrl, onClose }) {
  useEffect(() => {
    if (!imageUrl) return;
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, background:'rgba(4,8,20,0.96)', zIndex:99999,
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'zoom-out', backdropFilter:'blur(4px)',
      }}
    >
      <div
        style={{ position:'relative', maxWidth:'96vw', maxHeight:'96vh', display:'flex', flexDirection:'column', alignItems:'center' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'0 0 10px', gap:10 }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontFamily:'IBM Plex Mono,monospace', letterSpacing:'.04em', textTransform:'uppercase' }}>
            Evidence Photo
          </span>
          <div style={{ display:'flex', gap:8 }}>
            <a href={imageUrl} download target="_blank" rel="noreferrer"
              style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', cursor:'pointer', width:32, height:32, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' }}
              aria-label="Download"
            >
              <i className="ti ti-download" style={{ fontSize:14 }} aria-hidden="true" />
            </a>
            <button onClick={onClose}
              style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', cursor:'pointer', width:32, height:32, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center' }}
              aria-label="Close"
            >
              <i className="ti ti-x" style={{ fontSize:14 }} aria-hidden="true" />
            </button>
          </div>
        </div>
        <img src={imageUrl} alt="Evidence" style={{ maxWidth:'100%', maxHeight:'calc(96vh - 60px)', borderRadius:8, objectFit:'contain', display:'block' }} />
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:8, fontFamily:'IBM Plex Mono,monospace' }}>
          Click outside or press ESC to close
        </div>
      </div>
    </div>
  );
}

/* ── Top Header Bar ── */
function TopHeader({ t, dark, onToggleDark, vendorData, onLogout, onHamburger }) {
  return (
    <div style={{
      background: t.headerBg, padding:'0 16px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      height:52, flexShrink:0,
      borderBottom:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)'}`,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={onHamburger} className="vp-hamburger"
          style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:5, width:34, height:34, cursor:'pointer', display:'none', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}
          aria-label="Toggle menu"
        >
          <i className="ti ti-menu-2" style={{ fontSize:16 }} aria-hidden="true" />
        </button>
        <div style={{ width:30, height:30, borderRadius:5, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          <img src="/logo.jpeg" alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#fff', letterSpacing:'-.01em', lineHeight:1 }}>Vendor Portal</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontFamily:'IBM Plex Mono,monospace', letterSpacing:'.05em', marginTop:2 }}>
            {vendorData?.stationName || 'NAGPUR JUNCTION · CENTRAL RAILWAY'}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={onToggleDark}
          style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:5, padding:'5px 9px', cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:'rgba(255,255,255,0.8)', fontSize:10, fontWeight:600, fontFamily:'IBM Plex Sans,sans-serif' }}
          aria-label="Toggle theme"
        >
          <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} style={{ fontSize:14 }} aria-hidden="true" />
          <span className="vp-hide-xs">{dark ? 'Light' : 'Dark'}</span>
        </button>
        {vendorData && (
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 8px', background:'rgba(255,255,255,0.08)', borderRadius:5, border:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width:24, height:24, borderRadius:4, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff', fontFamily:'IBM Plex Mono,monospace' }}>
              {(vendorData.name || 'VA').slice(0, 2).toUpperCase()}
            </div>
            <div className="vp-hide-xs">
              <div style={{ fontSize:11, fontWeight:600, color:'#fff', lineHeight:1 }}>{vendorData.name || 'Vendor Admin'}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontFamily:'IBM Plex Mono,monospace' }}>Vendor</div>
            </div>
          </div>
        )}
        <button onClick={onLogout}
          style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:5, padding:'5px 9px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, color:'rgba(255,255,255,0.7)', fontSize:10, fontWeight:600, fontFamily:'IBM Plex Sans,sans-serif' }}>
          <i className="ti ti-logout" style={{ fontSize:13 }} aria-hidden="true" />
          <span className="vp-hide-xs">Exit</span>
        </button>
      </div>
    </div>
  );
}

/* ── Status badges ── */
const STATUS_META = {
  NEW:                 { label:'New',             bg:'#FFF3E0', color:'#E65100' },
  ACCEPTED:            { label:'Accepted',        bg:'#E3F2FD', color:'#1565C0' },
  ASSIGNED_TO_CLEANER:{ label:'Assigned',        bg:'#EDE7F6', color:'#4527A0' },
  CLEANED_BY_FORCE:   { label:'Awaiting Verify', bg:'#E8F5E9', color:'#2E7D32' },
  COMPLETED:          { label:'Completed',       bg:'#E8F5E9', color:'#2E7D32' },
  REJECTED:           { label:'Rejected',        bg:'#ECEFF1', color:'#546E7A' },
  ESCALATED:          { label:'Escalated',       bg:'#FFEBEE', color:'#B71C1C' },
};
const SBadge = ({ status }) => {
  const m = STATUS_META[status] || { label:status, bg:'#eee', color:'#333' };
  return (
    <span style={{ background:m.bg, color:m.color, padding:'3px 9px', borderRadius:99, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>
      {m.label}
    </span>
  );
};

/* ── Task Card ── */
function TaskCard({ c, onAction, onSelect, onOpenAssignModal, onViewImage, t }) {
  const img = getImg(c);
  const stationName = typeof c.station === 'object' ? c.station?.name : c.station;

  return (
    <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:10, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {img ? (
        <div style={{ position:'relative', cursor:'zoom-in', flexShrink:0 }} onClick={() => onViewImage(img)}>
          <img src={img} alt="Report" style={{ width:'100%', height:140, objectFit:'cover', display:'block' }} />
          <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.55)', borderRadius:5, padding:'3px 7px', fontSize:10, color:'#fff', display:'flex', alignItems:'center', gap:4, pointerEvents:'none' }}>
            <i className="ti ti-zoom-in" style={{ fontSize:11 }} aria-hidden="true" /> View Full
          </div>
          <div style={{ position:'absolute', top:8, left:8, pointerEvents:'none' }}>
            <SBadge status={c.status} />
          </div>
        </div>
      ) : (
        <div style={{ height:60, background:t.surface2, display:'flex', alignItems:'center', justifyContent:'center', borderBottom:`1px solid ${t.border}` }}>
          <SBadge status={c.status} />
        </div>
      )}

      <div style={{ padding:'11px 13px', flex:1, display:'flex', flexDirection:'column', gap:8 }}>
        <div>
          <div style={{ fontSize:10, color:t.text3, fontFamily:'IBM Plex Mono,monospace', marginBottom:2 }}>{c.customTicketId || c.id}</div>
          <div style={{ fontSize:13, fontWeight:700, color:t.text, lineHeight:1.3 }}>{c.gtype || c.title || 'Waste Report'}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {stationName && <div style={{ fontSize:11, color:t.text3, display:'flex', alignItems:'center', gap:5 }}><i className="ti ti-building-store" style={{ fontSize:12 }} aria-hidden="true" />{stationName}</div>}
          {c.area      && <div style={{ fontSize:11, color:t.text3, display:'flex', alignItems:'center', gap:5 }}><i className="ti ti-map-pin"        style={{ fontSize:12 }} aria-hidden="true" />{c.area}</div>}
          {c.severity  && <div style={{ fontSize:11, color:t.text3, display:'flex', alignItems:'center', gap:5 }}><i className="ti ti-alert-triangle"  style={{ fontSize:12 }} aria-hidden="true" />Severity: <strong style={{ color:t.text2 }}>{c.severity}</strong></div>}
        </div>

        {c.status === 'CLEANED_BY_FORCE' && c.cleanerPhoto && (
          <div style={{ background:t.greenLight, borderRadius:7, padding:8, border:`1px solid rgba(13,110,82,.2)` }}>
            <div style={{ fontSize:10, fontWeight:700, color:t.green, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Cleaner Proof Photo</div>
            <div style={{ cursor:'zoom-in', borderRadius:5, overflow:'hidden' }} onClick={() => onViewImage(c.cleanerPhoto)}>
              <img src={c.cleanerPhoto} alt="Proof" style={{ width:'100%', height:80, objectFit:'cover', display:'block' }} />
            </div>
          </div>
        )}

        {c.status === 'ASSIGNED_TO_CLEANER' && (
          <div style={{ fontSize:11, color:t.amber, fontWeight:600, background:t.amberLight, padding:'6px 10px', borderRadius:5, display:'flex', alignItems:'center', gap:5 }}>
            <i className="ti ti-user-check" style={{ fontSize:13 }} aria-hidden="true" />
            On Duty: {c.assignedTo || 'Cleaner'}
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:'auto' }}>
          {c.status === 'NEW'              && <Btn t={t} onClick={e=>{e.stopPropagation();onAction(c.id,'ACCEPTED');}}            icon="ti-circle-check">Accept Task</Btn>}
          {c.status === 'ACCEPTED'         && <Btn t={t} onClick={e=>{e.stopPropagation();onOpenAssignModal(c);}} color="#4527A0" icon="ti-user-plus">Assign Cleaner</Btn>}
          {c.status === 'CLEANED_BY_FORCE' && <Btn t={t} onClick={e=>{e.stopPropagation();onAction(c.id,'COMPLETED');}}           color={t.green} icon="ti-check">Complete &amp; Close</Btn>}
          <Btn t={t} onClick={e=>{e.stopPropagation();onSelect(c);}} outline small icon="ti-eye">View Details</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Done Card ── */
function DoneCard({ c, onSelect, onViewImage, t }) {
  const img = getImg(c);
  const stationName = typeof c.station === 'object' ? c.station?.name : c.station;
  return (
    <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:10, overflow:'hidden', cursor:'pointer' }} onClick={() => onSelect(c)}>
      {img ? (
        <div style={{ position:'relative' }} onClick={e=>{e.stopPropagation();onViewImage(img);}}>
          <img src={img} alt="Report" style={{ width:'100%', height:120, objectFit:'cover', display:'block', cursor:'zoom-in' }} />
          <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.55)', borderRadius:5, padding:'3px 7px', fontSize:10, color:'#fff', display:'flex', alignItems:'center', gap:4 }}>
            <i className="ti ti-zoom-in" style={{ fontSize:11 }} aria-hidden="true" /> View
          </div>
        </div>
      ) : (
        <div style={{ height:48, background:t.surface2, borderBottom:`1px solid ${t.border}` }} />
      )}
      <div style={{ padding:'10px 12px' }}>
        <div style={{ fontSize:10, color:t.text3, fontFamily:'IBM Plex Mono,monospace', marginBottom:2 }}>{c.customTicketId || c.id}</div>
        <div style={{ fontSize:13, fontWeight:700, color:t.text, marginBottom:4 }}>{c.gtype || c.title || 'Waste Report'}</div>
        <div style={{ fontSize:11, color:t.text3 }}>{c.area}{stationName ? ` · ${stationName}` : ''}</div>
        {c.cleanerPhoto && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:10, color:t.green, fontWeight:600, marginBottom:4 }}>After-clean photo:</div>
            <img src={c.cleanerPhoto} alt="After" style={{ width:'100%', height:70, objectFit:'cover', borderRadius:5, cursor:'zoom-in', display:'block' }}
              onClick={e=>{e.stopPropagation();onViewImage(c.cleanerPhoto);}} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Task Inbox ── */
function TaskInbox({ tasks, onAction, onSelect, onOpenAssignModal, onViewImage, t }) {
  const active = tasks.filter(c => !['COMPLETED','REJECTED'].includes(c.status));
  const stats  = [
    { label:'Total',  value:tasks.length,                                                                                color:t.text   },
    { label:'New',    value:tasks.filter(c=>c.status==='NEW').length,                                                                color:t.red    },
    { label:'Active', value:tasks.filter(c=>['ACCEPTED','ASSIGNED_TO_CLEANER','CLEANED_BY_FORCE'].includes(c.status)).length, color:t.accent },
    { label:'Done',   value:tasks.filter(c=>c.status==='COMPLETED').length,                                                          color:t.green  },
  ];
  return (
    <>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:17, fontWeight:700, color:t.text, letterSpacing:'-.01em' }}>Tasks Workspace</div>
        <div style={{ fontSize:11, color:t.text3, marginTop:2, fontFamily:'IBM Plex Mono,monospace' }}>Nagpur Junction — Live Nodes</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:8, marginBottom:16 }}>
        {stats.map(k => (
          <div key={k.label} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:7, padding:'10px 14px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:'IBM Plex Mono,monospace', lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:10, color:t.text3, marginTop:4, textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }}>{k.label}</div>
          </div>
        ))}
      </div>
      {active.length === 0 ? (
        <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:8, padding:32, textAlign:'center', color:t.text3 }}>
          <i className="ti ti-circle-check" style={{ fontSize:28, display:'block', marginBottom:8, color:t.green }} aria-hidden="true" />
          No pending cleaning tracks available.
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:12 }}>
          {active.map(c => (
            <TaskCard key={c.id} c={c} onAction={onAction} onSelect={onSelect} onOpenAssignModal={onOpenAssignModal} onViewImage={onViewImage} t={t} />
          ))}
        </div>
      )}
    </>
  );
}

/* ── Cleaner Staff Management ── */
function DynamicCleanersTab({ cleaners, onAddCleaner, onDeleteCleaner, t }) {
  const [cName,     setCName]     = useState('');
  const [cPhone,    setCPhone]    = useState('');
  const [cPassword, setCPassword] = useState('');
  const [showPassId,setShowPassId]= useState(null);

  const handleSubmit = e => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim() || !cPassword.trim()) return alert('Please fill all fields.');
    onAddCleaner({ name:cName.trim(), phone:cPhone.trim(), password:cPassword.trim() });
    setCName(''); setCPhone(''); setCPassword('');
  };

  const inp = { width:'100%', padding:'8px 10px', fontSize:12, borderRadius:5, border:`1px solid ${t.border}`, boxSizing:'border-box', fontFamily:'IBM Plex Sans,sans-serif', background:t.surface2, color:t.text, outline:'none' };
  const lbl = { fontSize:10, fontWeight:600, color:t.text3, display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.06em', fontFamily:'IBM Plex Mono,monospace' };

  return (
    <>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:17, fontWeight:700, color:t.text, letterSpacing:'-.01em' }}>Cleaner Staff</div>
        <div style={{ fontSize:11, color:t.text3, marginTop:2 }}>Manage ground deployment crews</div>
      </div>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexWrap:'wrap', gap:10, background:t.surface, padding:14, borderRadius:8, border:`1px solid ${t.border}`, marginBottom:18, alignItems:'flex-end' }}>
        <div style={{ flex:1, minWidth:140 }}><span style={lbl}>Cleaner Name</span><input type="text" value={cName} onChange={e=>setCName(e.target.value)} placeholder="e.g. Ramesh Kumar" style={inp} /></div>
        <div style={{ flex:1, minWidth:140 }}><span style={lbl}>Phone / Login ID</span><input type="text" value={cPhone} onChange={e=>setCPhone(e.target.value)} placeholder="e.g. ramesh98" style={inp} /></div>
        <div style={{ flex:1, minWidth:110 }}><span style={lbl}>Password</span><input type="password" value={cPassword} onChange={e=>setCPassword(e.target.value)} placeholder="••••••" style={inp} /></div>
        <Btn t={t} type="submit" color={t.green} icon="ti-user-plus">Add Cleaner</Btn>
      </form>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:12 }}>
        {cleaners.length === 0 ? (
          <div style={{ color:t.text3, fontSize:12 }}>No staff onboarded yet.</div>
        ) : cleaners.map(c => (
          <div key={c.id} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:8, padding:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                <div style={{ width:30, height:30, borderRadius:5, background:t.accentLight, color:t.accent, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, fontFamily:'IBM Plex Mono,monospace' }}>
                  {c.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div style={{ fontWeight:600, fontSize:13, color:t.text }}>{c.name}</div>
              </div>
              <div style={{ fontSize:10, color:t.text3, fontFamily:'IBM Plex Mono,monospace' }}>ID: <strong style={{ color:t.accent }}>{c.phone}</strong></div>
              <div style={{ fontSize:10, color:t.text3, marginTop:2, fontFamily:'IBM Plex Mono,monospace' }}>
                Pass: <strong>{showPassId === c.id ? c.password : '••••••'}</strong>
                <span onClick={()=>setShowPassId(showPassId===c.id?null:c.id)} style={{ marginLeft:5, color:t.accent, cursor:'pointer', fontSize:9, textTransform:'uppercase', letterSpacing:'.04em' }}>
                  [{showPassId === c.id ? 'Hide' : 'Show'}]
                </span>
              </div>
            </div>
            <button onClick={()=>onDeleteCleaner(c.id)} style={{ background:t.redLight, border:`1px solid rgba(163,45,45,.2)`, color:t.red, cursor:'pointer', width:32, height:32, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center' }} aria-label={`Remove ${c.name}`}>
              <i className="ti ti-trash" style={{ fontSize:14 }} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ════════════════════════════════════════
    MAIN VENDOR PORTAL
════════════════════════════════════════ */
export default function VendorPortal() {
  const { complaints, updateComplaint } = useApp();

  const [dark, setDark] = useState(false);
  const t = dark ? DARK : LIGHT;

  const [isAuthenticated, setIsAuthenticated]     = useState(false);
  const [vendorLoginId,   setVendorLoginId]       = useState('');
  const [vendorPassword,  setVendorPassword]      = useState('');
  const [currentVendorData, setCurrentVendorData] = useState(null);

  const [tab,               setTab]              = useState('tasks');
  const [selected,          setSelected]         = useState(null);
  const [notif,             setNotif]            = useState(null);
  const [assignModalTask,   setAssignModalTask]  = useState(null);
  const [lightboxImage,     setLightboxImage]    = useState(null);
  const [cleaners,          setCleaners]         = useState([]);
  const [sidebarOpen,       setSidebarOpen]      = useState(false);
  const [vendorComplaints,  setVendorComplaints] = useState([]);

  const handleTabChange = useCallback(newTab => {
    setTab(newTab);
    setSidebarOpen(false);
  }, []);

  /* ── Cleaners realtime listener ── */
  useEffect(() => {
    if (!isAuthenticated || !vendorLoginId) return;
    return onSnapshot(
      collection(db, 'vendors', vendorLoginId.trim(), 'cleaners'),
      snap => setCleaners(snap.docs.map(d => ({ id:d.id, ...d.data() })))
    );
  }, [isAuthenticated, vendorLoginId]);

  /* ── Vendor-area complaints realtime listener ── */
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
    if (!vendorLoginId.trim() || !vendorPassword) return alert('Fill all fields.');
    try {
      const res = await getDoc(doc(db, 'vendors', vendorLoginId.trim()));
      if (res.exists() && res.data().password === vendorPassword) {
        setCurrentVendorData({ id: res.id, ...res.data() });
        setIsAuthenticated(true);
      } else {
        alert('Invalid Vendor Credentials.');
      }
    } catch { alert('Database connection error.'); }
  };

  const handleAddCleaner = async payload => {
    try {
      await setDoc(doc(collection(db, 'vendors', vendorLoginId.trim(), 'cleaners')), { ...payload, createdAt:serverTimestamp() });
      setNotif(`${payload.name} added to staff.`);
    } catch { alert('Failed to add cleaner.'); }
  };

  const handleDeleteCleaner = async id => {
    if (!window.confirm('Remove this staff member?')) return;
    try {
      await deleteDoc(doc(db, 'vendors', vendorLoginId.trim(), 'cleaners', id));
      setNotif('Staff removed.');
    } catch { alert('Error removing staff.'); }
  };

  const act = async (id, status) => {
    await updateComplaint(id, status === 'COMPLETED'
      ? { status, cleanerStatus:'DONE', resolvedAt:new Date() }
      : { status }
    );
    setNotif('Status updated.');
  };

  const handleAssignCleaner = async cleanerName => {
    if (!assignModalTask) return;
    await updateComplaint(assignModalTask.id, {
      status: 'ASSIGNED_TO_CLEANER',
      assignedTo: cleanerName,
      cleanerStatus: 'ASSIGNED',
    });
    setNotif(`Assigned to ${cleanerName}`);
    setAssignModalTask(null);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentVendorData(null);
    setVendorLoginId('');
    setVendorPassword('');
  };

  /* ── Merge & filter complaints ── */
  const combinedComplaints = vendorComplaints.length > 0 ? vendorComplaints : complaints;

  const filteredComplaints = combinedComplaints.filter(c => {
    if (!c || !currentVendorData) return false;
    const idMatch = c.vendorId === currentVendorData.id;
    const complaintArea = String(c.area || '').trim().toLowerCase();
    const vendorArea    = String(currentVendorData.areaName || '').trim().toLowerCase();
    const areaMatch     = complaintArea !== '' && complaintArea === vendorArea;
    return idMatch || areaMatch;
  });

  /* ── Responsive CSS ── */
  const css = `
    ${FONTS}
    * { box-sizing: border-box; }
    .vp-hamburger { display: none !important; }
    .vp-sidebar-overlay { display: none; }
    .vp-sidebar { height: 100%; }
    @media (max-width: 768px) {
      .vp-hamburger { display: flex !important; }
      .vp-hide-xs  { display: none !important; }
      .vp-sidebar {
        position: fixed !important;
        left: 0; top: 0; bottom: 0;
        height: 100% !important;
        z-index: 1000;
        transform: translateX(-100%);
        transition: transform .25s ease;
        box-shadow: 4px 0 24px rgba(0,0,0,.3);
      }
      .vp-sidebar.open { transform: translateX(0) !important; }
      .vp-sidebar-overlay {
        display: block;
        position: fixed; inset: 0;
        background: rgba(0,0,0,.45);
        z-index: 999;
      }
    }
  `;

  /* ══════════════════════════════════════
      LOGIN SCREEN
     ══════════════════════════════════════ */
  if (!isAuthenticated) {
    const loginInpStyle = {
      width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 6,
      border: `1px solid ${t.border}`, background: t.surface2, color: t.text,
      fontFamily: 'IBM Plex Sans, sans-serif', outline: 'none', marginTop: 5, marginBottom: 15
    };
    const loginLblStyle = {
      display: 'block', fontSize: 10, fontWeight: 600, color: t.text3,
      textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'IBM Plex Mono, monospace'
    };

    return (
      <div style={{ display:'flex', minHeight:'100vh', flexDirection:'column', background: dark ? '#030810' : '#F0F1F3', fontFamily:'IBM Plex Sans,sans-serif' }}>
        <style>{css}</style>

        {/* header */}
        <div style={{ background:'#1C3D8F', padding:'0 16px', display:'flex', alignItems:'center', justifyContent:'space-between', height:52, flexShrink:0, borderBottom:'1px solid rgba(0,0,0,0.15)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:5, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
              <img src="/logo.jpeg" alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', letterSpacing:'-.01em', lineHeight:1 }}>Railway Material Management System</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.45)', fontFamily:'IBM Plex Mono,monospace', letterSpacing:'.05em', marginTop:2 }}>CENTRAL RAILWAY · NAGPUR DIVISION</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={()=>setDark(v=>!v)}
              style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:5, padding:'5px 9px', cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:'rgba(255,255,255,0.8)', fontSize:10, fontWeight:600, fontFamily:'IBM Plex Sans,sans-serif' }}
              aria-label="Toggle theme">
              <i className={`ti ${dark?'ti-sun':'ti-moon'}`} style={{ fontSize:14 }} aria-hidden="true" />
              <span className="vp-hide-xs">{dark?'Light':'Dark'}</span>
            </button>
            <div style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:5, padding:'5px 11px', color:'rgba(255,255,255,0.85)', fontSize:10, fontWeight:700, fontFamily:'IBM Plex Sans,sans-serif', letterSpacing:'.04em', textTransform:'uppercase' }}>
              VENDOR PORTAL
            </div>
          </div>
        </div>

        {/* login card */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
          <div style={{ background:t.surface, padding:'28px 24px', borderRadius:10, width:'min(360px, 100%)', border:`1px solid ${t.border}`, boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${t.border}` }}>
              <div style={{ width:48, height:48, borderRadius:8, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:t.surface2, border:`1px solid ${t.border}`, flexShrink:0 }}>
                <img src="/logo.jpeg" alt="Logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:t.text, lineHeight:1.2 }}>Vendor Login</div>
                <div style={{ fontSize:10, color:t.text3, fontFamily:'IBM Plex Mono,monospace', marginTop:3, letterSpacing:'.04em' }}>NAGPUR JUNCTION · CENTRAL RAILWAY</div>
              </div>
            </div>

            <form onSubmit={handleVendorAuth}>
              <label style={loginLblStyle}>Vendor Login ID</label>
              <input type="text" value={vendorLoginId} onChange={e=>setVendorLoginId(e.target.value)} placeholder="Enter ID" style={loginInpStyle} required />

              <label style={loginLblStyle}>Password</label>
              <input type="password" value={vendorPassword} onChange={e=>setVendorPassword(e.target.value)} placeholder="••••••••" style={loginInpStyle} required />

              <div style={{ marginTop:4 }}>
                <button type="submit" style={{ width:'100%', padding:11, background:'#1C3D8F', color:'#fff', border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7, letterSpacing:'.01em' }}>
                  <i className="ti ti-login" style={{ fontSize:16 }} aria-hidden="true" />
                  Sign In to Portal
                </button>
              </div>
            </form>

            <div style={{ marginTop:14, padding:'9px 12px', background:t.surface2, borderRadius:6, border:`1px solid ${t.border}`, display:'flex', alignItems:'flex-start', gap:8 }}>
              <i className="ti ti-info-circle" style={{ fontSize:14, color:t.accent, flexShrink:0, marginTop:1 }} aria-hidden="true" />
              <div style={{ fontSize:11, color:t.text3, lineHeight:1.5 }}>Credentials are issued by your department supervisor. Contact them if you need access.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════
      AUTHENTICATED DASHBOARD — Doc2 UI
     ══════════════════════════════════════ */
  const navItems = [
    { key:'tasks',    label:'Tasks Inbox', count: filteredComplaints.filter(c=>['NEW','ACCEPTED','ASSIGNED_TO_CLEANER','CLEANED_BY_FORCE'].includes(c.status)).length },
    { key:'map',      label:'GIS Map'     },
    { key:'cleaners', label:'Cleaners'    },
    { key:'done',     label:'Completed'   },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:'IBM Plex Sans,sans-serif', background:t.bg, overflow:'hidden' }}>
      <style>{css}</style>

      <TopHeader t={t} dark={dark} onToggleDark={() => setDark(v=>!v)} vendorData={currentVendorData} onLogout={handleLogout} onHamburger={() => setSidebarOpen(v=>!v)} />

      <div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden', position:'relative' }}>
        {sidebarOpen && <div className="vp-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        <div
          className={`vp-sidebar${sidebarOpen ? ' open' : ''}`}
          style={{ flexShrink:0, width:260, height:'100%', display:'flex', flexDirection:'column', background:t.sidebarBg, borderRight:`1px solid ${t.border}` }}
        >
          <Sidebar
            title="Vendor Portal"
            subtitle={currentVendorData?.name || 'Vendor Control'}
            navItems={navItems}
            activeTab={tab}
            onTabChange={handleTabChange}
            t={t}
            dark={dark}
            onToggleDark={() => setDark(v=>!v)}
            footerUser={{
              initials:    (currentVendorData?.name || 'VA').slice(0, 2).toUpperCase(),
              name:        currentVendorData?.name || 'Vendor Admin',
              role:        currentVendorData?.stationName || 'Platform Head',
              avatarColor: t.accent,
            }}
          />
        </div>

        {/* main content */}
        <div style={{ flex:1, overflowY:'auto', background:t.bg }}>
          {notif && <NotifBanner msg={notif} type="green" onDone={() => setNotif(null)} />}
          <div style={{ padding:20, maxWidth:880, margin:'0 auto', width:'100%', boxSizing:'border-box' }}>

            {tab === 'tasks' && (
              <TaskInbox tasks={filteredComplaints} onAction={act} onSelect={setSelected} onOpenAssignModal={setAssignModalTask} onViewImage={setLightboxImage} t={t} />
            )}

            {tab === 'map' && (
              <>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:17, fontWeight:700, color:t.text, letterSpacing:'-.01em' }}>GIS Live Map</div>
                  <div style={{ fontSize:11, color:t.text3, marginTop:2 }}>Active complaint pins for your station</div>
                </div>
                <LiveMap complaints={filteredComplaints.filter(c => c.lat && c.lng)} height="400px" onPinClick={setSelected} />
              </>
            )}

            {tab === 'cleaners' && (
              <DynamicCleanersTab cleaners={cleaners} onAddCleaner={handleAddCleaner} onDeleteCleaner={handleDeleteCleaner} t={t} />
            )}

            {tab === 'done' && (
              <>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:17, fontWeight:700, color:t.text, letterSpacing:'-.01em' }}>Completed Logs</div>
                  <div style={{ fontSize:11, color:t.text3, marginTop:2 }}>{filteredComplaints.filter(c=>c.status==='COMPLETED').length} resolved tasks</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:12 }}>
                  {filteredComplaints.filter(c=>c.status==='COMPLETED').map(c => (
                    <DoneCard key={c.id} c={c} onSelect={setSelected} onViewImage={setLightboxImage} t={t} />
                  ))}
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── Assign Cleaner Modal ── */}
      {assignModalTask && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'0 16px' }}>
          <div style={{ background:t.surface, padding:18, borderRadius:10, width:'min(270px,100%)', border:`1px solid ${t.border}` }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:12, color:t.text, display:'flex', alignItems:'center', gap:7 }}>
              <i className="ti ti-user-plus" style={{ fontSize:16, color:t.accent }} aria-hidden="true" />
              Select Cleaning Crew
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:7, maxHeight:200, overflowY:'auto' }}>
              {cleaners.length === 0 ? (
                <div style={{ fontSize:12, color:t.text3, textAlign:'center', padding:10 }}>No cleaners available. Go to Cleaners tab.</div>
              ) : cleaners.map(c => (
                <button key={c.id} onClick={() => handleAssignCleaner(c.name)}
                  style={{ padding:'9px 12px', background:t.surface2, border:`1px solid ${t.border}`, borderRadius:6, cursor:'pointer', textAlign:'left', fontWeight:600, fontSize:12, display:'flex', alignItems:'center', gap:7, fontFamily:'inherit', color:t.text }}>
                  <div style={{ width:26, height:26, borderRadius:4, background:t.accentLight, color:t.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, fontFamily:'IBM Plex Mono,monospace' }}>
                    {c.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  {c.name}
                </button>
              ))}
            </div>
            <button onClick={() => setAssignModalTask(null)} style={{ marginTop:11, width:'100%', padding:7, background:t.surface3, border:`1px solid ${t.border}`, borderRadius:5, fontWeight:600, cursor:'pointer', fontSize:11, fontFamily:'inherit', color:t.text2 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Complaint Detail Modal ── */}
      {selected && (
        <VendorComplaintModal
          complaint={filteredComplaints.find(c => c.id === selected?.id) || selected}
          onClose={() => setSelected(null)}
          onAction={(id, s) => act(id, s)}
          onViewImage={setLightboxImage}
        />
      )}

      {/* ── Image Lightbox ── */}
      <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}