import React, { useState, useEffect } from 'react';
import { useApp } from '../../App';
import { Sidebar } from '../../components/Sidebar';
import { ComplaintCard, VendorComplaintModal } from '../../components/ComplaintCard';
import { KPI, ProgressBar, NotifBanner } from '../../components/UI';
import LiveMap from '../../components/LiveMap';
import { calcResolutionRate, avgResolutionTime } from '../../utils/helpers';

// Firebase Database Imports
import { db } from '../../utils/firebase'; 
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';

// Common Custom Button Component
const BTN = ({ children, onClick, color='#1565C0', outline=false, small=false, type="button" }) => (
  <button type={type} onClick={onClick} style={{
    padding: small ? '6px 12px' : '8px 15px', borderRadius: 9, fontSize: small ? 12 : 13, fontWeight: 600, cursor: 'pointer',
    background: outline ? '#fff' : color, color: outline ? color : '#fff',
    border: outline ? `1px solid ${color}` : 'none', transition: 'all .15s',
    display: 'inline-flex', alignItems: 'center', gap: 5,
  }}>{children}</button>
);

/* ── 1. GLOBAL IMAGE LIGHTBOX MODAL ── */
function ImageLightbox({ imageUrl, onClose }) {
  if (!imageUrl) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(10, 22, 40, 0.95)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', cursor: 'zoom-out' }}>
      <div style={{ position: 'relative', maxWidth: '95%', maxHeight: '95%' }} onClick={e => e.stopPropagation()}>
        <img src={imageUrl} alt="Evidence Proof" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '16px' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(13, 17, 23, 0.8)', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer', width: 34, height: 34, borderRadius: '50%' }}>✕</button>
      </div>
    </div>
  );
}

/* ── 2. VENDOR PORTAL SUB-TABS ── */
function TaskInbox({ tasks, onAction, onSelect, onOpenAssignModal, onViewImage }) {
  const active = tasks.filter(c => !['COMPLETED','REJECTED'].includes(c.status));
  return (
    <>
      <div className="page-hd">
        <div className="page-title">My Tasks Workspace</div>
        <div className="page-sub">Nagpur Junction (Live Nodes)</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:10,marginBottom:16}}>
        <KPI label="Total"  value={tasks.length} />
        <KPI label="New"    value={tasks.filter(c=>c.status==='NEW').length} color="#E65100" />
        <KPI label="Active" value={tasks.filter(c=>['ACCEPTED','ASSIGNED_TO_CLEANER','CLEANED_BY_FORCE'].includes(c.status)).length} color="#1565C0" />
        <KPI label="Done"   value={tasks.filter(c=>c.status==='COMPLETED').length} color="#2E7D32" />
      </div>
      {active.length === 0 ? (
        <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:14,padding:36,textAlign:'center',color:'#7A8FA6'}}>No pending cleaning tracks available.</div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
          {active.map(c => (
            <ComplaintCard key={c.id} complaint={c} onClick={() => onSelect(c)} onViewImage={onViewImage} actions={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                {c.status==='NEW' && <BTN onClick={e=>{e.stopPropagation(); onAction(c.id,'ACCEPTED')}} color="#1565C0">Accept</BTN>}
                {c.status==='ACCEPTED' && <BTN onClick={e=>{e.stopPropagation(); onOpenAssignModal(c)}} color="#4527A0">Assign Cleaner</BTN>}
                {c.status==='ASSIGNED_TO_CLEANER' && (
                  <div style={{fontSize:11, color:'#e65100', fontWeight:700, background:'#fff3e0', padding:6, borderRadius:6, textAlign:'center'}}>
                    Cleaner Working: {c.assignedTo || 'On Duty'}
                  </div>
                )}
                {c.status==='CLEANED_BY_FORCE' && (
                  <div style={{ background: '#e8f5e9', padding: 8, borderRadius: 8, border: '1px solid #2e7d32' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#2e7d32', marginBottom: 4 }}>Cleaner Proof Image (Click to View):</div>
                    {c.cleanerPhoto && (
                      <img src={c.cleanerPhoto} alt="Proof" onClick={(e) => { e.stopPropagation(); onViewImage(c.cleanerPhoto); }} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, marginBottom: 6, cursor: 'zoom-in' }} />
                    )}
                    <BTN onClick={e=>{e.stopPropagation(); onAction(c.id,'COMPLETED')}} color="#2E7D32">Complete & Close Task</BTN>
                  </div>
                )}
                <BTN onClick={e=>{e.stopPropagation(); onSelect(c)}} outline color="#546E7A" small>View Popup</BTN>
              </div>
            }/>
          ))}
        </div>
      )}
    </>
  );
}

