/**
 * CleanerPortal.jsx — Desktop Split-Layout Field Cleaner Portal
 * Styled like MaterialWorker: DM Sans, dark/light theme, full-screen camera, toast
 * Layout: Original split (Sidebar + Left List + Right Detail)
 */
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../App';
import { Sidebar } from '../../components/Sidebar';
import LiveMap from '../../components/LiveMap';
import { db } from '../../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';

// ── Icons (SVG only, no emojis) ───────────────────────────────────────────────
const I = {
  Camera:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  X:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Send:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Sun:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Flip:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>,
  Logout:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Alert:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Clock:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Broom:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l7-7"/><path d="M10 14l1.5-1.5"/><path d="M12 12l6-9"/><path d="M18 3l3 3"/><path d="M5 16H2v3h3v-3z"/></svg>,
  Eye:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Map:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Pin:     () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Warning: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Image:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Upload:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
};

// ── Themes ────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F2F4F7', surface: '#FFFFFF', surface2: '#F8F9FB', surface3: '#EEF1F6',
  border: '#DDE1EA',
  accent: '#1A3FBF', green: '#0E7A5A', amber: '#92400E', red: '#B91C1C',
  text: '#0C1A35', text2: '#3D4F72', text3: '#7A8BAA',
  cardShadow: '0 1px 3px rgba(0,0,0,0.06)',
  headerBg: '#1A3FBF',
};
const DARK = {
  bg: '#080E1A', surface: '#0D1526', surface2: '#111E30', surface3: '#162235',
  border: 'rgba(255,255,255,0.07)',
  accent: '#3B82F6', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
  text: '#E6EDF8', text2: '#8FA3C4', text3: '#4A5F80',
  cardShadow: 'none',
  headerBg: '#060D1A',
};

