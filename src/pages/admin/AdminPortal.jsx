import { db } from '../../utils/firebase'; 
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../App';
import { Sidebar } from '../../components/Sidebar';
import { ComplaintCard, AdminComplaintModal } from '../../components/ComplaintCard';
import LiveMap from '../../components/LiveMap';
import { STATIONS } from '../../data/mockData'; 
import { timeAgo, calcResolutionRate, avgResolutionTime } from '../../utils/helpers';

/* ── 🛡️ LOCAL BULLETPROOF COMPONENTS TO PREVENT CRASHES ── */

function SafeBadge({ status }) {
  const displayStatus = typeof status === 'object' ? (status?.name || status?.id || 'UNKNOWN') : status;
  
  const styles = {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-block',
    textTransform: 'uppercase'
  };

  let colors = { background: '#ECEFF1', color: '#455A64' }; // Default
  if (displayStatus === 'NEW') colors = { background: '#FFE0B2', color: '#E65100' };
  else if (displayStatus === 'ACCEPTED') colors = { background: '#E3F2FD', color: '#1565C0' };
  else if (displayStatus === 'IN_PROGRESS') colors = { background: '#E8F5E9', color: '#2E7D32' };
  else if (displayStatus === 'COMPLETED') colors = { background: '#C8E6C9', color: '#1B5E20' };
  else if (displayStatus === 'QUERIED') colors = { background: '#FFF9C4', color: '#F57F17' };
  else if (displayStatus === 'ESCALATED') colors = { background: '#FFCDD2', color: '#B71C1C' };

  return <span style={{ ...styles, ...colors }}>{String(displayStatus)}</span>;
}

function SafeKPI({ label, value, color = '#0D1117' }) {
  const displayValue = typeof value === 'object' ? (value?.name || value?.id || '0') : value;
  const displayLabel = typeof label === 'object' ? (label?.name || 'Metric') : label;

  return (
    <div style={{ background: '#fff', border: '1px solid #DDE3E9', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: '#7A8FA6', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
        {String(displayLabel)}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 800, color: color }}>
        {String(displayValue)}
      </div>
    </div>
  );
}

function SafeProgressBar({ value, color = '#1565C0', height = 6 }) {
  const displayPct = typeof value === 'object' ? 0 : Math.min(Math.max(parseInt(value) || 0, 0), 100);
  return (
    <div style={{ width: '100%', height: height, background: '#ECEFF1', borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ width: `${displayPct}%`, height: '100%', background: color, transition: 'width 0.3s ease' }} />
    </div>
  );
}

