import React, { useState, useRef } from 'react';
import { useApp } from '../../App';
import { Sidebar } from '../../components/Sidebar';
import LiveMap from '../../components/LiveMap';

// Firebase Drivers
import { db } from '../../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function CleanerPortal() {
  const { complaints, updateComplaint } = useApp();

  // Authentication Interface States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cleanerLoginId, setCleanerLoginId] = useState('');
  const [cleanerPassword, setCleanerPassword] = useState('');
  const [activeCleanerData, setActiveCleanerData] = useState(null);
  const [assignedVendorStation, setAssignedVendorStation] = useState('');

  // Operational Workflow Control States
  const [selected, setSelected] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  // LIVE CAMERA FEED CONTROLLERS
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturingLoading, setIsCapturingLoading] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Active Job Orders Matching Logic Stream
  const activeTasks = complaints.filter(c => 
    c.assignedTo?.toLowerCase().trim() === activeCleanerData?.name?.toLowerCase().trim() && 
    ['ASSIGNED_TO_CLEANER', 'CLEANED_BY_FORCE'].includes(c.status)
  );

  // ── AUTH ENGINE RUNTIME ──
  const handleCleanerLoginAuth = async (e) => {
    e.preventDefault();
    const searchCleanerId = cleanerLoginId.trim().toLowerCase();
    const searchPassword = cleanerPassword.trim();

    if (!searchCleanerId || !searchPassword) {
      return alert("Please enter your login details.");
    }

    setIsAuthLoading(true);

    try {
      const rootVendorsRef = collection(db, "vendors");
      const rootSnap = await getDocs(rootVendorsRef);
      
      let authenticatedStaff = null;
      let matchedStationId = 'Dynamic Station Node';

      // Har ek Vendor doc check ho raha hai
      for (const vDoc of rootSnap.docs) {
        const subCleanersRef = collection(db, "vendors", vDoc.id, "cleaners");
        const subSnap = await getDocs(subCleanersRef);
        
        subSnap.forEach((cDoc) => {
          const data = cDoc.data();
          const dbLoginId = String(data.phone || data.loginId || data.name || cDoc.id).toLowerCase().trim();
          const dbPassword = String(data.password || '').trim();

          if (dbLoginId === searchCleanerId && dbPassword === searchPassword) {
            authenticatedStaff = data;
            matchedStationId = vDoc.id; // Yeh auto-sync karega aapke platform naming rules ko
          }
        });

        if (authenticatedStaff) break;
      }

      if (authenticatedStaff) {
        setAssignedVendorStation(matchedStationId);
        setActiveCleanerData(authenticatedStaff);
        setIsAuthenticated(true);
      } else {
        alert("Authentication Failed: Invalid ID/Password mismatch.");
      }
    } catch (err) {
      console.error("Authentication Loop Error:", err);
      alert("Database matrix stream network sync failed (Status 400).");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // ── NATIVE HARDWARE CAMERA STREAM ENGINES (FIXED ABORTERROR) ──
  const startDeviceCameraFeed = async () => {
    setCapturedPhoto(null);
    setIsCameraActive(true);
    try {
      const hardwareStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }, // optimized viewport dimensions
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = hardwareStream;
        
        // Safety Catch Wrapper block embedded directly here
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Field camera stream matrix initiated successfully.");
            })
            .catch((err) => {
              if (err.name === 'AbortError') {
                console.warn("Camera play initialization safely intercepted during rapid re-render loop.");
              } else {
                console.error("Camera interface failure:", err);
              }
            });
        }
      }
    } catch (err) {
      console.error("Camera access blocked: ", err);
      alert("Hardware Blocked: Grant camera permissions inside browser settings.");
      setIsCameraActive(false);
    }
  };

  const captureSnapshotFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      const width = videoRef.current.videoWidth || 640;
      const height = videoRef.current.videoHeight || 480;
      
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      
      // Draw image to canvas component memory
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      
      // Conversion to lightweight Base64 string for direct upload
      const base64DataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(base64DataUrl);
      
      stopDeviceCameraFeed(); // Stop track loops to save device battery
    }
  };

  const stopDeviceCameraFeed = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const activeTracks = videoRef.current.srcObject.getTracks();
      activeTracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleSendProofToVendor = async (taskId) => {
    if (!capturedPhoto) {
      return alert("Action Required: Click and capture an after-clean site photo first!");
    }

    setIsCapturingLoading(true);
    try {
      await updateComplaint(taskId, {
        status: 'CLEANED_BY_FORCE',
        cleanerStatus: 'DONE',
        cleanerPhoto: capturedPhoto 
      });

      alert("Success! Live photo proof dispatched to Vendor verification layout dashboard.");
      setCapturedPhoto(null);
      setSelected(null);
    } catch (err) {
      alert("Failed sync with backend nodes.");
    } finally {
      setIsCapturingLoading(false);
    }
  };

  const handleLogout = () => {
    stopDeviceCameraFeed();
    setIsAuthenticated(false);
    setActiveCleanerData(null);
    setAssignedVendorStation('');
    setCleanerLoginId('');
    setCleanerPassword('');
    setSelected(null);
    setCapturedPhoto(null);
  };

  /* ── VIEWPORT INTERFACE 1: FIELD LOGGING SECURITY ACCESS GATEWAY ── */
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0F172A', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#fff', padding: '34px 28px', borderRadius: 16, width: 340, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>🧹</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>Field Force Login</div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>GRWMS Cleaner Node</div>
          </div>
          <form onSubmit={handleCleanerLoginAuth}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 5 }}>CLEANER LOGIN ID</label>
              <input type="text" value={cleanerLoginId} onChange={e => setCleanerLoginId(e.target.value)} placeholder="e.g. vikash" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', boxSizing: 'border-box', fontSize: 13 }} required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 5 }}>APP ACCESS PASSWORD</label>
              <input type="password" value={cleanerPassword} onChange={e => setCleanerPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', boxSizing: 'border-box', fontSize: 13 }} required />
            </div>
            <button type="submit" disabled={isAuthLoading} style={{ width: '100%', padding: 12, background: isAuthLoading ? '#94A3B8' : '#10B981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: isAuthLoading ? 'not-allowed' : 'pointer' }}>
              {isAuthLoading ? "Scanning System Matrix..." : "Sign In & Sync Work Orders"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── VIEWPORT INTERFACE 2: MAIN WORKSPACE DESKTOP APP ENGINE ── */
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F7F9FC', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      
      <Sidebar 
        title="Field Force Ledger" 
        subtitle={`Operator: ${activeCleanerData?.name}`} 
        navItems={[{ key: 'JOBS', label: 'Assigned Sweeps', icon: '🧹', count: activeTasks.length }]} 
        activeTab="JOBS" 
        onTabChange={() => {}} 
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Operational Context Bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 12, color: '#64748B' }}>Auto-Detected Station Node: </span>
            <strong style={{ fontSize: 12, color: '#0F172A', textTransform: 'uppercase' }}>{assignedVendorStation}</strong>
          </div>
          <button onClick={handleLogout} style={{ background: '#F1F5F9', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#475569' }}>
            Logout Session
          </button>
        </div>

        {/* Operational Split Layout Layout Windows */}
        <div style={{ flex: 1, display: 'flex', padding: 20, gap: 16, overflow: 'hidden' }}>
          
          {/* LEFT RUNNING WORKLIST PANELS */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 14, color: '#0F172A', margin: '0 0 2px 0', fontWeight: 800 }}>📋 Operational Duty Worklist</h3>
            
            {activeTasks.length === 0 ? (
              <div style={{ background: '#fff', padding: 30, borderRadius: 12, border: '1px solid #DDE3E9', textAlign: 'center', color: '#7A8FA6', fontSize: 13 }}>
                No active duty jobs matching your crew deployment name right now.
              </div>
            ) : (
              activeTasks.map(t => {
                const isDispatched = t.status === 'CLEANED_BY_FORCE';
                return (
                  <div 
                    key={t.id} 
                    onClick={() => { setSelected(t); setCapturedPhoto(null); stopDeviceCameraFeed(); }} 
                    style={{ 
                      background: isDispatched ? '#FFFBEB' : '#fff', 
                      padding: 14, 
                      borderRadius: 12, 
                      border: `1px solid ${selected?.id === t.id ? '#1565C0' : isDispatched ? '#FDE68A' : '#DDE3E9'}`, 
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>📍 {t.area || 'Platform Site Area'}</div>
                      {isDispatched && (
                        <span style={{ background: '#D97706', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Awaiting Audit</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                      Ref Code ID: <strong>{t.customTicketId || t.id?.substring(0, 5)}</strong> | Hazard: {t.title || t.gtype}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT VIEWSPACE WORKSTATION MATRIX OVERLAY */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 14, border: '1px solid #DDE3E9', padding: 18, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
            {selected ? (
              <>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: 14, color: '#0F172A' }}>Deployment Target Location</h4>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Target spatial telemetry parameters</span>
                </div>

                <LiveMap singlePin={true} singleCoords={{ lat: selected.lat, lng: selected.lng }} height="130px" />

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', display: 'block', marginBottom: 6 }}>⚠️ CITIZEN INITIAL DISPATCH TRACE (BEFORE CLEAN):</span>
                  {(selected.imageUrl || selected.image || selected.photoUrl || selected.photo) ? (
                    <img 
                      src={selected.imageUrl || selected.image || selected.photoUrl || selected.photo} 
                      alt="Citizen trace data evidence" 
                      style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid #FCA5A5' }} 
                      onError={(e) => { e.target.style.display = 'none'; alert("Image asset path corrupted or expired inside remote server storage logs."); }}
                    />
                  ) : (
                    <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, fontSize: 11, color: '#64748B', textAlign: 'center', fontStyle: 'italic', border: '1px dashed #CBD5E1' }}>
                      No baseline visual asset attached by reporting user module.
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: 12, color: '#0F172A', fontWeight: 800 }}>🛠️ CLEANER DEPLOYMENT CLOSEOUT ACTION</h4>
                  
                  {selected.status === 'ASSIGNED_TO_CLEANER' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      
                      <canvas ref={canvasRef} style={{ display: 'none' }} />

                      {/* Camera View Window Layer */}
                      {isCameraActive && (
                        <div style={{ background: '#000', borderRadius: 10, overflow: 'hidden', position: 'relative', display: 'flex' }}>
                          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                          <button onClick={captureSnapshotFrame} type="button" style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', fontSize: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>📸</button>
                        </div>
                      )}

                      {/* Preview Mirror */}
                      {capturedPhoto && (
                        <div>
                          <span style={{ fontSize: 10, color: '#059669', fontWeight: 700, display: 'block', marginBottom: 4 }}>✓ FRESH PHOTO ATTACHED SUCCESSFULLY:</span>
                          <img src={capturedPhoto} alt="Captured frame capture" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '2px solid #10B981' }} />
                        </div>
                      )}

                      {!isCameraActive && (
                        <button onClick={startDeviceCameraFeed} type="button" style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontWeight: 700, fontSize: 12, cursor: 'pointer', textAlign: 'center' }}>
                          📷 {capturedPhoto ? "Retake / Re-Open Camera Stream" : "Open Camera & Capture Clean Photo"}
                        </button>
                      )}

                      {isCameraActive && (
                        <button onClick={stopDeviceCameraFeed} type="button" style={{ background: '#64748B', color: '#fff', border: 'none', borderRadius: 8, padding: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                          Cancel Stream Mode
                        </button>
                      )}

                      <button 
                        onClick={() => handleSendProofToVendor(selected.id)} 
                        disabled={!capturedPhoto || isCapturingLoading} 
                        style={{ 
                          width: '100%', 
                          background: (!capturedPhoto || isCapturingLoading) ? '#CBD5E1' : '#10B981', 
                          color: '#fff', 
                          padding: 12, 
                          border: 'none', 
                          borderRadius: 8, 
                          fontWeight: 700, 
                          fontSize: 12, 
                          cursor: (!capturedPhoto || isCapturingLoading) ? 'not-allowed' : 'pointer',
                          marginTop: 4
                        }}
                      >
                        {isCapturingLoading ? "Uploading Heavy Data Blocks..." : "Dispatch Job to Vendor Audit Grid"}
                      </button>

                    </div>
                  ) : (
                    <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309', marginBottom: 3 }}>⏳ Awaiting Asset Verification</div>
                      <div style={{ fontSize: 11, color: '#4B5563' }}>Task submitted! Waiting for Vendor Head to inspect your captured photo and mark as officially COMPLETED.</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ margin: 'auto', color: '#94A3B8', fontSize: 12, textAlign: 'center' }}>Select an active duty ticket from the layout matrix to display mapping and camera controls.</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}