function DynamicCleanersTab({ cleaners, onAddCleaner, onDeleteCleaner }) {
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [showPassId, setShowPassId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim() || !cPassword.trim()) return alert("Please fill all cleaner parameters.");
    onAddCleaner({ name: cName.trim(), phone: cPhone.trim(), password: cPassword.trim() });
    setCName(''); setCPhone(''); setCPassword('');
  };

  return (
    <>
      <div className="page-hd">
        <div className="page-title">Cleaner Staff Management (CRUD)</div>
        <div className="page-sub">Manage ground deployment crews & assign application credentials</div>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, background: '#fff', padding: 14, borderRadius: 12, border: '1px solid #DDE3E9', marginBottom: 20, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 4 }}>CLEANER NAME</span>
          <input type="text" value={cName} onChange={e => setCName(e.target.value)} placeholder="e.g. Ramesh Kumar" style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #DDE3E9', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 4 }}>PHONE / LOGIN ID</span>
          <input type="text" value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="e.g. ramesh98" style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #DDE3E9', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 4 }}>LOGIN PASSWORD</span>
          <input type="password" value={cPassword} onChange={e => setCPassword(e.target.value)} placeholder="••••••" style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #DDE3E9', boxSizing: 'border-box' }} />
        </div>
        <BTN type="submit" color="#2E7D32">+ Add Cleaner</BTN>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
        {cleaners.length === 0 ? (
          <div style={{color:'#7A8FA6', fontSize:13}}>No staff onboarded yet. Create profiles above.</div>
        ) : cleaners.map(c => (
          <div key={c.id} style={{ background: '#fff', border: '1px solid #DDE3E9', borderRadius: 14, padding: 16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color:'#0A1628' }}>🧹 {c.name}</div>
              <div style={{ fontSize: 11, color: '#7A8FA6', marginTop: 3 }}>Login ID: <strong style={{color:'#1565C0'}}>{c.phone}</strong></div>
              <div style={{ fontSize: 11, color: '#7A8FA6', marginTop: 2 }}>
                Password: <strong>{showPassId === c.id ? c.password : '••••••'}</strong>
                <span onClick={() => setShowPassId(showPassId === c.id ? null : c.id)} style={{marginLeft:6, color:'#1565C0', cursor:'pointer'}}>[{showPassId === c.id ? 'Hide' : 'Show'}]</span>
              </div>
            </div>
            <button onClick={() => onDeleteCleaner(c.id)} style={{ background: 'none', border: 'none', color: '#B71C1C', fontSize: 16, cursor: 'pointer' }}>🗑️</button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── 3. CLEANER DASHBOARD VIEW (AFTER CLEANER LOGS IN) ── */
function CleanerDashboard({ cleanerData, vendorId, tasks, onUpdateComplaint, onLogout }) {
  const myTasks = tasks.filter(c => c.assignedTo === cleanerData.name && c.status === 'ASSIGNED_TO_CLEANER');
  const [inputUrl, setInputUrl] = useState({});

  const handleCompleteTask = async (id) => {
    const url = inputUrl[id];
    if (!url || !url.trim()) return alert("Please enter a valid work proof image URL.");
    
    await onUpdateComplaint(id, {
      status: 'CLEANED_BY_FORCE',
      cleanerStatus: 'DONE',
      cleanerPhoto: url.trim()
    });
    alert("Task submitted to Vendor for verification!");
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, background: '#1E293B', padding: 15, borderRadius: 12, color: '#fff' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>🧹 {cleanerData.name} (Cleaner Mode)</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>Vendor Base: {vendorId}</div>
        </div>
        <button onClick={onLogout} style={{ background: '#EF4444', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Logout</button>
      </div>

      <h3 style={{ fontSize: 15, color: '#1E293B', marginBottom: 12 }}>My Pending Duty Tasks ({myTasks.length})</h3>
      {myTasks.length === 0 ? (
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>Sab saaf hai! No pending tasks assigned to you right now.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myTasks.map(t => (
            <div key={t.id} style={{ background: '#fff', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13, marginBottom: 4 }}>📍 {t.area || 'Platform Area'}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>Type: {t.title || 'General Waste Issue'}</div>
              
              <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>PASTE CLEANED PHOTO URL</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" placeholder="https://example.com/cleaned-photo.jpg" value={inputUrl[t.id] || ''} onChange={e => setInputUrl({...inputUrl, [t.id]: e.target.value})} style={{ flex: 1, padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #CBD5E1' }} />
                  <button onClick={() => handleCompleteTask(t.id)} style={{ background: '#10B981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Mark Cleaned</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 4. MAIN CENTRAL ARCHITECTURE CONTROL ── */
export default function VendorPortal() {
  const { complaints, updateComplaint } = useApp();
  
  // Login Configurations
  const [loginMode, setLoginMode] = useState('vendor'); // 'vendor' or 'cleaner'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [vendorLoginId, setVendorLoginId] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [currentVendorData, setCurrentVendorData] = useState(null);

  // Cleaner Login Parameters
  const [cleanerUserId, setCleanerUserId] = useState('');
  const [cleanerPassword, setCleanerPassword] = useState('');
  const [activeCleanerData, setActiveCleanerData] = useState(null);

  // UI Flow Layout States
  const [tab, setTab] = useState('tasks');
  const [selected, setSelected] = useState(null);
  const [notif, setNotif] = useState(null);
  const [assignModalTask, setAssignModalTask] = useState(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const [cleaners, setCleaners] = useState([]);

  // Sync Cleaners Realtime Matrix from Firestore
  useEffect(() => {
    if (!isAuthenticated || !vendorLoginId || loginMode !== 'vendor') return;
    const unsubscribe = onSnapshot(collection(db, "vendors", vendorLoginId.trim(), "cleaners"), (snap) => {
      setCleaners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [isAuthenticated, vendorLoginId, loginMode]);

  // Escape listener to close Lightbox image
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') setActiveLightboxImage(null); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auth Operations
  const handleVendorAuth = async (e) => {
    e.preventDefault();
    if (!vendorLoginId.trim() || !vendorPassword) return alert("Fill all entry fields.");
    try {
      const docRef = doc(db, "vendors", vendorLoginId.trim());
      const res = await getDoc(docRef);
      if (res.exists() && res.data().password === vendorPassword) {
        setCurrentVendorData(res.data());
        setIsAuthenticated(true);
      } else {
        alert("Invalid Vendor Credentials.");
      }
    } catch (err) {
      alert("Error linking database nodes.");
    }
  };

  const handleCleanerAuth = async (e) => {
    e.preventDefault();
    if (!vendorLoginId.trim() || !cleanerUserId.trim() || !cleanerPassword) {
      return alert("Please fill all configuration credentials.");
    }
    try {
      // 1. Check if vendor exists
      const venRef = doc(db, "vendors", vendorLoginId.trim());
      const venSnap = await getDoc(venRef);
      if (!venSnap.exists()) return alert("Parent Vendor ID not found in system cluster.");

      // 2. Query sub-collection cleaner documentation structure
      const unsub = onSnapshot(collection(db, "vendors", vendorLoginId.trim(), "cleaners"), (snap) => {
        const found = snap.docs.map(d => d.data()).find(c => c.phone === cleanerUserId.trim() && c.password === cleanerPassword);
        if (found) {
          setActiveCleanerData(found);
          setIsAuthenticated(true);
        } else {
          alert("Invalid Cleaner Username or Password configuration.");
        }
        unsub(); // immediately unsubscribe
      });
    } catch (err) {
      alert("Error verifying authentication registry.");
    }
  };

  // Cleaner CRUD Node operations
  const handleAddCleaner = async (payload) => {
    try {
      const targetRef = doc(collection(db, "vendors", vendorLoginId.trim(), "cleaners"));
      await setDoc(targetRef, {
        name: payload.name,
        phone: payload.phone,
        password: payload.password,
        createdAt: serverTimestamp()
      });
      setNotif(`Staff ${payload.name} deployed into database grid.`);
    } catch (err) {
      alert("Failed to write entry matrix.");
    }
  };

  const handleDeleteCleaner = async (id) => {
    if (!window.confirm("Purge staff allocation profiling data?")) return;
    try {
      await deleteDoc(doc(db, "vendors", vendorLoginId.trim(), "cleaners", id));
      setNotif("Staff registry cleared successfully.");
    } catch (err) {
      alert("Error execution error code.");
    }
  };

  // State Updates Matrix
  const act = async (id, status) => {
    if (status === 'COMPLETED') {
      await updateComplaint(id, { status, cleanerStatus: 'DONE', resolvedAt: new Date() });
    } else {
      await updateComplaint(id, { status });
    }
    setNotif('System node state changed seamlessly.');
  };

  const handleAssignCleaner = async (cleanerName) => {
    if (!assignModalTask) return;
    await updateComplaint(assignModalTask.id, {
      status: 'ASSIGNED_TO_CLEANER',
      assignedTo: cleanerName,
      cleanerStatus: 'ASSIGNED'
    });
    setNotif(`Task assigned safely to ${cleanerName}`);
    setAssignModalTask(null);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveCleanerData(null);
    setCleanerUserId('');
    setCleanerPassword('');
  };

  // Sorting and Processing Matrices
  const filteredComplaints = currentVendorData?.stationName 
    ? complaints.filter(c => (typeof c.station === 'object' ? c.station?.name : c.station) === currentVendorData.stationName)
    : complaints;

  /* ── GATE INTERFACE 1: AUTHENTICATION DEPLOYMENT SCREEN ── */
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0F172A', fontFamily: 'system-ui' }}>
        <div style={{ background: '#fff', padding: '32px 28px', borderRadius: 16, width: 340, boxShadow: '0 10px 40px rgba(0,0,0,0.25)' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', marginBottom: 4, textAlign: 'center' }}>Geotech Garbage pickup</div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 20, textAlign: 'center', fontWeight: 600 }}>GRWMS Control Workstation</div>
          
          {/* Form Selection Tabs */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 4, marginBottom: 20 }}>
            <button onClick={() => setLoginMode('vendor')} style={{ flex: 1, padding: '6px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer', background: loginMode === 'vendor' ? '#fff' : 'transparent', color: loginMode === 'vendor' ? '#1E293B' : '#64748B' }}>Vendor Panel</button>
          </div>

          {loginMode === 'vendor' ? (
            <form onSubmit={handleVendorAuth}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>VENDOR STATION ID</label>
              <input type="text" value={vendorLoginId} onChange={e => setVendorLoginId(e.target.value)} placeholder="e.g. platform_no_1" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #DDE3E9', marginBottom: 14, boxSizing: 'border-box', fontSize: 13 }} required />
              
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>ACCESS PASSWORD</label>
              <input type="password" value={vendorPassword} onChange={e => setVendorPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #DDE3E9', marginBottom: 20, boxSizing: 'border-box', fontSize: 13 }} required />
              
              <button type="submit" style={{ width: '100%', padding: 11, background: '#1565C0', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Authenticate Vendor</button>
            </form>
          ) : (
            <form onSubmit={handleCleanerAuth}>
           
             
               </form>
          )}
        </div>
      </div>
    );
  }

  /* ── GATE INTERFACE 2: CLEANER LIVE RUNNING APP DASHBOARD ── */
  if (loginMode === 'cleaner' && activeCleanerData) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <CleanerDashboard cleanerData={activeCleanerData} vendorId={vendorLoginId} tasks={complaints} onUpdateComplaint={updateComplaint} onLogout={handleLogout} />
      </div>
    );
  }

  /* ── GATE INTERFACE 3: FULL VENDOR MANAGEMENT CONTROL CENTER ── */
  const navItems = [
    { key:'tasks', icon: '📋', label:'Tasks Inbox', count: filteredComplaints.filter(c=>['NEW', 'ACCEPTED', 'ASSIGNED_TO_CLEANER', 'CLEANED_BY_FORCE'].includes(c.status)).length },
    { key:'map',   icon: '🗺️', label:'GIS Map Layout' },
    { key:'cleaners', icon: '🧹', label:'Manage Cleaners' },
    { key:'done',  icon: '✅', label:'Completed Logs' },
  ];

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'system-ui,sans-serif',overflow:'hidden'}}>
      <Sidebar 
        title="Express Travel" 
        subtitle={currentVendorData?.name || "Vendor Control Engine"} 
        navItems={navItems} activeTab={tab} onTabChange={setTab}
        footerUser={{initials:'VN', name: currentVendorData?.name || 'Vendor Admin', role: currentVendorData?.stationName || 'Platform Head', avatarColor:'#1565C0'}}
      />
      
      <div style={{flex:1,overflowY:'auto',background:'#F7F9FC'}}>
        {notif && <NotifBanner msg={notif} type="green" onDone={()=>setNotif(null)}/>}
        <button onClick={handleLogout} style={{ position: 'absolute', top: 15, right: 20, background: '#ECEFF1', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Exit Node</button>
        
        <div style={{padding:22,maxWidth:900,margin:'0 auto', width:'100%'}}>
          {tab==='tasks' && <TaskInbox tasks={filteredComplaints} onAction={act} onSelect={setSelected} onOpenAssignModal={setAssignModalTask} onViewImage={setActiveLightboxImage}/>}
          {tab==='map'   && <LiveMap complaints={filteredComplaints.filter(c => c.lat && c.lng)} height="350px" onPinClick={setSelected} />}
          {tab==='cleaners' && <DynamicCleanersTab cleaners={cleaners} onAddCleaner={handleAddCleaner} onDeleteCleaner={handleDeleteCleaner} />}
          {tab==='done'  && (
            <>
              <div className="page-hd"><div className="page-title">Archive Resolved Logs</div></div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
                {filteredComplaints.filter(c=>c.status==='COMPLETED').map(c=><ComplaintCard key={c.id} complaint={c} onClick={()=>setSelected(c)} onViewImage={setActiveLightboxImage}/>)}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Assign Cleaner Popup Modal Overlay */}
      {assignModalTask && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
          <div style={{background:'#fff',padding:20,borderRadius:12,width:280,boxShadow:'0 4px 20px rgba(0,0,0,0.15)'}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:'#0A1628'}}>Select Cleaning Crew</div>
            <div style={{display:'flex',flexDirection:'column',gap:8, maxHeight:200, overflowY:'auto'}}>
              {cleaners.length === 0 ? (
                <div style={{fontSize:12, color:'#7A8FA6', textAlign:'center', padding:10}}>No cleaners available. Switch to Cleaners Tab.</div>
              ) : cleaners.map(c => (
                <button key={c.id} onClick={() => handleAssignCleaner(c.name)} style={{padding:10,background:'#f7f9fc',border:'1px solid #dde3e9',borderRadius:8,cursor:'pointer',textAlign:'left',fontWeight:600}}>
                  👤 {c.name}
                </button>
              ))}
            </div>
            <button onClick={() => setAssignModalTask(null)} style={{marginTop:12,width:'100%',padding:6,background:'#ECEFF1',border:'none',borderRadius:6,fontWeight:600,cursor:'pointer',fontSize:12}}>Cancel Process</button>
          </div>
        </div>
      )}

      {selected && (
        <VendorComplaintModal complaint={complaints.find(c => c.id === selected?.id) || selected} onClose={()=>setSelected(null)} onAction={(id,s)=>act(id,s)} onViewImage={setActiveLightboxImage} />
      )}
      
      <ImageLightbox imageUrl={activeLightboxImage} onClose={() => setActiveLightboxImage(null)} />
      <style>{`.page-hd{margin-bottom:18px}.page-title{font-size:18px;font-weight:800;color:#0D1117}.page-sub{font-size:12px;color:#7A8FA6}`}</style>
    </div>
  );
}