function SafeAlert({ type, icon, children }) {
  const isRed = type === 'red';
  return (
    <div style={{ 
      background: isRed ? '#FFEBEE' : '#FFF8E1', 
      border: `1px solid ${isRed ? '#FFCDD2' : '#FFE0B2'}`, 
      color: isRed ? '#C62828' : '#F57F17',
      padding: '12px 16px', 
      borderRadius: 10, 
      marginBottom: 16, 
      display: 'flex', 
      alignItems: 'center', 
      gap: 10,
      fontSize: '13px'
    }}>
      <span>{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function SafeNotifBanner({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  return (
    <div style={{ background: '#FFB300', color: '#000', padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>
      {typeof msg === 'object' ? JSON.stringify(msg) : String(msg)}
    </div>
  );
}

/* ── GLOBAL FULL IMAGE LIGHTBOX MODAL ── */
function ImageLightbox({ imageUrl, onClose }) {
  if (!imageUrl) return null;
  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(10, 22, 40, 0.95)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(5px)', cursor: 'zoom-out'
      }}
    >
      <div style={{ position: 'relative', maxWidth: '95%', maxHeight: '95%' }} onClick={e => e.stopPropagation()}>
        <img src={imageUrl} alt="Evidence Asset" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(13, 17, 23, 0.8)', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer', width: 34, height: 34, borderRadius: '50%' }}>✕</button>
      </div>
    </div>
  );
}

/* ── SUB-TAB 1: DYNAMIC DASHBOARD ── */
function Dashboard({ complaints, onSelect, onTabChange, onViewImage }) {
  const total = complaints.length;
  const esc   = complaints.filter(c => c.status === 'ESCALATED');
  const done  = complaints.filter(c => c.status === 'COMPLETED');
  
  return (
    <>
      <div className="page-hd">
        <div className="page-title">Dashboard Hub</div>
        <div className="page-sub">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>
      
      {esc.length > 0 && (
        <SafeAlert type="red" icon="⚠️">
          <strong>{esc.length} escalated operations</strong> — not accepted within standard category SLAs.{' '}
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => onTabChange('map')}>View on map →</span>
        </SafeAlert>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginBottom: 16 }}>
        <SafeKPI label="Total Influx" value={total} />
        <SafeKPI label="New Tickets" value={complaints.filter(c => c.status === 'NEW').length} color="#E65100" />
        <SafeKPI label="Resolved Cases" value={done.length} color="#2E7D32" />
        <SafeKPI label="Escalations" value={esc.length} color="#B71C1C" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginBottom: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #DDE3E9', borderRadius: 14, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Status Overview</div>
          {['NEW', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'QUERIED', 'ESCALATED'].map(s => {
            const cnt = complaints.filter(c => c.status === s).length;
            const pct = Math.round(cnt / (total || 1) * 100);
            const col = { COMPLETED: '#2E7D32', ESCALATED: '#B71C1C', NEW: '#E65100', QUERIED: '#F57F17' }[s] || '#1565C0';
            return (
              <div key={s} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <SafeBadge status={s} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{cnt}</span>
                </div>
                <SafeProgressBar value={pct} color={col} />
              </div>
            );
          })}
        </div>

        <div style={{ background: '#fff', border: '1px solid #DDE3E9', borderRadius: 14, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Station Load Distribution</div>
          {STATIONS.map((s) => {
            const targetStationId = typeof s === 'object' ? s?.id : s;
            const targetStationName = typeof s === 'object' ? (s?.name || 'Station Node') : s;

            const cnt = complaints.filter(c => {
              const complaintStationId = typeof c.station === 'object' ? c.station?.id : c.station;
              return complaintStationId === targetStationId;
            }).length;
            
            return (
              <div key={targetStationId || Math.random()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #DDE3E9' }}>
                <span style={{ fontSize: 12, color: '#3D4F61' }}>
                  📍 {typeof targetStationName === 'string' ? targetStationName.split(' ')[0] : 'Node'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 52, height: 4, background: '#ECEFF1', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: (cnt / (total || 1) * 100) + '%', height: '100%', background: '#1565C0' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{cnt}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Recent Live Incidents & Progress Tracker</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        {complaints.map(c => {
          let progressPercent = 0;
          if (c.status === 'NEW') progressPercent = 20;
          else if (c.status === 'ACCEPTED') progressPercent = 45;
          else if (c.status === 'IN_PROGRESS') progressPercent = 70;
          else if (c.status === 'COMPLETED') progressPercent = 100;
          else if (c.status === 'QUERIED') progressPercent = 50;

          const vendorString = typeof c.vendorId === 'object' ? (c.vendorId?.name || c.vendorId?.id) : c.vendorId;

          return (
            <div key={c.id} style={{ background: '#fff', border: '1px solid #DDE3E9', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div 
                  onClick={() => { if(c.cleanerPhoto) onViewImage(c.cleanerPhoto); }}
                  style={{ height: 125, background: c.cleanerPhoto ? `url(${c.cleanerPhoto}) center/cover no-repeat` : '#102228', borderRadius: 10, marginBottom: 10, cursor: c.cleanerPhoto ? 'zoom-in' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1px solid #ECEFF1' }}
                >
                  {!c.cleanerPhoto && <span style={{ color: '#7A8FA6', fontSize: 11, fontWeight: 600 }}>No Proof Asset Documented</span>}
                  {c.cleanerPhoto && <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>Click Image for Full Screen</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1117' }}>{typeof c.area === 'object' ? c.area?.name : (c.area || 'General Terminal')}</div>
                  <SafeBadge status={c.status} />
                </div>
                
                <div style={{ fontSize: 11.5, color: '#546E7A', marginBottom: 8 }}>
                  Category: <strong>{typeof c.gtype === 'object' ? c.gtype?.name : (c.gtype || 'General Waste')}</strong> · {timeAgo(c.reportedAt)}
                </div>

                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 10px', marginBottom: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>
                    🏢 Vendor Grid: <span style={{ fontWeight: 600, color: '#0F172A' }}>{String(vendorString || 'Unassigned Node')}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>
                    🧹 Cleaner Deployment: <span style={{ fontWeight: 600, color: '#1E293B' }}>{String(c.cleanerName || c.assignedCleaner || 'Awaiting Task Accept')}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Report Pipeline State:</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#0F172A' }}>{progressPercent}%</span>
                  </div>
                  <SafeProgressBar value={progressPercent} color={c.status === 'COMPLETED' ? '#2E7D32' : '#1565C0'} height={5} />
                </div>
              </div>

              <button onClick={() => onSelect(c)} style={{ width: '100%', padding: '7px 0', background: '#1565C0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Inspect Activity Blueprint
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── SUB-TAB 2: LIVE MAP FLOW ── */
function LiveMapTab({ complaints, onSelect }) {
  const active = complaints.filter(c => c.lat && c.lng);
  return (
    <>
      <div className="page-hd"><div className="page-title">Live Node GIS Map</div><div className="page-sub">Real-time GPS parameters</div></div>
      <LiveMap complaints={active} height="320px" onPinClick={onSelect} />
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
        {active.slice(0, 4).map(c => {
          const stationName = typeof c.station === 'object' ? c.station?.name : c.station;
          return (
            <div key={c.id} onClick={() => onSelect(c)} style={{ display: 'flex', gap: 10, background: '#fff', border: '1px solid #DDE3E9', borderRadius: 12, padding: '11px 13px', cursor: 'pointer', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{String(c.area || '')} — {String(c.gtype || '')}</div>
                <div style={{ fontSize: 11, color: '#7A8FA6' }}>Location: {String(stationName || 'Station Node')} · {timeAgo(c.reportedAt)}</div>
              </div>
              <SafeBadge status={c.status} />
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── SUB-TAB 3: VENDORS CRUD CONTROL (UPDATED WITH AREA DROPDOWN) ── */
function DynamicVendorsTab({ complaints, vendors, onAddVendor, onDeleteVendor }) {
  const [vId, setVId] = useState('');
  const [vPass, setVPass] = useState('');
  const [vName, setVName] = useState('');
  const [vStation, setVStation] = useState('Nagpur Junction');
  const [vType, setVType] = useState('GARBAGE'); // Default Strategy Configuration
  const [vArea, setVArea] = useState('platform no 1'); // NEW AREA DROPDOWN STATE

  // Pre-defined Area Selection Array
  const AREAS = [
  'Platform 1 (Main Entry)',
  'Platform 2',
  'Platform 3',
  'Platform 4',
  'Platform 5',
  'Platform 6 (Santaraj Entry)',
  'Main Waiting Hall',
  'Foot Over Bridge (FOB) - Central',
  'Foot Over Bridge (FOB) - Itwari Side',
  'Circulating Area (Main Gate)',
  'Santaracha Side Parking',
  'Reservation Ticket Counter',
  'Running Room & Yard Area',
  'Food Plaza (Platform 1)'
];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!vId.trim() || !vPass || !vName.trim()) return alert("Please fill all form values.");
    
    onAddVendor({ 
      id: vId.trim(), 
      password: vPass, 
      name: vName.trim(), 
      stationName: vStation, 
      vendorType: vType,
      areaName: vArea // Forwarding dropdown area key
    });

    setVId(''); setVPass(''); setVName('');
  };

  return (
    <>
      <div className="page-hd"><div className="page-title">Operational Network Vendors</div><div className="page-sub">Provision and deregister platform management groups</div></div>
      
      {/* Expanded Submission Terminal with Selection Dropdowns */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, background: '#fff', padding: 14, borderRadius: 12, border: '1px solid #DDE3E9', marginBottom: 20, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 4 }}>VENDOR ID</span>
          <input type="text" value={vId} onChange={e => setVId(e.target.value)} placeholder="vendor_ngp_01" style={{ width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #DDE3E9', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 4 }}>ACCESS PASSWORD</span>
          <input type="password" value={vPass} onChange={e => setVPass(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #DDE3E9', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 4 }}>CONTRACTOR FIRM NAME</span>
          <input type="text" value={vName} onChange={e => setVName(e.target.value)} placeholder="Ex: Khalsa Cleaning Services" style={{ width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #DDE3E9', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1, minWidth: 130 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 4 }}>ASSIGN STATION TERMINAL</span>
          <select value={vStation} onChange={e => setVStation(e.target.value)} style={{ width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #DDE3E9', background: '#fff', boxSizing: 'border-box' }}>
            {STATIONS.map(st => <option key={st.id} value={st.name}>{st.name}</option>)}
          </select>
        </div>

        {/* NEW AREA / PLATFORM SELECTION DROP-DOWN */}
        <div style={{ flex: 1, minWidth: 130 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2E7D32', display: 'block', marginBottom: 4 }}>TARGET AREA / PLATFORM</span>
          <select value={vArea} onChange={e => setVArea(e.target.value)} style={{ width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #2E7D32', background: '#E8F5E9', fontWeight: '700', boxSizing: 'border-box', color: '#1B5E20' }}>
            {AREAS.map(area => <option key={area} value={area}>{area.toUpperCase()}</option>)}
          </select>
        </div>
        
        {/* LOGISTICS SECTOR TYPE SELECTOR DROP-DOWN */}
        <div style={{ flex: 1, minWidth: 130 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', display: 'block', marginBottom: 4 }}>LOGISTICS SECTOR TYPE</span>
          <select value={vType} onChange={e => setVType(e.target.value)} style={{ width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #1565C0', background: '#FFF3E0', fontWeight: '700', boxSizing: 'border-box' }}>
            <option value="GARBAGE">🚯 Garbage Cleaning</option>
            <option value="MATERIAL">📦 Material Storage Hub</option>
          </select>
        </div>

        <button type="submit" style={{ padding: '8px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ Provision Vendor</button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
        {vendors.map(v => {
          const t = complaints.filter(c => {
            const vIdStr = typeof c.vendorId === 'object' ? c.vendorId?.id : c.vendorId;
            return vIdStr === v.id;
          });
          const d = t.filter(c => c.status === 'COMPLETED').length;
          const pct = Math.round(d / (t.length || 1) * 100);
          
          const isMaterialVendor = v.vendorType === 'MATERIAL';

          return (
            <div key={v.id} style={{ background: '#fff', border: isMaterialVendor ? '2px solid #1565C0' : '1px solid #DDE3E9', borderRadius: 14, padding: 18, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: isMaterialVendor ? '#1E293B' : '#1565C0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {v.name ? v.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'VN'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{String(v.name || '')}</div>
                  <div style={{ fontSize: 11.5, color: '#7A8FA6', fontFamily: 'monospace' }}>ID: {String(v.loginId || '')}</div>
                </div>
                <button onClick={() => onDeleteVendor(v.id)} style={{ background: 'none', border: 'none', color: '#B71C1C', fontSize: 15, cursor: 'pointer', padding: '4px' }}>🗑️</button>
              </div>
              
              {/* Badges Display Block (Added Area Node Render) */}
              <div style={{ marginBottom: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ background: '#F7F9FC', border: '1px solid #DDE3E9', borderRadius: 99, fontSize: 11, padding: '2px 9px' }}>📍 {String(v.stationName || '')}</span>
                <span style={{ background: '#FFF3E0', border: '1px solid #FFB74D', color: '#E65100', borderRadius: 99, fontSize: 11, fontWeight: '700', padding: '2px 9px' }}>🚪 {String(v.areaName || 'platform no 1').toUpperCase()}</span>
                <span style={{ background: isMaterialVendor ? '#E0F7FA' : '#E8F5E9', border: `1px solid ${isMaterialVendor ? '#00ACC1' : '#4CAF50'}`, color: isMaterialVendor ? '#006064' : '#1B5E20', borderRadius: 99, fontSize: 10, fontWeight: '800', padding: '2px 8px' }}>
                  {isMaterialVendor ? '📦 MATERIAL HUB' : '🚯 GARBAGE CLEAN'}
                </span>
              </div>

              {!isMaterialVendor ? (
                <>
                  <div style={{ display: 'flex', background: '#F7F9FC', borderRadius: 9, overflow: 'hidden', border: '1px solid #DDE3E9', marginBottom: 10 }}>
                    <div style={{ flex: 1, padding: '9px 6px', textAlign: 'center', borderRight: '1px solid #DDE3E9' }}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#7A8FA6', textTransform: 'uppercase' }}>Assigned</div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{t.length}</div>
                    </div>
                    <div style={{ flex: 1, padding: '9px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#7A8FA6', textTransform: 'uppercase' }}>Done</div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{d}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#7A8FA6', marginBottom: 3 }}>Live SLA Close Efficiency ({pct}%)</div>
                  <SafeProgressBar value={pct} color="#2E7D32" height={5} />
                </>
              ) : (
                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 12, border: '1px dashed #CBD5E1', marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: '700' }}>CURRENT INVENTORY LOGISTICS LEVEL:</div>
                  <div style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', marginTop: 2 }}>
                    {v.totalStockCurrent || 0} <span style={{ fontSize: 12, fontWeight: '500', color: '#475569' }}>Units on Hold</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── SUB-TAB 4: REPORTS PAGE ── */
function ReportsPage({ complaints }) {
  const done = complaints.filter(c => c.status === 'COMPLETED');
  const rate = calcResolutionRate(complaints);
  const avg = avgResolutionTime(complaints);
  return (
    <>
      <div className="page-hd"><div className="page-title">Analytics Matrix</div><div className="page-sub">Cloud snapshot computation engine</div></div>
      <div style={{ background: '#fff', border: '1px solid #DDE3E9', borderRadius: 14, padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 10 }}>
          <SafeKPI label="Total Influx" value={complaints.length} />
          <SafeKPI label="Resolved Pipelines" value={done.length} color="#2E7D32" />
          <SafeKPI label="Close Rating Rate" value={rate + '%'} color="#1565C0" />
          <SafeKPI label="Mean Avg Time" value={avg + ' min'} />
        </div>
      </div>
    </>
  );
}

/* ── MAIN SYSTEM ARCHITECTURE BLOCK ── */
export default function AdminPortal() {
  const { complaints, updateComplaint } = useApp();
  
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  
  const [tab, setTab] = useState('dashboard');
  const [selected, setSelected] = useState(null);
  const [notif, setNotif] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const unsubscribe = onSnapshot(collection(db, "vendors"), (snap) => {
      setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [isAdminLoggedIn]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeLightboxImage) setActiveLightboxImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxImage]);

  const handleAdminAuthCheck = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password) return alert("Fill entry fields.");
    try {
      const docRef = doc(db, "admins", loginId.trim());
      const res = await getDoc(docRef);
      if (res.exists() && res.data().password === password) {
        setIsAdminLoggedIn(true);
      } else {
        alert("Invalid credential parameters context.");
      }
    } catch (err) {
      alert("Error checking backend cluster authorization entries.");
    }
  };

  const handleProvisionVendor = async (payload) => {
    try {
      // Added `areaName` mapping architecture persistent field update
      await setDoc(doc(db, "vendors", payload.id), {
        loginId: payload.id, 
        password: payload.password, 
        name: payload.name, 
        stationName: payload.stationName, 
        areaName: payload.areaName || "platform no 1", // Saves selected layout field
        vendorType: payload.vendorType || "GARBAGE", 
        totalStockCurrent: payload.vendorType === "MATERIAL" ? 0 : null, 
        createdAt: serverTimestamp()
      });
      setNotif(`Contract Node ${payload.id} [${payload.vendorType}] assigned to ${payload.areaName} successfully.`);
    } catch (err) {
      alert("Cloud database execution dropped profile upload query.");
    }
  };

  const handleRevokeVendor = async (targetId) => {
    if (!window.confirm("Purge contractor profile nodes permanently?")) return;
    try {
      await deleteDoc(doc(db, "vendors", targetId));
      setNotif(`Operator ${targetId} wiped entirely.`);
    } catch (err) {
      console.error(err);
    }
  };

  const onStatusChange = (id, status) => {
    updateComplaint(id, { status });
    if (selected?.id === id) setSelected(s => ({ ...s, status }));
    setNotif(`Ticket ${id} context updated standard state to: ${status}`);
  };

  if (!isAdminLoggedIn) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0A1628' }}>
        <form onSubmit={handleAdminAuthCheck} style={{ background: '#fff', padding: '32px 28px', borderRadius: 16, width: 340, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', marginBottom: 6, textAlign: 'center' }}>Express Travel HQ</div>
          <div style={{ fontSize: 13, color: '#546E7A', marginBottom: 24, textAlign: 'center', fontWeight: 500 }}>Admin Central Node Authentication</div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#3D4F61', marginBottom: 5 }}>ADMIN SYSTEM CONTROL ID</label>
          <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="e.g. admin_ngp" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #DDE3E9', marginBottom: 14, boxSizing: 'border-box', fontSize: 13 }} />
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#3D4F61', marginBottom: 5 }}>PASSWORD</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #DDE3E9', marginBottom: 20, boxSizing: 'border-box', fontSize: 13 }} />
          <button type="submit" style={{ width: '100%', padding: 11, background: '#1565C0', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>Verify & Open HQ</button>
        </form>
      </div>
    );
  }

  const navItems = [
    { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { key: 'map', icon: '🗺️', label: 'Live Map' },
    { key: 'vendors', icon: '🏢', label: 'Vendors Group' },
    { key: 'reports', icon: '📊', label: 'Reports Control' }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar title="Admin Control Center" subtitle="Railway Board · Nagpur" navItems={navItems} activeTab={tab} onTabChange={setTab}
        footerUser={{ initials: 'AD', name: 'Admin Officer', role: 'Railway Board', avatarColor: '#B71C1C' }} />
      <div style={{ flex: 1, overflowY: 'auto', background: '#F7F9FC', display: 'flex', flexDirection: 'column' }}>
        {notif && <SafeNotifBanner msg={notif} onDone={() => setNotif(null)} />}
        <div style={{ padding: 22, maxWidth: 940, margin: '0 auto', width: '100%' }}>
          {tab === 'dashboard' && <Dashboard complaints={complaints} onSelect={setSelected} onTabChange={setTab} onViewImage={setActiveLightboxImage} />}
          {tab === 'map' && <LiveMapTab complaints={complaints} onSelect={setSelected} />}
          {tab === 'vendors' && <DynamicVendorsTab complaints={complaints} vendors={vendors} onAddVendor={handleProvisionVendor} onDeleteVendor={handleRevokeVendor} />}
          {tab === 'reports' && <ReportsPage complaints={complaints} vendors={vendors} />}
        </div>
      </div>
      
      {selected && <AdminComplaintModal complaint={selected} onClose={() => setSelected(null)} onStatusChange={onStatusChange} />}
      <ImageLightbox imageUrl={activeLightboxImage} onClose={() => setActiveLightboxImage(null)} />

      <style>{`
        .page-hd{margin-bottom:18px}.page-title{font-size:18px;font-weight:800;color:#0D1117;margin-bottom:2px}.page-sub{font-size:12px;color:#7A8FA6}
      `}</style>
    </div>
  );
}