const initials = n => (n || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'CL';

// ── Global CSS ────────────────────────────────────────────────────────────────
const makeCSS = (t) => `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}

/* ── Login ── */
.cp-login-root{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${t.bg};font-family:'DM Sans',sans-serif;}
.cp-login-card{background:${t.surface};border:1px solid ${t.border};border-radius:14px;width:100%;max-width:360px;padding:32px 28px;box-shadow:0 12px 40px rgba(0,0,0,0.15);animation:fadeUp .3s ease both;}
.cp-login-header{text-align:center;margin-bottom:26px;}
.cp-login-avatar{width:52px;height:52px;border-radius:12px;background:${t.accent};display:flex;align-items:center;justify-content:center;margin:0 auto 14px;color:#fff;}
.cp-login-title{font-size:18px;font-weight:800;color:${t.text};margin-bottom:3px;}
.cp-login-sub{font-size:9px;color:${t.text3};font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.6px;}

/* ── Main Layout ── */
.cp-root{display:flex;height:100vh;background:${t.bg};overflow:hidden;font-family:'DM Sans',sans-serif;color:${t.text};}
.cp-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}

/* ── Top Bar ── */
.cp-topbar{background:${t.surface};border-bottom:1px solid ${t.border};padding:10px 20px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;box-shadow:${t.cardShadow};}
.cp-topbar-left{display:flex;align-items:center;gap:10px;}
.cp-station-pill{display:flex;align-items:center;gap:5px;background:${t.surface2};border:1px solid ${t.border};border-radius:5px;padding:4px 10px;}
.cp-station-dot{width:5px;height:5px;border-radius:50%;background:${t.green};animation:pulse 2s infinite;flex-shrink:0;}
.cp-station-label{font-size:9px;color:${t.text3};font-family:'DM Mono',monospace;letter-spacing:.3px;text-transform:uppercase;}
.cp-station-val{font-size:10px;font-weight:700;color:${t.text};font-family:'DM Mono',monospace;text-transform:uppercase;}
.cp-topbar-right{display:flex;align-items:center;gap:8px;}
.cp-icon-btn{background:${t.surface2};border:1px solid ${t.border};border-radius:5px;padding:5px 9px;cursor:pointer;display:flex;align-items:center;gap:5px;font-size:10px;font-weight:600;color:${t.text3};transition:all .15s;font-family:'DM Sans',sans-serif;}
.cp-icon-btn:hover{border-color:${t.accent};color:${t.accent};}

/* ── Split Body ── */
.cp-split{flex:1;display:flex;padding:16px;gap:14px;overflow:hidden;}

/* ── Left Panel ── */
.cp-left{width:300px;flex-shrink:0;display:flex;flex-direction:column;gap:10px;overflow-y:auto;}
.cp-panel-title{font-size:11px;font-weight:800;color:${t.text};text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;display:flex;align-items:center;gap:6px;}

/* ── Cards ── */
.cp-card{background:${t.surface};border:1px solid ${t.border};border-radius:10px;overflow:hidden;animation:fadeUp .2s ease both;box-shadow:${t.cardShadow};}
.cp-card-hd{padding:10px 14px;border-bottom:1px solid ${t.border};display:flex;align-items:center;justify-content:space-between;background:${t.surface2};}
.cp-card-title{font-size:11px;font-weight:700;color:${t.text};display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:.4px;}

/* ── Task Row ── */
.cp-task-row{padding:12px 14px;border-bottom:1px solid ${t.border};cursor:pointer;transition:background .1s;display:flex;align-items:flex-start;gap:10px;}
.cp-task-row:last-child{border-bottom:none;}
.cp-task-row:hover{background:${t.surface2};}
.cp-task-row.active{background:${t.surface2};border-left:3px solid ${t.accent};}
.cp-task-ico{width:34px;height:34px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.cp-task-title{font-size:12px;font-weight:600;color:${t.text};margin-bottom:3px;}
.cp-task-sub{font-size:10px;color:${t.text3};font-family:'DM Mono',monospace;}

/* ── Right Panel ── */
.cp-right{flex:1;background:${t.surface};border:1px solid ${t.border};border-radius:10px;overflow-y:auto;display:flex;flex-direction:column;}
.cp-right-inner{padding:16px;display:flex;flex-direction:column;gap:14px;flex:1;}
.cp-empty-state{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:${t.text3};}
.cp-empty-state-icon{width:48px;height:48px;border-radius:12px;background:${t.surface2};border:1px solid ${t.border};display:flex;align-items:center;justify-content:center;color:${t.text3};}
.cp-empty-state-text{font-size:12px;text-align:center;}

/* ── Section Headers ── */
.cp-section-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${t.text3};font-family:'DM Mono',monospace;margin-bottom:6px;}

/* ── Info Grid ── */
.cp-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.cp-info-cell{background:${t.surface2};border:1px solid ${t.border};border-radius:7px;padding:8px 10px;}
.cp-info-key{font-size:9px;color:${t.text3};font-family:'DM Mono',monospace;margin-bottom:2px;}
.cp-info-val{font-size:11px;font-weight:600;color:${t.text};}

/* ── Form elements ── */
.cp-flbl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${t.text3};display:block;margin-bottom:5px;font-family:'DM Mono',monospace;}
.cp-inp{width:100%;padding:9px 12px;background:${t.surface2};border:1px solid ${t.border};border-radius:7px;font-size:13px;font-family:'DM Sans',sans-serif;color:${t.text};outline:none;transition:border-color .15s;}
.cp-inp::placeholder{color:${t.text3};}
.cp-inp:focus{border-color:${t.accent};}
.cp-field{margin-bottom:10px;}

/* ── Camera trigger ── */
.cp-cam-trigger{display:flex;align-items:center;gap:8px;padding:11px 14px;background:${t.surface2};border:1.5px dashed ${t.border};border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;color:${t.accent};font-family:'DM Sans',sans-serif;width:100%;justify-content:center;transition:background .15s;margin-bottom:10px;}
.cp-cam-trigger:hover{background:${t.surface3};}

/* ── Photo preview ── */
.cp-photo-wrap{width:100%;border-radius:8px;overflow:hidden;position:relative;margin-bottom:10px;}
.cp-photo-wrap img{width:100%;display:block;max-height:160px;object-fit:cover;}
.cp-photo-retake{position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:5px 10px;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:'DM Sans',sans-serif;}
.cp-photo-tap{position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.55);color:#fff;padding:3px 7px;border-radius:3px;font-size:9px;font-weight:600;font-family:'DM Mono',monospace;display:flex;align-items:center;gap:4px;cursor:pointer;}

/* ── Submit ── */
.cp-submit{width:100%;padding:12px;border:none;border-radius:8px;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s;letter-spacing:.2px;}
.cp-submit:disabled{opacity:.4;cursor:not-allowed;}
.cp-submit:active:not(:disabled){transform:scale(0.98);}

/* ── Alerts ── */
.cp-alert{display:flex;align-items:flex-start;gap:8px;border-radius:7px;padding:10px 12px;font-size:11px;font-weight:500;line-height:1.5;margin-bottom:10px;}
.cp-alert.err{background:rgba(185,28,28,0.07);border:1px solid rgba(185,28,28,0.15);color:${t.red};}
.cp-alert.warn{background:rgba(146,64,14,0.07);border:1px solid rgba(146,64,14,0.2);color:${t.amber};}
.cp-alert.ok{background:rgba(14,122,90,0.07);border:1px solid rgba(14,122,90,0.2);color:${t.green};}

/* ── Badges ── */
.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:3px;font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;font-family:'DM Mono',monospace;}
.b-assigned{background:rgba(26,63,191,0.1);color:#1A3FBF;}
.b-audit{background:rgba(146,64,14,0.1);color:#92400E;}
.b-count{background:rgba(26,63,191,0.1);color:#1A3FBF;}

/* ── Divider ── */
.cp-divider{border:none;border-top:1px solid ${t.border};margin:4px 0;}

/* ── Spinner ── */
.cp-spin{width:13px;height:13px;border:1.5px solid rgba(255,255,255,0.25);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite;}

/* ── Toast ── */
.cp-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${t.surface};border:1px solid ${t.border};color:${t.text};padding:9px 18px;border-radius:6px;font-size:11px;font-weight:600;z-index:9999;display:flex;align-items:center;gap:7px;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:opacity .3s;white-space:nowrap;font-family:'DM Mono',monospace;}
.cp-toast.off{opacity:0;pointer-events:none;}

/* ── Full Screen Camera ── */
.cp-fs-cam{position:fixed;inset:0;background:#000;z-index:9999;display:flex;flex-direction:column;}
.cp-fs-cam-bar{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(0,0,0,0.7);position:absolute;top:0;left:0;right:0;z-index:1;}
.cp-fs-cam-title{font-size:12px;font-weight:700;color:#fff;font-family:'DM Mono',monospace;letter-spacing:.5px;}
.cp-fs-cam-video{width:100%;height:100%;object-fit:cover;display:block;}
.cp-fs-cam-controls{position:absolute;bottom:0;left:0;right:0;padding:24px 20px 40px;background:linear-gradient(transparent,rgba(0,0,0,0.75));display:flex;align-items:center;justify-content:space-between;z-index:1;}
.cp-fs-shoot{width:68px;height:68px;border-radius:50%;background:#fff;border:4px solid rgba(255,255,255,0.35);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .1s;}
.cp-fs-shoot:active{transform:scale(0.92);}
.cp-fs-shoot:disabled{background:#444;cursor:not-allowed;}
.cp-fs-side{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.22);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;}

/* ── Lightbox ── */
.cp-lb{position:fixed;inset:0;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;}
.cp-lb img{max-width:100%;max-height:88vh;border-radius:8px;}
.cp-lb-close{position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;}
`;

// ── Full Screen Camera ────────────────────────────────────────────────────────
function FullScreenCamera({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState('environment');
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true);
          await videoRef.current.play().catch(() => {});
          setReady(true);
        }
      } catch { setReady(false); }
    })();
    return () => { active = false; streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [facing]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const shoot = () => {
    if (!ready || !canvasRef.current || !videoRef.current) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth || 1280;
    c.height = v.videoHeight || 720;
    const ctx = c.getContext('2d');
    if (facing === 'user') { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const dataURL = c.toDataURL('image/jpeg', 0.88);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCapture(dataURL);
  };

  const close = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onClose();
  };

  return (
    <div className="cp-fs-cam">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <video ref={videoRef} playsInline muted className="cp-fs-cam-video"
        style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} />
      {flash && (
        <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.85, zIndex: 2, pointerEvents: 'none' }} />
      )}
      <div className="cp-fs-cam-bar">
        <span className="cp-fs-cam-title">CAPTURE CLEAN PHOTO — PROOF OF WORK</span>
        <button className="cp-fs-side" onClick={close} style={{ width: 34, height: 34 }}><I.X /></button>
      </div>
      <div className="cp-fs-cam-controls">
        <div style={{ width: 44 }} />
        <button className="cp-fs-shoot" onClick={shoot} disabled={!ready}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: ready ? '#1A3FBF' : '#444',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <I.Camera />
          </div>
        </button>
        <button className="cp-fs-side" onClick={() => { setReady(false); setFacing(f => f === 'environment' ? 'user' : 'environment'); }}>
          <I.Flip />
        </button>
      </div>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onAuth }) {
  const [dark, setDark] = useState(false);
  const t = dark ? DARK : LIGHT;
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr('');
    const searchId = loginId.trim().toLowerCase();
    const searchPw = password.trim();
    if (!searchId || !searchPw) { setErr('Please enter your login credentials.'); return; }
    setLoading(true);
    try {
      const rootSnap = await getDocs(collection(db, 'vendors'));
      let found = null, stationId = '';
      for (const vDoc of rootSnap.docs) {
        const subSnap = await getDocs(collection(db, 'vendors', vDoc.id, 'cleaners'));
        subSnap.forEach(cDoc => {
          const d = cDoc.data();
          const dbId = String(d.phone || d.loginId || d.name || cDoc.id).toLowerCase().trim();
          const dbPw = String(d.password || '').trim();
          if (dbId === searchId && dbPw === searchPw) { found = d; stationId = vDoc.id; }
        });
        if (found) break;
      }
      if (found) { onAuth(found, stationId); }
      else { setErr('Invalid ID or password. Please check and try again.'); }
    } catch (ex) {
      console.error(ex);
      setErr('Connection error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <style>{makeCSS(t)}</style>
      <div className="cp-login-root">
        <button
          onClick={() => setDark(v => !v)}
          className="cp-icon-btn"
          style={{ position: 'absolute', top: 18, right: 18, background: t.surface, border: `1px solid ${t.border}`, color: t.text3 }}
        >
          {dark ? <I.Sun /> : <I.Moon />}
        </button>
        <div className="cp-login-card">
          <div className="cp-login-header">
            <div className="cp-login-avatar">
  <img
    src="/logo.jpeg"
    alt="Logo"
    style={{
      width: "60px",
      height: "60px",
      objectFit: "contain",
    }}
  />
</div>
            <div className="cp-login-title">Cleaner Login</div>
            <div className="cp-login-sub">NAGPUR JUNCTION · CENTRAL RAILWAY</div>
          </div>
          {err && (
            <div className="cp-alert err"><I.Alert /><span>{err}</span></div>
          )}
          <form onSubmit={handleLogin}>
            <div className="cp-field">
              <label className="cp-flbl">Cleaner Login ID</label>
              <input className="cp-inp" type="text" value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder="Phone number or login ID" required />
            </div>
            <div className="cp-field">
              <label className="cp-flbl">Password</label>
              <input className="cp-inp" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>
            <button type="submit" className="cp-submit" disabled={loading}
              style={{ background: loading ? t.surface3 : t.accent, marginTop: 6 }}>
              {loading
                ? <><div className="cp-spin" />Authenticating…</>
                : <><I.Check />Sign In & Sync Work Orders</>}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function CleanerPortal() {
  const { complaints, updateComplaint } = useApp();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cleanerData, setCleanerData] = useState(null);
  const [stationId, setStationId] = useState('');
  const [dark, setDark] = useState(false);
  const [selected, setSelected] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showCam, setShowCam] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });

  const t = dark ? DARK : LIGHT;

  const activeTasks = complaints.filter(c =>
    c.assignedTo?.toLowerCase().trim() === cleanerData?.name?.toLowerCase().trim() &&
    ['ASSIGNED_TO_CLEANER', 'CLEANED_BY_FORCE'].includes(c.status)
  );

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const handleAuth = (data, station) => {
    setCleanerData(data);
    setStationId(station);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCleanerData(null);
    setStationId('');
    setSelected(null);
    setCapturedPhoto(null);
  };

  const handleSelectTask = (task) => {
    setSelected(task);
    setCapturedPhoto(null);
  };

  const handleSubmitProof = async () => {
    if (!capturedPhoto) { alert('Please capture an after-clean photo first.'); return; }
    setUploading(true);
    try {
      await updateComplaint(selected.id, {
        status: 'CLEANED_BY_FORCE',
        cleanerStatus: 'DONE',
        cleanerPhoto: capturedPhoto,
      });
      showToast('Photo proof dispatched to vendor');
      setCapturedPhoto(null);
      setSelected(null);
    } catch {
      alert('Failed to sync. Please try again.');
    }
    setUploading(false);
  };

  if (!isAuthenticated) {
    return <LoginScreen onAuth={handleAuth} />;
  }

  const isDone = selected?.status === 'CLEANED_BY_FORCE';

  return (
    <>
      <style>{makeCSS(t)}</style>
      <div className="cp-root">

        {/* Sidebar — same as original */}
        <Sidebar
          title="Field Force Ledger"
          subtitle={`Operator: ${cleanerData?.name}`}
          navItems={[{ key: 'JOBS', label: 'Assigned Sweeps', count: activeTasks.length }]}
          activeTab="JOBS"
          onTabChange={() => {}}
        />

        <div className="cp-main">

          {/* Top Bar */}
          <div className="cp-topbar">
            <div className="cp-topbar-left">
              <div className="cp-station-pill">
                <span className="cp-station-dot" />
                <span className="cp-station-label">Station:&nbsp;</span>
                <span className="cp-station-val">{stationId}</span>
              </div>
            </div>
            <div className="cp-topbar-right">
              <button className="cp-icon-btn" onClick={() => setDark(v => !v)}>
                {dark ? <I.Sun /> : <I.Moon />}
              </button>
              <button className="cp-icon-btn" onClick={handleLogout}>
                <I.Logout /> Logout
              </button>
            </div>
          </div>

          {/* Split Layout */}
          <div className="cp-split">

            {/* LEFT — Task List */}
            <div className="cp-left">
              <div className="cp-card" style={{ flex: 1 }}>
                <div className="cp-card-hd">
                  <span className="cp-card-title">Duty Worklist</span>
                  <span className="badge b-count">{activeTasks.length}</span>
                </div>
                {activeTasks.length === 0 ? (
                  <div style={{ padding: '28px 16px', textAlign: 'center', color: t.text3, fontSize: 12 }}>
                    No active jobs assigned right now.
                  </div>
                ) : (
                  activeTasks.map(task => {
                    const done = task.status === 'CLEANED_BY_FORCE';
                    return (
                      <div
                        key={task.id}
                        className={`cp-task-row${selected?.id === task.id ? ' active' : ''}`}
                        onClick={() => handleSelectTask(task)}
                      >
                        <div className="cp-task-ico" style={{
                          background: done ? 'rgba(146,64,14,0.1)' : 'rgba(26,63,191,0.1)',
                          color: done ? t.amber : t.accent,
                        }}>
                          
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="cp-task-title" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {task.area || 'Platform Area'}
                            <span className={`badge ${done ? 'b-audit' : 'b-assigned'}`}>
                              {done ? 'Awaiting Audit' : 'Assigned'}
                            </span>
                          </div>
                          <div className="cp-task-sub">
                            Ref: {task.customTicketId || task.id?.substring(0, 8)}
                          </div>
                          <div className="cp-task-sub">{task.title || task.gtype || 'Cleaning Task'}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT — Detail Panel */}
            <div className="cp-right">
              {!selected ? (
                <div className="cp-empty-state">
                  <div className="cp-empty-state-icon"></div>
                  <div className="cp-empty-state-text">
                    Select a job from the list<br />to view details and submit proof.
                  </div>
                </div>
              ) : (
                <div className="cp-right-inner">

                  {/* Location Map */}
                  <div>
                    <div className="cp-section-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <I.Map />Deployment Location
                    </div>
                    <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.border}` }}>
                      <LiveMap singlePin={true} singleCoords={{ lat: selected.lat, lng: selected.lng }} height="140px" />
                    </div>
                  </div>

                  <hr className="cp-divider" />

                  {/* Task Info */}
                  <div>
                    <div className="cp-section-label">Task Details</div>
                    <div className="cp-info-grid">
                      {[
                        ['Area', selected.area || '—'],
                        ['Type', selected.title || selected.gtype || '—'],
                        ['Ref Code', selected.customTicketId || selected.id?.substring(0, 8)],
                        ['Assigned To', selected.assignedTo || '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="cp-info-cell">
                          <div className="cp-info-key">{k}</div>
                          <div className="cp-info-val">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Citizen Report Photo */}
                  <div>
                    <div className="cp-section-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <I.Warning />Citizen Report Photo (Before Clean)
                    </div>
                    {(selected.imageUrl || selected.image || selected.photoUrl || selected.photo) ? (
                      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.border}`, cursor: 'pointer' }}
                        onClick={() => setLightbox(selected.imageUrl || selected.image || selected.photoUrl || selected.photo)}>
                        <img
                          src={selected.imageUrl || selected.image || selected.photoUrl || selected.photo}
                          alt="Citizen report"
                          style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div className="cp-photo-tap"><I.Eye />Tap to enlarge</div>
                      </div>
                    ) : (
                      <div style={{ background: t.surface2, border: `1px dashed ${t.border}`, borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 11, color: t.text3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <I.Image />No photo attached by citizen
                      </div>
                    )}
                  </div>

                  <hr className="cp-divider" />

                  {/* Closeout Action */}
                  <div style={{ marginTop: 'auto' }}>
                    <div className="cp-section-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <I.Camera />Closeout Action
                    </div>

                    {isDone && !capturedPhoto && (
                      <div className="cp-alert warn" style={{ marginBottom: 10 }}>
                        <I.Clock />
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 2 }}>Awaiting Vendor Verification</div>
                          <div>Photo already submitted. You can retake and resubmit if needed.</div>
                        </div>
                      </div>
                    )}

                    {/* Camera trigger — always visible */}
                    <button className="cp-cam-trigger" onClick={() => setShowCam(true)}>
                      <I.Camera />{capturedPhoto ? 'Retake Photo' : 'Open Camera — Capture After-Clean Photo'}
                    </button>

                    {/* Captured photo preview */}
                    {capturedPhoto && (
                      <div className="cp-photo-wrap">
                        <img src={capturedPhoto} alt="After clean proof" />
                        <div className="cp-photo-tap" style={{ top: 8, left: 8 }}
                          onClick={() => setLightbox(capturedPhoto)}>
                          <I.Eye />View full
                        </div>
                      </div>
                    )}

                    <button
                      className="cp-submit"
                      onClick={handleSubmitProof}
                      disabled={!capturedPhoto || uploading}
                      style={{ background: (!capturedPhoto || uploading) ? t.surface3 : t.green }}
                    >
                      {uploading
                        ? <><div className="cp-spin" />Uploading…</>
                        : <><I.Send />Dispatch to Vendor Audit</>}
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Full Screen Camera */}
      {showCam && (
        <FullScreenCamera
          onCapture={(url) => { setCapturedPhoto(url); setShowCam(false); }}
          onClose={() => setShowCam(false)}
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="cp-lb" onClick={() => setLightbox(null)}>
          <button className="cp-lb-close" onClick={() => setLightbox(null)}><I.X /></button>
          <img src={lightbox} alt="full view" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Toast */}
      <div className={`cp-toast${toast.show ? '' : ' off'}`}>
        <I.Check />{toast.msg}
      </div>
    </>
  );
}