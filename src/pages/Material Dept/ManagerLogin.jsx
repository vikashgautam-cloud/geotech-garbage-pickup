
import React, { useState } from 'react';
import { db } from '../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#F5F6FA;font-family:'Inter',sans-serif;}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}

.ml-page{min-height:100vh;background:#F5F6FA;display:flex;flex-direction:column;}

/* Top bar */
.ml-topbar{background:#fff;border-bottom:1px solid #E2E5EC;padding:0 40px;height:60px;display:flex;align-items:center;justify-content:space-between;}
.ml-topbar-brand{display:flex;align-items:center;gap:12px;}
.ml-topbar-logo{width:36px;height:36px;border-radius:6px;object-fit:contain;}
.ml-topbar-title{font-size:14px;font-weight:600;color:#1A1F2E;}
.ml-topbar-sub{font-size:11px;color:#6B7280;margin-top:1px;}
.ml-topbar-badge{font-size:10px;font-weight:600;color:#374151;background:#F3F4F6;border:1px solid #E2E5EC;border-radius:4px;padding:4px 10px;letter-spacing:.4px;}

/* Body */
.ml-body{flex:1;display:flex;align-items:center;justify-content:center;padding:40px 20px;}

/* Card */
.ml-card{background:#fff;border:1px solid #E2E5EC;border-radius:12px;width:100%;max-width:420px;padding:40px;animation:fadeIn .25s ease both;box-shadow:0 1px 4px rgba(0,0,0,0.06);}

/* Emblem area */
.ml-emblem{text-align:center;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid #F0F1F5;}
.ml-emblem img{width:52px;height:52px;border-radius:8px;object-fit:contain;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;}
.ml-emblem-title{font-size:16px;font-weight:700;color:#1A1F2E;margin-bottom:3px;}
.ml-emblem-sub{font-size:11px;color:#6B7280;letter-spacing:.3px;}

/* Form head */
.ml-form-head{margin-bottom:24px;}
.ml-form-label{font-size:11px;font-weight:600;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;}
.ml-form-title{font-size:20px;font-weight:700;color:#1A1F2E;}

/* Fields */
.ml-field{margin-bottom:16px;}
.ml-flbl{display:block;font-size:11px;font-weight:600;color:#374151;margin-bottom:6px;letter-spacing:.2px;}
.ml-igroup{position:relative;}
.ml-iico{position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#9CA3AF;display:flex;align-items:center;}
.ml-iico svg{width:14px;height:14px;}
.ml-input{width:100%;padding:10px 12px 10px 38px;background:#F9FAFB;border:1px solid #E2E5EC;border-radius:7px;font-size:13px;font-family:'Inter',sans-serif;color:#1A1F2E;outline:none;transition:border-color .15s,background .15s;}
.ml-input::placeholder{color:#9CA3AF;}
.ml-input:focus{border-color:#1A3FBF;background:#fff;box-shadow:0 0 0 3px rgba(26,63,191,0.06);}
.ml-input.err{border-color:#DC2626;}
.ml-eye{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;display:flex;align-items:center;padding:4px;}
.ml-eye svg{width:13px;height:13px;}

/* Error */
.ml-err{display:flex;align-items:flex-start;gap:8px;background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;padding:10px 12px;font-size:12px;color:#DC2626;margin-bottom:16px;line-height:1.5;}
.ml-err svg{width:13px;height:13px;flex-shrink:0;margin-top:1px;}

/* Button */
.ml-btn{width:100%;padding:11px;background:#1A3FBF;border:none;border-radius:7px;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .15s;margin-top:4px;}
.ml-btn:hover:not(:disabled){background:#142FA8;}
.ml-btn:disabled{opacity:.5;cursor:not-allowed;}
.ml-spin{width:13px;height:13px;border:1.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;}

/* Switch */
.ml-switch{text-align:center;margin-top:20px;font-size:12px;color:#6B7280;}
.ml-switch a{color:#1A3FBF;font-weight:500;text-decoration:none;cursor:pointer;}

/* Footer */
.ml-footer{text-align:center;padding:16px;font-size:10px;color:#9CA3AF;border-top:1px solid #E2E5EC;background:#fff;letter-spacing:.4px;}

@media(max-width:480px){
  .ml-topbar{padding:0 16px;}
  .ml-card{padding:28px 20px;}
}
`;

const IUser = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const ILock = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IEye = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IEyeOff = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IAlert = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IArrow = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

export default function ManagerLogin({ onLogin, onSwitchToWorker }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authenticate = async () => {
    setError('');
    if (!userId.trim()) { setError('Manager ID is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }
    setLoading(true);
    const cleanId = userId.trim().toLowerCase();
    try {
      const vendorSnap = await getDoc(doc(db, 'vendors', cleanId));
      if (vendorSnap.exists()) {
        const d = vendorSnap.data();
        const pwd = d.accessPassword || d.password;
        if (String(pwd) !== String(password)) {
          setError('Incorrect password. Please try again.');
          setLoading(false);
          return;
        }
        onLogin?.({
          role: 'manager',
          route: '/material-dept',
          user: {
            id: vendorSnap.id,
            name: d.name || d.loginId || cleanId,
            area: d.targetArea || d.assignStationTerminal || d.areaName || '',
            sector: d.logisticsSectorType || d.vendorType || 'MATERIAL',
          },
        });
        return;
      }
      setError('No account found for this ID. Please contact system administrator.');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onKey = e => e.key === 'Enter' && authenticate();

  return (
    <><style>{CSS}</style>
    <div className="ml-page">
      <div className="ml-topbar">
        <div className="ml-topbar-brand">
          <img src="/logo.jpeg" alt="logo" className="ml-topbar-logo" />
          <div>
            <div className="ml-topbar-title">Railway Material Management System</div>
            <div className="ml-topbar-sub">Central Railway · Nagpur Division</div>
          </div>
        </div>
        <div className="ml-topbar-badge">MANAGER PORTAL</div>
      </div>

      <div className="ml-body">
        <div className="ml-card">
          <div className="ml-emblem">
            <img src="/logo.jpeg" alt="emblem" />
            <div className="ml-emblem-title">Department Manager</div>
            <div className="ml-emblem-sub">NAGPUR JUNCTION · CENTRAL RAILWAY</div>
          </div>

          <div className="ml-form-head">
            <div className="ml-form-label">Secure Sign In</div>
            <div className="ml-form-title">Welcome back</div>
          </div>

          {error && (
            <div className="ml-err"><IAlert /><span>{error}</span></div>
          )}

          <div className="ml-field">
            <label className="ml-flbl">Manager ID</label>
            <div className="ml-igroup">
              <span className="ml-iico"><IUser /></span>
              <input
                className={`ml-input${error ? ' err' : ''}`}
                type="text" placeholder="Enter your manager ID"
                value={userId}
                onChange={e => { setUserId(e.target.value); setError(''); }}
                onKeyDown={onKey}
                autoCapitalize="none" autoCorrect="off" autoComplete="username"
              />
            </div>
          </div>

          <div className="ml-field">
            <label className="ml-flbl">Password</label>
            <div className="ml-igroup">
              <span className="ml-iico"><ILock /></span>
              <input
                className={`ml-input${error ? ' err' : ''}`}
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={onKey}
                autoComplete="current-password"
                style={{ paddingRight: 38 }}
              />
              <button className="ml-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1} type="button">
                {showPwd ? <IEyeOff /> : <IEye />}
              </button>
            </div>
          </div>

          <button className="ml-btn" onClick={authenticate} disabled={loading}>
            {loading ? <><div className="ml-spin" />Signing in…</> : <>Sign In <IArrow /></>}
          </button>

          {/* <div className="ml-switch">
            Field worker?{' '}
            <a onClick={onSwitchToWorker}>Go to worker login →</a>
          </div> */}
        </div>
      </div>

      <footer className="ml-footer">
        RAILWAY MATERIAL MANAGEMENT SYSTEM v2.0 · CENTRAL RAILWAY · NAGPUR DIVISION
      </footer>
    </div>
    </>
  );
}