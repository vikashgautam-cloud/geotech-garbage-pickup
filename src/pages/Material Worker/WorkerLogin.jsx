/**
 * WorkerLogin.jsx — Field Worker Authentication
 * Clean minimal government design
 */
import React, { useState } from 'react';
import { db } from '../../utils/firebase';
import { collection, getDoc, getDocs, query, where, doc } from 'firebase/firestore';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#F5F6FA;font-family:'Inter',sans-serif;}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}

.wl-page{min-height:100vh;background:#F5F6FA;display:flex;flex-direction:column;}

/* Top bar */
.wl-topbar{background:#fff;border-bottom:1px solid #E2E5EC;padding:0 40px;height:60px;display:flex;align-items:center;justify-content:space-between;}
.wl-topbar-brand{display:flex;align-items:center;gap:12px;}
.wl-topbar-logo{width:36px;height:36px;border-radius:6px;object-fit:contain;}
.wl-topbar-title{font-size:14px;font-weight:600;color:#1A1F2E;}
.wl-topbar-sub{font-size:11px;color:#6B7280;margin-top:1px;}
.wl-topbar-badge{font-size:10px;font-weight:600;color:#374151;background:#F3F4F6;border:1px solid #E2E5EC;border-radius:4px;padding:4px 10px;letter-spacing:.4px;}

/* Body */
.wl-body{flex:1;display:flex;align-items:center;justify-content:center;padding:40px 20px;}

/* Card */
.wl-card{background:#fff;border:1px solid #E2E5EC;border-radius:12px;width:100%;max-width:420px;padding:40px;animation:fadeIn .25s ease both;box-shadow:0 1px 4px rgba(0,0,0,0.06);}

/* Emblem area */
.wl-emblem{text-align:center;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid #F0F1F5;}
.wl-emblem img{width:52px;height:52px;border-radius:8px;object-fit:contain;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;}
.wl-emblem-title{font-size:16px;font-weight:700;color:#1A1F2E;margin-bottom:3px;}
.wl-emblem-sub{font-size:11px;color:#6B7280;letter-spacing:.3px;}

/* Form head */
.wl-form-head{margin-bottom:24px;}
.wl-form-label{font-size:11px;font-weight:600;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;}
.wl-form-title{font-size:20px;font-weight:700;color:#1A1F2E;}

/* Fields */
.wl-field{margin-bottom:16px;}
.wl-flbl{display:block;font-size:11px;font-weight:600;color:#374151;margin-bottom:6px;letter-spacing:.2px;}
.wl-igroup{position:relative;}
.wl-iico{position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#9CA3AF;display:flex;align-items:center;}
.wl-iico svg{width:14px;height:14px;}
.wl-input{width:100%;padding:10px 12px 10px 38px;background:#F9FAFB;border:1px solid #E2E5EC;border-radius:7px;font-size:13px;font-family:'Inter',sans-serif;color:#1A1F2E;outline:none;transition:border-color .15s,background .15s;}
.wl-input::placeholder{color:#9CA3AF;}
.wl-input:focus{border-color:#0E7A5A;background:#fff;box-shadow:0 0 0 3px rgba(14,122,90,0.06);}
.wl-input.err{border-color:#DC2626;}
.wl-eye{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;display:flex;align-items:center;padding:4px;}
.wl-eye svg{width:13px;height:13px;}

/* Error */
.wl-err{display:flex;align-items:flex-start;gap:8px;background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;padding:10px 12px;font-size:12px;color:#DC2626;margin-bottom:16px;line-height:1.5;}
.wl-err svg{width:13px;height:13px;flex-shrink:0;margin-top:1px;}

/* Info note */
.wl-note{display:flex;align-items:flex-start;gap:8px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:6px;padding:10px 12px;font-size:11px;color:#166534;margin-bottom:16px;line-height:1.5;}
.wl-note svg{width:12px;height:12px;flex-shrink:0;margin-top:1px;}

/* Button */
.wl-btn{width:100%;padding:11px;background:#0E7A5A;border:none;border-radius:7px;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .15s;margin-top:4px;}
.wl-btn:hover:not(:disabled){background:#0A5E45;}
.wl-btn:disabled{opacity:.5;cursor:not-allowed;}
.wl-spin{width:13px;height:13px;border:1.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;}

/* Switch */
.wl-switch{text-align:center;margin-top:20px;font-size:12px;color:#6B7280;}
.wl-switch a{color:#0E7A5A;font-weight:500;text-decoration:none;cursor:pointer;}

/* Footer */
.wl-footer{text-align:center;padding:16px;font-size:10px;color:#9CA3AF;border-top:1px solid #E2E5EC;background:#fff;letter-spacing:.4px;}

@media(max-width:480px){
  .wl-topbar{padding:0 16px;}
  .wl-card{padding:28px 20px;}
}
`;

const IUser = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const ILock = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IEye = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IEyeOff = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IAlert = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IInfo = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const IArrow = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

export default function WorkerLogin({ onLogin, onSwitchToManager }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authenticate = async () => {
    setError('');
    if (!userId.trim()) { setError('Worker ID is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }
    setLoading(true);
    const cleanId = userId.trim().toLowerCase();
    try {
      let workerData = null, workerArea = null;
      const vSnap = await getDocs(collection(db, 'vendors'));
      for (const vDoc of vSnap.docs) {
        const wSnap = await getDocs(
          query(collection(db, 'vendors', vDoc.id, 'workers'), where('loginId', '==', cleanId))
        );
        if (!wSnap.empty) {
          workerData = wSnap.docs[0].data();
          workerArea = vDoc.id;
          break;
        }
      }
      if (!workerData) {
        const rootSnap = await getDoc(doc(db, 'workers', cleanId));
        if (rootSnap.exists()) {
          workerData = rootSnap.data();
          workerArea = workerData.vendorId || 'root';
        }
      }
      if (!workerData) {
        setError('No account found for this ID. Contact your supervisor.');
        setLoading(false);
        return;
      }
      const wPwd = workerData.password || workerData.loginPassword;
      if (String(wPwd) !== String(password)) {
        setError('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }
      onLogin?.({
        role: 'worker',
        route: '/material-worker',
        user: {
          id: cleanId,
          name: workerData.workerName || workerData.name || cleanId,
          area: workerArea,
          vendorId: workerArea,
        },
      });
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onKey = e => e.key === 'Enter' && authenticate();

  return (
    <><style>{CSS}</style>
    <div className="wl-page">
      <div className="wl-topbar">
        <div className="wl-topbar-brand">
          <img src="/logo.jpeg" alt="logo" className="wl-topbar-logo" />
          <div>
            <div className="wl-topbar-title">Railway Material Management System</div>
            <div className="wl-topbar-sub">Central Railway · Nagpur Division</div>
          </div>
        </div>
        <div className="wl-topbar-badge">FIELD WORKER PORTAL</div>
      </div>

      <div className="wl-body">
        <div className="wl-card">
          <div className="wl-emblem">
            <img src="/logo.jpeg" alt="emblem" />
            <div className="wl-emblem-title">Field Worker</div>
            <div className="wl-emblem-sub">NAGPUR JUNCTION · CENTRAL RAILWAY</div>
          </div>

          <div className="wl-form-head">
            <div className="wl-form-label">Secure Sign In</div>
            <div className="wl-form-title">Worker Login</div>
          </div>

          {error && (
            <div className="wl-err"><IAlert /><span>{error}</span></div>
          )}

          <div className="wl-field">
            <label className="wl-flbl">Worker ID</label>
            <div className="wl-igroup">
              <span className="wl-iico"><IUser /></span>
              <input
                className={`wl-input${error ? ' err' : ''}`}
                type="text" placeholder="Enter your worker ID"
                value={userId}
                onChange={e => { setUserId(e.target.value); setError(''); }}
                onKeyDown={onKey}
                autoCapitalize="none" autoCorrect="off" autoComplete="username"
              />
            </div>
          </div>

          <div className="wl-field">
            <label className="wl-flbl">Password</label>
            <div className="wl-igroup">
              <span className="wl-iico"><ILock /></span>
              <input
                className={`wl-input${error ? ' err' : ''}`}
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={onKey}
                autoComplete="current-password"
                style={{ paddingRight: 38 }}
              />
              <button className="wl-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1} type="button">
                {showPwd ? <IEyeOff /> : <IEye />}
              </button>
            </div>
          </div>

          <div className="wl-note">
            <IInfo />
            <span>Credentials are issued by your department supervisor. Contact them if you need access.</span>
          </div>

          <button className="wl-btn" onClick={authenticate} disabled={loading}>
            {loading ? <><div className="wl-spin" />Signing in…</> : <>Sign In <IArrow /></>}
          </button>
{/* 
          <div className="wl-switch">
            Department manager?{' '}
            <a onClick={onSwitchToManager}>Manager login →</a>
          </div> */}
        </div>
      </div>

      <footer className="wl-footer">
        RAILWAY MATERIAL MANAGEMENT SYSTEM v2.0 · CENTRAL RAILWAY · NAGPUR DIVISION
      </footer>
    </div>
    </>
  );
}