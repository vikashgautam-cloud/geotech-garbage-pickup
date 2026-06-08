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
import ManagerLogin from './pages/Material Dept/ManagerLogin';   
import WorkerLogin  from './pages/Material Worker/WorkerLogin';    

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

// App.jsx mein AppProvider ke andar ye sahi version rakhein
const addComplaint = async (newC) => {
  try {
    // 1. Data validate karein ki kuch undefined na ho
    const payload = {
      customTicketId: `TKT-${String(complaints.length + 1001)}`,
      status: 'NEW',
      reportedAt: serverTimestamp(),
      area: newC.area || "Unknown",
      gtype: newC.gtype || "General",
      severity: newC.severity || "normal",
      lat: parseFloat(newC.lat) || 0,
      lng: parseFloat(newC.lng) || 0,
      desc: newC.desc || "", // Undefined ki jagah empty string
      image: newC.image || newC.photo || newC.cleanerPhoto || "",
      reportedBy: newC.reportedBy || "Anonymous",
      station: {
        id: newC.station?.id || null,
        name: newC.station?.name || "Unknown",
        code: newC.station?.code || "N/A",
        zone: newC.station?.zone || "N/A"
      }
    };

    await addDoc(collection(db, "complaints"), payload);
    console.log("Complaint saved successfully!");
  } catch (e) {
    console.error("Firestore Error details: ", e);
  }
};

  const updateComplaint = async (docId, fields) => {
    try {
      await updateDoc(doc(db, "complaints", docId), fields);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  return (
    <AppContext.Provider value={{ complaints, addComplaint, updateComplaint, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }

// ── Dev Navigation Component ──────────────────────────────────────────────────
const DevNav = ({ route, navigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const links = ['/', '/vendor', '/admin', '/cleaner', '/material-dept', '/material-worker'];
  const names = ['Camera App', 'Vendor', 'Admin HQ', 'Cleaner Force', 'Material Dept', 'Material Worker'];

  return (
    <>
      {isMobile && (
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100000, background: '#1565C0', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '50px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
          {isMenuOpen ? '✕' : '☰'}
        </button>
      )}

      {(isMobile ? isMenuOpen : true) && (
        <div style={{ position: 'fixed', bottom: isMobile ? 80 : 16, right: 16, zIndex: 99999, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 5, background: '#0A1628', padding: '10px', borderRadius: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          {links.map((p, idx) => (
            <button key={p} onClick={() => { navigate(p); setIsMenuOpen(false); }} style={{ background: route === p ? '#1565C0' : '#1A2638', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 15, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {names[idx]}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const [matSession, setMatSessionState] = useState(() => { try { return JSON.parse(localStorage.getItem('matSession')); } catch { return null; } });

  const setMatSession = (s) => { 
    if (s) localStorage.setItem('matSession', JSON.stringify(s)); 
    else localStorage.removeItem('matSession'); 
    setMatSessionState(s); 
  };

  const navigate = (path) => { window.history.pushState({}, '', path); setRoute(path); };

  return (
    <AppProvider>
      <DevNav route={route} navigate={navigate} />
      <RenderRouteEngine currentPath={route} matSession={matSession} setMatSession={setMatSession} navigate={navigate} />
    </AppProvider>
  );
}

// ── Route engine ──────────────────────────────────────────────────────────────
function RenderRouteEngine({ currentPath, matSession, setMatSession }) {
  const { loading } = useApp();
  const [loginView, setLoginView] = useState(currentPath === '/material-worker' ? 'worker' : 'manager');

  useEffect(() => {
    if (currentPath === '/material-dept') setLoginView('manager');
    if (currentPath === '/material-worker') setLoginView('worker');
  }, [currentPath]);

  if (loading) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading Ecosystem...</div>;

  if (currentPath === '/vendor') return <VendorPortal />;
  if (currentPath === '/admin') return <AdminPortal />;
  if (currentPath === '/cleaner') return <CleanerPortal />;
  
  if (currentPath === '/material-dept' || currentPath === '/material-worker') {
    if (matSession) {
        return matSession.route === '/material-dept' ? 
            <MaterialDept preAuthUser={matSession.user} onLogout={() => setMatSession(null)} /> : 
            <MaterialWorker preAuthUser={matSession.user} onLogout={() => setMatSession(null)} />;
    }
    return loginView === 'worker' ? 
        <WorkerLogin onLogin={setMatSession} onSwitchToManager={() => setLoginView('manager')} /> : 
        <ManagerLogin onLogin={setMatSession} onSwitchToWorker={() => setLoginView('worker')} />;
  }
  
  return <UserPortal />;
}