import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { ArrowUpRight, ArrowDownLeft, Calendar, User, Layers, AlertCircle, Shield, Trash2, PlusCircle, MapPin } from 'lucide-react';

export default function MaterialDept() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Dynamic Session Storage (No more hardcoded platforms!)
  const [assignedArea, setAssignedArea] = useState(''); 
  const [logisticsSector, setLogisticsSector] = useState('');

  // Workers CRUD States
  const [workersList, setWorkersList] = useState([]);
  const [workerName, setWorkerName] = useState('');
  const [workerLogin, setWorkerLogin] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');
  const [isAddingWorker, setIsAddingWorker] = useState(false);

  // Live Audit Array Matrix
  const [transactionLogs, setTransactionLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // 1. LIVE TRANSACTION MATRIX STREAM (DYNAMIC ROUTING)
  useEffect(() => {
    if (!isAuthenticated || !assignedArea) return;

    setIsLoadingLogs(true);
    
    // Database reference matching the exact assigned area string
    const targetKey = assignedArea.trim();
    const registryDocRef = doc(db, "registry", targetKey);

    const unsubscribe = onSnapshot(registryDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.auditLogs && Array.isArray(data.auditLogs)) {
          setTransactionLogs([...data.auditLogs].reverse());
        } else {
          setTransactionLogs([]);
        }
      } else {
        setTransactionLogs([]);
      }
      setIsLoadingLogs(false);
    }, (error) => {
      console.error("Firestore audit stream reading error:", error);
      setIsLoadingLogs(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated, assignedArea]);

  // 2. WORKERS LIVE SYNCHRONIZER
  const syncWorkersCollection = async (areaKey) => {
    try {
      const targetWorkerCollection = collection(db, "vendors", areaKey.trim(), "workers");
      const snap = await getDocs(targetWorkerCollection);
      const workers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkersList(workers);
    } catch (err) {
      console.error("Failed to query localized worker array:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && assignedArea) {
      syncWorkersCollection(assignedArea);
    }
  }, [isAuthenticated, assignedArea]);

  // 3. SECURE AUTHENTICATION GATE & DYNAMIC AREA CAPTURE
  const handleAdminAuthGate = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    const cleanUser = adminId.trim();

    try {
      // Admin collection snapshot validation lock
      const primaryVendorDocRef = doc(db, "vendors", cleanUser);
      let vendorSnap = await getDoc(primaryVendorDocRef);

      let vendorData = null;
      if (!vendorSnap.exists()) {
        const structuralCollections = ["vendors", "registry"];
        for (const colName of structuralCollections) {
          const q = query(collection(db, colName), where("vendorId", "==", cleanUser));
          const scanSnap = await getDocs(q);
          if (!scanSnap.empty) {
            vendorData = scanSnap.docs[0].data();
            break;
          }
        }
      } else {
        vendorData = vendorSnap.data();
      }

      if (vendorData) {
        const secureValidationKey = vendorData.accessPassword || vendorData.password;
        if (String(secureValidationKey) === String(password)) {
          
          // DYNAMIC ALLOCATION LOCK
          // Pulling directly from 'targetArea' or 'assignStationTerminal' assigned by HQ
          const rawArea = vendorData.targetArea || vendorData.assignStationTerminal || 'Circulating Area (Main Gate)';
          const rawSector = vendorData.logisticsSectorType || 'MATERIAL HUB';

          setAssignedArea(rawArea);
          setLogisticsSector(rawSector);
          setIsAuthenticated(true);
        } else {
          setAuthError("Invalid access password parameter.");
        }
      } else {
        setAuthError(`Vendor identity token "${cleanUser}" lookup failure.`);
      }
    } catch (err) {
      setAuthError(`Network auth initialization timeout: ${err.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 4. CRUD - CREATE LOCALIZED WORKER
  const handleRegisterWorker = async (e) => {
    e.preventDefault();
    if (!workerName || !workerLogin || !workerPassword) return;

    setIsAddingWorker(true);
    try {
      const targetWorkerCollection = collection(db, "vendors", assignedArea.trim(), "workers");

      await addDoc(targetWorkerCollection, {
        workerName: workerName.trim(),
        loginId: workerLogin.trim().toLowerCase(),
        password: workerPassword.trim(),
        createdOn: new Date().toISOString()
      });

      setWorkerName('');
      setWorkerLogin('');
      setWorkerPassword('');
      await syncWorkersCollection(assignedArea);
    } catch (err) {
      alert(`Worker synchronization fault: ${err.message}`);
    } finally {
      setIsAddingWorker(false);
    }
  };

  // 5. CRUD - DELETE LOCALIZED WORKER
  const handleRemoveWorker = async (workerId) => {
    if (!window.confirm("Are you sure you want to delete this operator profile?")) return;
    try {
      const workerDocTarget = doc(db, "vendors", assignedArea.trim(), "workers", workerId);
      await deleteDoc(workerDocTarget);
      await syncWorkersCollection(assignedArea);
    } catch (err) {
      alert(`Failed to delete profile segment: ${err.message}`);
    }
  };

  // UI Engine Styles
  const styles = {
    layout: { padding: '24px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'sans-serif', boxSizing: 'border-box' },
    authWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1220' },
    authCard: { backgroundColor: '#FFFFFF', padding: '35px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    panelCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
    metaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F172A', padding: '16px 24px', borderRadius: '12px', color: '#FFFFFF', marginBottom: '24px' },
    input: { padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF', width: '100%', boxSizing: 'border-box' },
    submitBtn: { padding: '10px 20px', backgroundColor: '#10B981', color: '#FFFFFF', fontWeight: '600', fontSize: '14px', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }
  };

  if (!isAuthenticated) {
    return (
      <div style={styles.authWrapper}>
        <div style={styles.authCard}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0' }}>Material Storage Dept</h2>
            <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>Admin Node Authentication Gate</p>
          </div>
          {authError && <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', color: '#B91C1C', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px' }}>{authError}</div>}
          <form onSubmit={handleAdminAuthGate}>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '6px' }}>Admin Control ID</label>
            <input type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} style={{ ...styles.input, marginBottom: '16px' }} placeholder="e.g., abc" required />
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '6px' }}>Secure Access Pin</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...styles.input, marginBottom: '20px' }} placeholder="••••••••" required />
            <button type="submit" disabled={isAuthenticating} style={{ ...styles.submitBtn, width: '100%', justifyContent: 'center', backgroundColor: '#10B981' }}>
              {isAuthenticating ? "Verifying Token..." : "Verify & Unlock Panel"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      {/* 1. DYNAMIC METADATA STATUS BAR */}
      <div style={styles.metaHeader}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0' }}>Material Storage Staff Management (CRUD)</h1>
          <p style={{ color: '#94A3B8', fontSize: '13px', margin: '4px 0 0 0' }}>Manage assigned checkpoint teams & live audit logs tracking.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: '#1E293B', padding: '10px 16px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Area: <b style={{ color: '#F8FAFC' }}>{assignedArea}</b></span>
          </div>
          <div style={{ backgroundColor: '#1E293B', padding: '10px 16px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield className="w-4 h-4 text-blue-400" />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Sector: <b style={{ color: '#3B82F6' }}>{logisticsSector}</b></span>
          </div>
        </div>
      </div>

      {/* 2. OPERATORS DEPLOYMENT FORM */}
      <div style={styles.panelCard}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', margin: '0 0 16px 0', letterSpacing: '0.5px' }}>
          Deploy Active Node Operators at [{assignedArea}]
        </h3>
        <form onSubmit={handleRegisterWorker} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>WORKER / OPERATOR NAME</label>
            <input type="text" value={workerName} onChange={(e) => setWorkerName(e.target.value)} placeholder="e.g., Ramesh Kumar" style={styles.input} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>PHONE / LOGIN ID</label>
            <input type="text" value={workerLogin} onChange={(e) => setWorkerLogin(e.target.value)} placeholder="Username / ID" style={styles.input} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>LOGIN PASSWORD</label>
            <input type="password" value={workerPassword} onChange={(e) => setWorkerPassword(e.target.value)} placeholder="••••••••" style={styles.input} required />
          </div>
          <button type="submit" disabled={isAddingWorker} style={styles.submitBtn}>
            <PlusCircle className="w-4 h-4" /> Add Worker
          </button>
        </form>

        {/* ACTIVE ROSTER */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
          {workersList.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>No workers registered under this workspace module.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {workersList.map((worker) => (
                <div key={worker.id} style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', width: '300px', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>{worker.workerName}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>ID: <b>{worker.loginId}</b> | Pin: <b>{worker.password}</b></div>
                  </div>
                  <button onClick={() => handleRemoveWorker(worker.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. AUDIT TRANSACTION LOGS */}
      <div style={styles.panelCard}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
          <Layers className="w-5 h-5 text-blue-500" /> Live Terminal Activity Audit Stream Matrix
        </h2>

        {isLoadingLogs ? (
          <p style={{ color: '#64748B', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Loading transaction matrix stream...</p>
        ) : transactionLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', border: '2px dashed #E2E8F0', borderRadius: '8px' }}>
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p style={{ fontSize: '14px' }}>Is tracking checkpoint par abhi tak koi digital update transaction lock nahi mila.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '12px', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>Strategy Mode</th>
                  <th style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '12px', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>Quantity</th>
                  <th style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '12px', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>Operator Session</th>
                  <th style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '12px', fontWeight: '600', borderBottom: '1px solid #E2E8F0' }}>Timestamp</th>
                  <th style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '12px', fontWeight: '600', borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>Verification Proof</th>
                </tr>
              </thead>
              <tbody>
                {transactionLogs.map((log, index) => {
                  const isDeposit = log.strategyMode === 'DEPOSIT';
                  return (
                    <tr key={index}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={isDeposit ? { ...styles.badge, backgroundColor: '#DCFCE7', color: '#15803D' } : { ...styles.badge, backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
                          {isDeposit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {log.strategyMode}
                        </span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #F1F5F9', fontWeight: '700', color: '#0F172A' }}>{log.quantity} Units</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #F1F5F9', color: '#334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User className="w-4 h-4 text-slate-400" />
                          <span>{log.operatorSession || 'Active Operator'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #F1F5F9', color: '#64748B', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>
                        {log.verificationPhoto ? (
                          <a href={log.verificationPhoto} target="_blank" rel="noreferrer">
                            <img src={log.verificationPhoto} alt="Audit Frame" style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #CBD5E1' }} />
                          </a>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '12px' }}>No Frame Linked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}