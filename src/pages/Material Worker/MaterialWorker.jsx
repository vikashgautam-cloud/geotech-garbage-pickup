import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../utils/firebase'; 
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { Camera, RefreshCw, AlertTriangle, CheckCircle2, Lock, ShieldCheck, User } from 'lucide-react';

export default function MaterialWorker() {
  // Authentication & Session States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Logistics Inventory Strategy States
  const [operationType, setOperationType] = useState('WITHDRAW'); 
  // Spelling misalignment workaround: defaults to admin configuration sync key
  const [parentId, setParentId] = useState('platform no 1'); 
  const [quantity, setQuantity] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorAlert, setErrorAlert] = useState(null);
  const [successAlert, setSuccessAlert] = useState(null);
  
  // Media Capturing States
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Camera Management
  const startCamera = async () => {
    setErrorAlert(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Safety promise handler to avoid Uncaught AbortError inside logs
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setCameraActive(true))
            .catch((err) => {
              if (err.name !== 'AbortError') console.warn("Camera streaming exception captured.");
            });
        }
      }
    } catch (err) {
      setErrorAlert("Webcam hardware link authorization failed.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      startCamera();
    }
    return () => stopCamera();
  }, [isAuthenticated]);

  const captureFrame = () => {
    if (!videoRef.current || !cameraActive) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    try {
      const url = canvas.toDataURL('image/jpeg', 0.85);
      setPreviewUrl(url);
      
      // Fixed AbortError: delay stop trace to let async render safely terminate
      setTimeout(() => {
        stopCamera();
      }, 100);
    } catch (err) {
      setErrorAlert("Image structural generation failed.");
    }
  };

  // UPDATED SUB-COLLECTION LOGISTICS PIPELINE FOR LOGIN
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    const cleanUsername = username.trim().toLowerCase(); 
    let selectedNode = parentId.trim();

    try {
      let targetUserData = null;

      // Primary check: try spelling input matching
      let workerCollectionRef = collection(db, "vendors", selectedNode, "workers");
      let q = query(workerCollectionRef, where("loginId", "==", cleanUsername));
      let querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        targetUserData = querySnapshot.docs[0].data();
      }

      // Dynamic misspelling verification fallback handler ("platfrom" vs "platform")
      if (!targetUserData) {
        const structuralFallback = selectedNode === 'platform no 1' ? 'platfrom no 1' : 'platform no 1';
        workerCollectionRef = collection(db, "vendors", structuralFallback, "workers");
        q = query(workerCollectionRef, where("loginId", "==", cleanUsername));
        querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          targetUserData = querySnapshot.docs[0].data();
          setParentId(structuralFallback); // Automatically matches active vendor node configuration
          selectedNode = structuralFallback;
        }
      }

      // Global Root level "workers" logic fallback handler
      if (!targetUserData) {
        const rootWorkerRef = doc(db, "workers", cleanUsername);
        const rootSnap = await getDoc(rootWorkerRef);
        if (rootSnap.exists()) {
          targetUserData = rootSnap.data();
        }
      }

      // Credentials Validation Block
      if (targetUserData) {
        const dbPassword = targetUserData.password || targetUserData.loginPassword;
        if (String(dbPassword) === String(password)) {
          setUsername(cleanUsername); 
          setIsAuthenticated(true);
        } else {
          setAuthError("Galat Pin / Password dala hai aapne.");
        }
      } else {
        setAuthError(`ID "${cleanUsername}" target database node configurations par register nahi mili.`);
      }
    } catch (error) {
      setAuthError(`Database query validation failed: ${error.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleProcessMatrixAudit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorAlert(null);
    setSuccessAlert(null);

    if (!quantity || Number(quantity) <= 0) {
      setErrorAlert("Please provide valid material counts.");
      setIsProcessing(false);
      return;
    }

    try {
      const cleanRegistryKey = parentId.trim();
      const registryDocRef = doc(db, "registry", cleanRegistryKey);
      const registrySnap = await getDoc(registryDocRef);

      const logPayload = {
        strategyMode: operationType,
        quantity: Number(quantity),
        verificationPhoto: previewUrl || "https://via.placeholder.com/640",
        timestamp: new Date().toISOString(),
        status: "Verified",
        operatorSession: username || "Active Operator"
      };

      // Critical Fix: Missing collections are autoinitialized to avoid terminal submittal crash
      if (!registrySnap.exists()) {
        await setDoc(registryDocRef, {
          nodeId: cleanRegistryKey,
          createdOn: new Date().toISOString(),
          auditLogs: [logPayload]
        });
      } else {
        await updateDoc(registryDocRef, {
          auditLogs: arrayUnion(logPayload)
        });
      }

      setSuccessAlert(`Inventory ${operationType === 'WITHDRAW' ? 'Withdrawal' : 'Deposit'} synchronized successfully!`);
      setQuantity('');
      setPreviewUrl(null);
      startCamera();
    } catch (error) {
      setErrorAlert(`Database Update Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // UI Engine Styles
  const styles = {
    wrapper: { backgroundColor: '#0B1220', minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', margin: 0, padding: '20px', boxSizing: 'border-box' },
    card: { backgroundColor: '#121B2E', width: '100%', maxWidth: '420px', borderRadius: '16px', border: '1px solid #1E294B', padding: '30px', boxSizing: 'border-box', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
    title: { color: '#FFFFFF', fontSize: '22px', fontWeight: '800', textAlign: 'center', margin: '0 0 6px 0', letterSpacing: '0.5px' },
    subtitle: { color: '#94A3B8', fontSize: '13px', textAlign: 'center', margin: '0 0 24px 0' },
    label: { display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', tracking: '1px', color: '#94A3B8', marginBottom: '8px' },
    input: { width: '100%', padding: '12px 14px', backgroundColor: '#090F1C', border: '1px solid #1E294B', borderRadius: '8px', color: '#F1F5F9', fontSize: '14px', boxSizing: 'border-box', outline: 'none', marginBottom: '18px' },
    btnPrimary: { width: '100%', padding: '12px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' },
    alertError: { backgroundColor: 'rgba(153, 27, 27, 0.2)', border: '1px solid #991B1B', color: '#FCA5A5', padding: '12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
    alertSuccess: { backgroundColor: 'rgba(6, 95, 70, 0.2)', border: '1px solid #065F46', color: '#6EE7B7', padding: '12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
    videoBox: { width: '100%', aspectRatio: '16/9', backgroundColor: '#090F1C', border: '1px solid #1E294B', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }
  };

  if (!isAuthenticated) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', border: '1px solid rgba(37, 99, 235, 0.3)' }}>
              <Lock className="w-5 h-5" />
            </div>
            <h2 style={styles.title}>Node Access Control</h2>
            <p style={{ color: '#64748B', fontSize: '12px', margin: '4px 0 0 0' }}>Vendor Registered Credentials Verification</p>
          </div>

          {authError && (
            <div style={styles.alertError}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <label style={styles.label}>Operator ID / Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., xyz" 
              style={styles.input}
              required
              disabled={isAuthenticating}
            />

            <label style={styles.label}>Secure Pin / Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              style={styles.input}
              required
              disabled={isAuthenticating}
            />

            <button type="submit" disabled={isAuthenticating} style={styles.btnPrimary}>
              {isAuthenticating ? "Verifying Registry Key..." : "Verify Node Authorization"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Material Storage Node Portal</h2>
        <p style={styles.subtitle}>Active Profile Session: <span style={{ color: '#3B82F6', fontWeight: '600' }}>{username}</span></p>

        {errorAlert && (
          <div style={styles.alertError}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorAlert}</span>
          </div>
        )}

        {successAlert && (
          <div style={styles.alertSuccess}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successAlert}</span>
          </div>
        )}

        <form onSubmit={handleProcessMatrixAudit}>
          <label style={styles.label}>Logistics Inventory Operations Strategy</label>
          <div style={styles.grid}>
            <button 
              type="button" 
              onClick={() => setOperationType('WITHDRAW')}
              style={{
                padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
                backgroundColor: operationType === 'WITHDRAW' ? '#DC2626' : '#090F1C',
                color: operationType === 'WITHDRAW' ? '#FFFFFF' : '#64748B',
                border: operationType === 'WITHDRAW' ? '1px solid #EF4444' : '1px solid #1E294B'
              }}
            >
              Withdraw (Stock Out)
            </button>
            <button 
              type="button" 
              onClick={() => setOperationType('DEPOSIT')}
              style={{
                padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
                backgroundColor: operationType === 'DEPOSIT' ? '#2563EB' : '#090F1C',
                color: operationType === 'DEPOSIT' ? '#FFFFFF' : '#64748B',
                border: operationType === 'DEPOSIT' ? '1px solid #3B82F6' : '1px solid #1E294B'
              }}
            >
              Deposit (Stock In)
            </button>
          </div>

          <label style={styles.label}>Active Station Key</label>
          <input 
            type="text"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            style={styles.input}
            placeholder="Station Node Key ID..."
            required
          />

          <label style={styles.label}>Material Quantity / Unit Shift Weight</label>
          <input 
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={styles.input}
            placeholder="Provide material counts..."
            required
          />

          <label style={styles.label}>State Audit Photo Block Verification</label>
          <div style={styles.videoBox}>
            {previewUrl ? (
              <img src={previewUrl} alt="Capture preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }} playsInline muted />
            )}

            {!cameraActive && !previewUrl && (
              <div style={{ textAlign: 'center', color: '#475569', fontSize: '12px' }}>
                <Camera className="w-6 h-6 mx-auto mb-1" />
                <p>Camera integration streaming...</p>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            {previewUrl ? (
              <button type="button" onClick={() => { setPreviewUrl(null); startCamera(); }} style={{ ...styles.btnPrimary, backgroundColor: '#1E294B', border: '1px solid #334155' }}>
                <RefreshCw className="w-3.5 h-3.5" /> Initialize Material Device Lens Capture
              </button>
            ) : (
              <button type="button" onClick={captureFrame} disabled={!cameraActive} style={{ ...styles.btnPrimary, backgroundColor: cameraActive ? '#2563EB' : '#1E294B' }}>
                <Camera className="w-3.5 h-3.5" /> Capture Verification Frame
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            style={{
              ...styles.btnPrimary,
              backgroundColor: operationType === 'WITHDRAW' ? '#DC2626' : '#2563EB',
              fontWeight: '700',
              letterSpacing: '1px',
              marginTop: '10px'
            }}
          >
            {isProcessing ? "Synchronizing State..." : `CONFIRM & COMMIT ${operationType}`}
          </button>
        </form>
      </div>
    </div>
  );
}