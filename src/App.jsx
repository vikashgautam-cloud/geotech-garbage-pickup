// src/App.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './utils/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

// Existing Portals
import UserPortal    from './pages/user/UserPortal';
import VendorPortal  from './pages/vendor/VendorPortal';
import AdminPortal   from './pages/admin/AdminPortal';
import CleanerPortal from './pages/cleaner/CleanerPortal';
import MaterialDept  from './pages/Material Dept/MaterialDept';
import MaterialWorker from './pages/Material Worker/MaterialWorker';

// ── Two separate login pages ──────────────────────────────────────────────────
import ManagerLogin from './pages/Material Dept/ManagerLogin';   // dark, industrial
import WorkerLogin  from './pages/Material Worker/WorkerLogin';    // bright, mobile-first

const AppContext = createContext();

export function AppProvider({ children }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "complaints"), orderBy("reportedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          reportedAt: data.reportedAt?.toDate() || new Date(),
          resolvedAt: data.resolvedAt ? data.resolvedAt.toDate() : null
        };
      });
      setComplaints(liveData);
      setLoading(false);
    }, (err) => {
      console.error("Firestore continuous retrieval error: ", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addComplaint = async (newC) => {
    try {
      const ticketId = `TKT-${String(complaints.length + 1001)}`;

      let base64Payload = null;
      if (newC.image) base64Payload = newC.image;
      else if (newC.photo) base64Payload = newC.photo;
      else if (newC.cleanerPhoto) base64Payload = newC.cleanerPhoto;
      else if (typeof newC === 'object' && Object.keys(newC).length > 0) {
        const keys = Object.keys(newC);
        const imgKey = keys.find(k => typeof newC[k] === 'string' && newC[k].startsWith('data:image'));
        if (imgKey) base64Payload = newC[imgKey];
      }

      let selectedStationName = 'Nagpur Junction';
      if (typeof newC.station === 'string' && newC.station.trim().length > 0) {
        selectedStationName = newC.station;
      } else if (newC.stationName && typeof newC.stationName === 'string') {
        selectedStationName = newC.stationName;
      } else if (newC.station && newC.station.name) {
        selectedStationName = newC.station.name;
      }

      const isDelhi = selectedStationName.toLowerCase().includes('delhi');
      const selectedStationCode  = isDelhi ? 'NDLS' : 'NGP';
      const printableStationName = isDelhi ? 'New Delhi Railway Station' : 'Nagpur Junction';

      await addDoc(collection(db, "complaints"), {
        customTicketId: ticketId,
        status: 'NEW',
        reportedAt: serverTimestamp(),
        area: newC.area || 'Platform 1',
        gtype: newC.gtype || 'Plastic Waste',
        emoji: '',
        severity: newC.severity || 'medium',
        lat: parseFloat(newC.lat) || 21.16542,
        lng: parseFloat(newC.lng) || 79.08095,
        desc: newC.desc || '',
        image: base64Payload,
        cleanerPhoto: base64Payload,
        reportedBy: newC.reportedBy || 'Citizen (App)',
        station: {
          id: selectedStationCode === 'NDLS' ? 'ndls_01' : 'ngp_01',
          name: printableStationName,
          code: selectedStationCode,
          zone: selectedStationCode === 'NDLS' ? 'Northern Railway' : 'Central Railway'
        },
        assignedTo: null,
        cleanerStatus: null,
        resolutionMins: null,
        resolvedAt: null
      });
    } catch (e) {
      console.error("Error writing document registry payload: ", e);
    }
  };

  const updateComplaint = async (docId, fields) => {
    try {
      const docRef = doc(db, "complaints", docId);
      await updateDoc(docRef, fields);
    } catch (e) {
      console.error("Error executing atomic transaction document mutation: ", e);
    }
  };

  return (
    <AppContext.Provider value={{ complaints, addComplaint, updateComplaint, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }

// ── Session helpers ───────────────────────────────────────────────────────────
const readSession  = () => { try { return JSON.parse(localStorage.getItem('matSession')); } catch { return null; } };
const writeSession = s  => { if (s) localStorage.setItem('matSession', JSON.stringify(s)); else localStorage.removeItem('matSession'); };

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const [matSession, setMatSessionState] = useState(() => readSession());

  const setMatSession = (s) => { writeSession(s); setMatSessionState(s); };

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => { window.history.pushState({}, '', path); setRoute(path); };

  return (
    <AppProvider>
      {/* Dev nav pill */}
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 99999, display: 'flex', gap: 8, background: '#0A1628', padding: '8px 12px', borderRadius: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        {['/', '/vendor', '/admin', '/cleaner', '/material-dept', '/material-worker'].map((p, idx) => {
          const names = ['Camera App', 'Vendor', 'Admin HQ', 'Cleaner Force', 'Material Dept', 'Material Worker'];
          return (
            <button key={p} onClick={() => navigate(p)} style={{ background: route === p ? '#1565C0' : '#1A2638', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {names[idx]}
            </button>
          );
        })}
      </div>

      <RenderRouteEngine currentPath={route} matSession={matSession} setMatSession={setMatSession} navigate={navigate} />
    </AppProvider>
  );
}

// ── Route engine ──────────────────────────────────────────────────────────────
function RenderRouteEngine({ currentPath, matSession, setMatSession, navigate }) {
  const { loading } = useApp();

  // "which login to show" state — null = not on a material route
  const [loginView, setLoginView] = useState(() => {
    // Default each path to its own login when no session
    if (currentPath === '/material-dept')   return 'manager';
    if (currentPath === '/material-worker') return 'worker';
    return null;
  });

  // Keep loginView in sync when route changes (e.g. dev nav pill)
  // useEffect(() => {
  //   if (currentPath === '/material-dept')   setLoginView('manager');
  //   if (currentPath === '/material-worker') setLoginView('worker');
  // }, [currentPath]);
  useEffect(() => {
  if (currentPath === '/material-dept') {
    setLoginView('manager');
    if (matSession?.route === '/material-worker') setMatSession(null);
  }
  if (currentPath === '/material-worker') {
    setLoginView('worker');
    if (matSession?.route === '/material-dept') setMatSession(null);
  }
}, [currentPath]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'sans-serif', background: '#F7F9FC', color: '#0A1628' }}>
        Initializing Railway Node Ecosystem…
      </div>
    );
  }

  // ── Standard portals ──────────────────────────────────────────────────────
  if (currentPath === '/vendor')  return <VendorPortal />;
  if (currentPath === '/admin')   return <AdminPortal />;
  if (currentPath === '/cleaner') return <CleanerPortal />;

  // ── Material routes ───────────────────────────────────────────────────────
  if (currentPath === '/material-dept' || currentPath === '/material-worker') {
    // Authenticated — render the correct portal
    if (matSession) {
      if (matSession.route === '/material-dept') {
        return (
          <MaterialDept
            preAuthUser={matSession.user}
            onLogout={() => setMatSession(null)}
          />
        );
      }
      if (matSession.route === '/material-worker') {
        return (
          <MaterialWorker
            preAuthUser={matSession.user}
            onLogout={() => setMatSession(null)}
          />
        );
      }
    }

    // Not authenticated — show the right login page
    if (loginView === 'worker') {
      return (
        <WorkerLogin
          onLogin={(session) => setMatSession(session)}
          onSwitchToManager={() => setLoginView('manager')}
        />
      );
    }
    // Default: manager login
    return (
      <ManagerLogin
        onLogin={(session) => setMatSession(session)}
        onSwitchToWorker={() => setLoginView('worker')}
      />
    );
  }

  // ── Default ───────────────────────────────────────────────────────────────
  return <UserPortal />;
}