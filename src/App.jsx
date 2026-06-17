// src/App.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './utils/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

import UserPortal    from './pages/user/UserPortal';
import VendorPortal  from './pages/vendor/VendorPortal';
import AdminPortal   from './pages/admin/AdminPortal';
import CleanerPortal from './pages/cleaner/CleanerPortal';
import MaterialDept  from './pages/Material Dept/MaterialDept';
import MaterialWorker from './pages/Material Worker/MaterialWorker';
import ManagerLogin  from './pages/Material Dept/ManagerLogin';
import WorkerLogin   from './pages/Material Worker/WorkerLogin';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('reportedAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setComplaints(snap.docs.map(d => {
        const data = d.data();
        return {
          id:          d.id,
          ...data,
          photoURL:    data.photoURL || data.image || data.imageUrl || data.photo || '',
          reportedAt:  data.reportedAt?.toDate() || new Date(),
          resolvedAt:  data.resolvedAt ? data.resolvedAt.toDate() : null,
        };
      }));
      setLoading(false);
    }, err => {
      console.error('Firestore error:', err);
      setLoading(false);
    });
    return unsub;
  }, []);


  const addComplaint = async (newC) => {
    try {
      const stationName =
        typeof newC.station === 'object'
          ? (newC.station?.name || 'Nagpur Junction')
          : (newC.station || 'Nagpur Junction');

      const payload = {
        customTicketId: `TKT-${String(complaints.length + 1001)}`,
        status:         'NEW',
        reportedAt:     serverTimestamp(),
        area:           newC.area      || 'Unknown',
        gtype:          newC.gtype     || 'General',
        severity:       newC.severity  || 'normal',
        lat:            parseFloat(newC.lat) || 0,
        lng:            parseFloat(newC.lng) || 0,
        desc:           newC.desc      || '',
        
        photoURL:       newC.photoURL  || newC.image || newC.photo || '',
        reportedBy:     newC.reportedBy || 'Citizen (App)',
        // ── station stored as plain string for easy vendor filtering ──
        station:        stationName,
      };

      await addDoc(collection(db, 'complaints'), payload);
    } catch (e) {
      console.error('addComplaint error:', e);
    }
  };

  const updateComplaint = async (docId, fields) => {
    try {
      await updateDoc(doc(db, 'complaints', docId), fields);
    } catch (e) {
      console.error('updateComplaint error:', e);
    }
  };

  return (
    <AppContext.Provider value={{ complaints, addComplaint, updateComplaint, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }

/* ── Dev Navigation ── */
const DevNav = ({ route, navigate }) => {
  const [open,     setOpen]     = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const links = ['/', '/vendor', '/admin', '/cleaner', '/material-dept', '/material-worker'];
  const names = ['Camera App', 'Vendor', 'Admin HQ', 'Cleaner Force', 'Material Dept', 'Material Worker'];

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setOpen(v => !v)}
          style={{ position:'fixed', bottom:20, right:20, zIndex:100000, background:'#1565C0', color:'#fff', border:'none', padding:'10px 15px', borderRadius:50, boxShadow:'0 4px 10px rgba(0,0,0,.3)' }}
        >
          {open ? '✕' : '☰'}
        </button>
      )}
      {(isMobile ? open : true) && (
        <div style={{ position:'fixed', bottom:isMobile?80:16, right:16, zIndex:99999, display:'flex', flexDirection:isMobile?'column':'row', gap:5, background:'#0A1628', padding:10, borderRadius:20, boxShadow:'0 4px 15px rgba(0,0,0,.2)' }}>
          {links.map((p, i) => (
            <button key={p} onClick={() => { navigate(p); setOpen(false); }}
              style={{ background:route===p?'#1565C0':'#1A2638', color:'#fff', border:'none', padding:'8px 12px', borderRadius:15, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
              {names[i]}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

/* ── App root ── */
export default function App() {
  const [route, setRoute] = useState(window.location.pathname);

  // FIX: no localStorage persistence anymore — this now behaves exactly
  // like Vendor Portal: a page reload always clears the session and
  // asks for fresh login again, for BOTH Material Dept and Material Worker.
  const [matSession, setMatSession] = useState(null);

  const navigate = path => { window.history.pushState({}, '', path); setRoute(path); };

  return (
    <AppProvider>
      <DevNav route={route} navigate={navigate} />
      <RouteEngine path={route} matSession={matSession} setMatSession={setMatSession} navigate={navigate} />
    </AppProvider>
  );
}

function RouteEngine({ path, matSession, setMatSession }) {
  const { loading } = useApp();
  const [loginView, setLoginView] = useState(path === '/material-worker' ? 'worker' : 'manager');

  useEffect(() => {
    if (path === '/material-dept')   setLoginView('manager');
    if (path === '/material-worker') setLoginView('worker');
  }, [path]);

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#6B7280' }}>
      Loading Ecosystem…
    </div>
  );

  if (path === '/vendor')  return <VendorPortal />;
  if (path === '/admin')   return <AdminPortal />;
  if (path === '/cleaner') return <CleanerPortal />;

  if (path === '/material-dept' || path === '/material-worker') {
    // FIX: a saved session is only valid for the route it was created on.
    // Earlier this just checked "if (matSession)" without comparing it to
    // the current path — so a Manager session would still render the
    // MaterialDept dashboard even while sitting on /material-worker.
    if (matSession && matSession.route === path) {
      return matSession.route === '/material-dept'
        ? <MaterialDept   preAuthUser={matSession.user} onLogout={() => setMatSession(null)} />
        : <MaterialWorker preAuthUser={matSession.user} onLogout={() => setMatSession(null)} />;
    }
    return loginView === 'worker'
      ? <WorkerLogin  onLogin={setMatSession} onSwitchToManager={() => setLoginView('manager')} />
      : <ManagerLogin onLogin={setMatSession} onSwitchToWorker={()  => setLoginView('worker')}  />;
  }

  return <UserPortal />;
}