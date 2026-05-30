/**
 * MaterialWorker.jsx — Mobile-first Field Worker Portal
 * Fixed: scroll, submit onClick, photo, dark/light
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection, addDoc, onSnapshot, query,
  where, serverTimestamp, doc, updateDoc
} from 'firebase/firestore';
import { db } from '../../utils/firebase';

const I = {
  Entry:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/><line x1="5" y1="5" x2="19" y2="5"/></svg>,
  Balance: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  History: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Request: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Camera:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  X:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Send:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  ArrowUp: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  ArrowDn: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  Sun:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Pin:     () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Flip:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>,
  Alert:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Package: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  Upload:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  Logout:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Clock:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

const LIGHT = {
  bg: '#F2F4F7', surface: '#FFFFFF', surface2: '#F8F9FB', surface3: '#EEF1F6',
  border: '#DDE1EA', border2: '#E8ECF3',
  accent: '#1A3FBF', green: '#0E7A5A', amber: '#92400E', red: '#B91C1C',
  text: '#0C1A35', text2: '#3D4F72', text3: '#7A8BAA',
  navBg: '#FFFFFF', cardShadow: '0 1px 3px rgba(0,0,0,0.06)',
  headerBg: '#1A3FBF', headerText: '#FFFFFF',
};
const DARK = {
  bg: '#080E1A', surface: '#0D1526', surface2: '#111E30', surface3: '#162235',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.04)',
  accent: '#3B82F6', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
  text: '#E6EDF8', text2: '#8FA3C4', text3: '#4A5F80',
  navBg: '#0D1526', cardShadow: 'none',
  headerBg: '#060D1A', headerText: '#E6EDF8',
};

const initials = n => (n || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'FW';
const fmtTime  = ts => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate  = ts => ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const TABS = [
  { key: 'entry',   label: 'Stock Entry', Icon: I.Entry },
  { key: 'balance', label: 'Balance',     Icon: I.Balance },
  { key: 'history', label: 'History',     Icon: I.History },
  { key: 'request', label: 'Request',     Icon: I.Request },
];

const makeCSS = (t) => `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

/* FIX: allow page to scroll */
html,body{
  height:100%;
  overflow-y:auto !important;
  -webkit-overflow-scrolling:touch;
}

body{background:${t.bg};font-family:'DM Sans',sans-serif;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes flash{0%{opacity:0.85}100%{opacity:0}}

/* FIX: root must not lock height */
.mw-root{
  min-height:100%;
  background:${t.bg};
  color:${t.text};
  font-family:'DM Sans',sans-serif;
  display:flex;
  flex-direction:column;
}

.mw-header{background:${t.headerBg};padding:0;position:sticky;top:0;z-index:100;}
.mw-header-inner{display:flex;align-items:center;justify-content:space-between;padding:11px 16px 10px;}
.mw-logo-row{display:flex;align-items:center;gap:9px;}
.mw-logo{width:30px;height:30px;border-radius:6px;background:#fff;padding:2px;object-fit:contain;flex-shrink:0;}
.mw-brand-name{font-size:12px;font-weight:700;color:#fff;}
.mw-brand-sub{font-size:9px;color:rgba(255,255,255,0.5);font-family:'DM Mono',monospace;margin-top:1px;}
.mw-user-row{display:flex;align-items:center;gap:8px;}
.mw-uav{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;font-family:'DM Mono',monospace;}
.mw-uinfo{text-align:right;}
.mw-uname{font-size:12px;font-weight:600;color:#fff;}
.mw-uid{font-size:9px;color:rgba(255,255,255,0.45);font-family:'DM Mono',monospace;}
.mw-theme-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);border-radius:5px;padding:5px 9px;cursor:pointer;display:flex;align-items:center;gap:5px;font-size:10px;font-weight:600;color:rgba(255,255,255,0.8);transition:all .15s;font-family:'DM Sans',sans-serif;}
.mw-logout-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);border-radius:5px;padding:5px 9px;cursor:pointer;display:flex;align-items:center;gap:5px;font-size:10px;font-weight:600;color:rgba(255,255,255,0.8);transition:all .15s;font-family:'DM Sans',sans-serif;}
.mw-gps-bar{background:rgba(0,0,0,0.25);padding:5px 16px;display:flex;align-items:center;gap:6px;font-size:9px;color:rgba(255,255,255,0.55);font-family:'DM Mono',monospace;letter-spacing:.3px;}
.mw-gps-dot{width:5px;height:5px;border-radius:50%;background:#4ADE80;animation:pulse 2s infinite;flex-shrink:0;}

.mw-tabs{background:${t.navBg};border-bottom:1px solid ${t.border};padding:0 4px;display:flex;position:sticky;top:56px;z-index:90;box-shadow:${t.cardShadow};}
.mw-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 4px 7px;border-bottom:2px solid transparent;background:none;cursor:pointer;font-size:9px;font-weight:600;color:${t.text3};transition:all .15s;font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent;letter-spacing:.3px;text-transform:uppercase;}
.mw-tab.on{color:${t.accent};border-bottom-color:${t.accent};}

/* FIX: body scrolls freely */
.mw-body{
  padding:12px 14px 100px;
  flex:1;
  overflow-y:visible;
}

.mw-card{background:${t.surface};border:1px solid ${t.border};border-radius:10px;overflow:hidden;margin-bottom:12px;animation:fadeUp .2s ease both;box-shadow:${t.cardShadow};}
.mw-card-hd{padding:11px 14px;border-bottom:1px solid ${t.border};display:flex;align-items:center;justify-content:space-between;background:${t.surface2};}
.mw-card-title{font-size:12px;font-weight:700;color:${t.text};display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:.4px;}

.mw-flbl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${t.text3};display:block;margin-bottom:5px;font-family:'DM Mono',monospace;}
.mw-inp{width:100%;padding:10px 12px;background:${t.surface2};border:1px solid ${t.border};border-radius:7px;font-size:13px;font-family:'DM Sans',sans-serif;color:${t.text};outline:none;transition:border-color .15s;-webkit-appearance:none;}
.mw-inp::placeholder{color:${t.text3};}
.mw-inp:focus{border-color:${t.accent};}
.mw-sel{width:100%;padding:10px 12px;background:${t.surface2};border:1px solid ${t.border};border-radius:7px;font-size:13px;font-family:'DM Sans',sans-serif;color:${t.text};outline:none;cursor:pointer;-webkit-appearance:none;}
.mw-ta{width:100%;padding:10px 12px;background:${t.surface2};border:1px solid ${t.border};border-radius:7px;font-size:13px;font-family:'DM Sans',sans-serif;color:${t.text};outline:none;resize:none;}
.mw-field{margin-bottom:12px;}
.mw-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}

.mw-toggle{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
.mw-tog-btn{padding:12px 8px;border-radius:8px;border:1.5px solid ${t.border};background:${t.surface2};color:${t.text3};cursor:pointer;font-size:11px;font-weight:700;text-align:center;font-family:'DM Sans',sans-serif;transition:all .15s;-webkit-tap-highlight-color:transparent;letter-spacing:.3px;text-transform:uppercase;}
.mw-tog-btn.in-on{border-color:#0E7A5A;background:rgba(14,122,90,0.07);color:#0E7A5A;}
.mw-tog-btn.out-on{border-color:#B91C1C;background:rgba(185,28,28,0.07);color:#B91C1C;}

/* FIX: full-screen camera uses fixed position — ensure it covers properly */
.mw-fs-cam{position:fixed;inset:0;background:#000;z-index:9999;display:flex;flex-direction:column;}
.mw-fs-cam-bar{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(0,0,0,0.7);position:absolute;top:0;left:0;right:0;z-index:1;}
.mw-fs-cam-title{font-size:13px;font-weight:700;color:#fff;font-family:'DM Mono',monospace;letter-spacing:.5px;}
.mw-fs-cam-video{width:100%;height:100%;object-fit:cover;display:block;}
.mw-fs-cam-controls{position:absolute;bottom:0;left:0;right:0;padding:24px 20px 36px;background:linear-gradient(transparent,rgba(0,0,0,0.75));display:flex;align-items:center;justify-content:space-between;z-index:1;}
.mw-fs-shoot{width:68px;height:68px;border-radius:50%;background:#fff;border:4px solid rgba(255,255,255,0.35);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .1s;}
.mw-fs-shoot:active{transform:scale(0.92);}
.mw-fs-shoot:disabled{background:#555;cursor:not-allowed;}
.mw-fs-side-btn{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.22);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;}
.mw-cam-trigger{display:flex;align-items:center;gap:8px;padding:11px 14px;background:${t.surface2};border:1.5px dashed ${t.border};border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;color:${t.accent};font-family:'DM Sans',sans-serif;width:100%;justify-content:center;transition:background .15s;margin-bottom:10px;}
.mw-photo-captured{width:100%;border-radius:8px;overflow:hidden;position:relative;margin-bottom:10px;}
.mw-photo-captured img{width:100%;display:block;max-height:200px;object-fit:cover;}
.mw-photo-retake{position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:5px 10px;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:'DM Sans',sans-serif;}

.mw-submit{width:100%;padding:13px;border:none;border-radius:8px;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s;-webkit-tap-highlight-color:transparent;letter-spacing:.2px;}
.mw-submit:disabled{opacity:.45;cursor:not-allowed;}
.mw-submit:active:not(:disabled){transform:scale(0.98);}

.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:3px;font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;font-family:'DM Mono',monospace;}
.b-in  {background:rgba(14,122,90,0.1);color:#0E7A5A;}
.b-out {background:rgba(185,28,28,0.1);color:#B91C1C;}
.b-pend{background:rgba(146,64,14,0.1);color:#92400E;}
.b-app {background:rgba(14,122,90,0.1);color:#0E7A5A;}
.b-rej {background:rgba(185,28,28,0.1);color:#B91C1C;}
.b-blue{background:rgba(26,63,191,0.1);color:#1A3FBF;}

.mw-row{display:flex;align-items:center;gap:11px;padding:11px 14px;border-bottom:1px solid ${t.border};transition:background .1s;}
.mw-row:last-child{border-bottom:none;}
.mw-row-ico{width:36px;height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mw-row-title{font-size:12px;font-weight:600;color:${t.text};}
.mw-row-sub{font-size:10px;color:${t.text3};margin-top:2px;font-family:'DM Mono',monospace;}

.mw-inv-row{display:flex;align-items:center;gap:11px;padding:11px 14px;border-bottom:1px solid ${t.border};}
.mw-inv-row:last-child{border-bottom:none;}
.mw-inv-ic{width:36px;height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${t.surface3};border:1px solid ${t.border};}
.inv-bar{height:3px;background:${t.surface3};border-radius:2px;margin-top:5px;overflow:hidden;}
.inv-fill{height:100%;border-radius:2px;transition:width .4s;}

.mw-alert{display:flex;align-items:flex-start;gap:8px;border-radius:7px;padding:10px 12px;font-size:11px;font-weight:500;line-height:1.5;margin-bottom:11px;}
.mw-alert.err{background:rgba(185,28,28,0.07);border:1px solid rgba(185,28,28,0.15);color:#B91C1C;}

.mw-toast{position:fixed;bottom:88px;left:50%;transform:translateX(-50%);background:${t.surface};border:1px solid ${t.border};color:${t.text};padding:10px 18px;border-radius:6px;font-size:11px;font-weight:600;z-index:9999;display:flex;align-items:center;gap:7px;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:opacity .3s;white-space:nowrap;font-family:'DM Mono',monospace;}
.mw-toast.off{opacity:0;pointer-events:none;}
.mw-spin{width:13px;height:13px;border:1.5px solid rgba(255,255,255,0.25);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite;}
.mw-empty{padding:32px;text-align:center;color:${t.text3};font-size:12px;}

.mw-lb{position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;}
.mw-lb img{max-width:100%;max-height:85vh;border-radius:8px;}
.mw-lb-close{position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;}

@media(max-width:420px){
  .mw-body{padding:10px 12px 100px;}
  .mw-grid2{grid-template-columns:1fr;}
}
`;

// ── Full Screen Camera ────────────────────────────────────────────────────────
function FullScreenCamera({ onCapture, onClose, t }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState('environment');
  const [gps, setGps] = useState(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false
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
    if (!navigator.geolocation) { setGps({ lat: '21.15230', lng: '79.08820' }); return; }
    navigator.geolocation.getCurrentPosition(
      p => setGps({ lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) }),
      () => setGps({ lat: '21.15230', lng: '79.08820' }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Lock body scroll only while camera is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const shoot = () => {
    if (!ready || !canvasRef.current || !videoRef.current) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
    const ctx = c.getContext('2d');
    if (facing === 'user') { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const dataURL = c.toDataURL('image/jpeg', 0.88);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCapture(dataURL, gps);
  };

  const close = () => { streamRef.current?.getTracks().forEach(t => t.stop()); onClose(); };

  return (
    <div className="mw-fs-cam">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <video ref={videoRef} playsInline muted className="mw-fs-cam-video"
        style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} />
      {flash && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.85, zIndex: 2, pointerEvents: 'none' }} />}
      <div className="mw-fs-cam-bar">
        <span className="mw-fs-cam-title">PHOTO VERIFICATION</span>
        {gps && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Mono,monospace' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
            {gps.lat}°N · {gps.lng}°E
          </div>
        )}
        <button className="mw-fs-side-btn" onClick={close} style={{ width: 36, height: 36 }}><I.X /></button>
      </div>
      <div className="mw-fs-cam-controls">
        <div style={{ width: 44 }} />
        <button className="mw-fs-shoot" onClick={shoot} disabled={!ready || !gps}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: ready && gps ? '#1A3FBF' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.Camera />
          </div>
        </button>
        <button className="mw-fs-side-btn" onClick={() => { setReady(false); setFacing(f => f === 'environment' ? 'user' : 'environment'); }}>
          <I.Flip />
        </button>
      </div>
    </div>
  );
}

// ── StockEntry ────────────────────────────────────────────────────────────────
function StockEntry({ worker, inventory, vendors, materialTypes, onToast, t }) {
  const [txnType, setTxnType] = useState('IN');
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [showFSCam, setShowFSCam] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [gps, setGps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [useFile, setUseFile] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    const found = inventory.find(i => i.name === item) || materialTypes.find(m => m.name === item);
    if (found) setUnit(found.unit || '');
  }, [item, inventory, materialTypes]);

  const handleFilePhoto = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setPhoto(ev.target.result);
    r.readAsDataURL(f);
  };

  const reset = () => { setItem(''); setQty(''); setUnit(''); setNotes(''); setPhoto(null); setGps(null); setErr(''); };

  // FIX: handleSubmit was never wired — now it is
  const handleSubmit = async () => {
    setErr('');
    if (!item) { setErr('Please select a material item.'); return; }
    if (!qty || Number(qty) <= 0) { setErr('Enter a valid quantity.'); return; }
    if (!photo) { setErr('Photo verification is required. Please capture or upload.'); return; }
    setLoading(true);
    try {
      const invItem = inventory.find(i => i.name === item);
      const prevStock = invItem?.currentStock || 0;
      const newStock = txnType === 'IN' ? prevStock + Number(qty) : Math.max(0, prevStock - Number(qty));
      const txnId = `TXN-${Date.now().toString(36).toUpperCase()}`;
      await addDoc(collection(db, 'materialTransactions'), {
        txnId, type: txnType, itemName: item, qty: Number(qty), unit: unit || invItem?.unit || '',
        vendorName: txnType === 'IN' ? vendor : null,
        vendorId: txnType === 'IN' ? worker.vendorId : null,
        workerId: worker.id, workerName: worker.name,
        photo, notes,
        gpsLat: gps?.lat || null, gpsLng: gps?.lng || null,
        balanceAfter: newStock, createdAt: serverTimestamp(),
      });
      if (invItem) {
        await updateDoc(doc(db, 'materialInventory', invItem.id), { currentStock: newStock, lastUpdated: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'materialInventory'), {
          name: item, unit: unit || '', currentStock: newStock, minStock: 10, maxStock: 500,
          vendorName: vendor, category: 'General', createdAt: serverTimestamp()
        });
      }
      onToast(`Stock ${txnType} recorded — ${item}`);
      reset();
    } catch (e) { setErr('Error saving. Please try again.'); console.error(e); }
    setLoading(false);
  };

  const itemOptions = [...new Set([...inventory.map(i => i.name), ...materialTypes.map(m => m.name)])];
  const vendorOptions = vendors.map(v => v.name || v.id);
  const btnColor = txnType === 'IN' ? '#0E7A5A' : '#B91C1C';

  return (
    <div className="mw-body">
      <div className="mw-card">
        <div className="mw-card-hd">
          <span className="mw-card-title"><I.Entry />Stock Entry</span>
        </div>
        <div style={{ padding: 14 }}>
          {err && <div className="mw-alert err"><I.Alert /><span>{err}</span></div>}

          <div className="mw-field">
            <label className="mw-flbl">Transaction Type</label>
            <div className="mw-toggle">
              {['IN', 'OUT'].map(tp => (
                <button key={tp}
                  className={`mw-tog-btn ${txnType === tp ? (tp === 'IN' ? 'in-on' : 'out-on') : ''}`}
                  onClick={() => setTxnType(tp)}>
                  <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                    {tp === 'IN' ? <I.ArrowDn /> : <I.ArrowUp />}
                  </div>
                  Stock {tp === 'IN' ? 'In' : 'Out'}
                </button>
              ))}
            </div>
          </div>

          <div className="mw-field">
            <label className="mw-flbl">Material Item *</label>
            <select className="mw-sel" value={item} onChange={e => setItem(e.target.value)}>
              <option value="">Select item…</option>
              {itemOptions.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>

          <div className="mw-grid2">
            <div>
              <label className="mw-flbl">Quantity *</label>
              <input className="mw-inp" type="number" inputMode="numeric" placeholder="e.g. 50" value={qty} onChange={e => setQty(e.target.value)} min="1" />
            </div>
            <div>
              <label className="mw-flbl">Unit</label>
              <input className="mw-inp" placeholder="Auto-filled" value={unit} onChange={e => setUnit(e.target.value)} />
            </div>
          </div>

          {txnType === 'IN' && (
            <div className="mw-field">
              <label className="mw-flbl">Vendor</label>
              <select className="mw-sel" value={vendor} onChange={e => setVendor(e.target.value)}>
                <option value="">Select vendor…</option>
                {vendorOptions.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          )}

          <div className="mw-field">
            <label className="mw-flbl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Photo Verification *</span>
              <button onClick={() => setUseFile(v => !v)}
                style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 9, cursor: 'pointer', color: t.text3, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                <I.Upload />{useFile ? 'Use Camera' : 'Upload File'}
              </button>
            </label>

            {photo ? (
              <div className="mw-photo-captured">
                <img src={photo} alt="verification" />
                {gps && (
                  <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '3px 8px', borderRadius: 3, fontSize: 9, fontWeight: 600, fontFamily: 'DM Mono,monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <I.Pin />{gps.lat}°N · {gps.lng}°E
                  </div>
                )}
                <button className="mw-photo-retake" onClick={() => { setPhoto(null); setGps(null); }}>
                  <I.Flip /> Retake
                </button>
              </div>
            ) : useFile ? (
              <div onClick={() => fileRef.current?.click()}
                style={{ border: `1.5px dashed ${t.border}`, borderRadius: 8, padding: 24, textAlign: 'center', cursor: 'pointer', background: t.surface2, marginBottom: 10 }}>
                <I.Upload />
                <div style={{ fontSize: 11, color: t.text3, marginTop: 8 }}>Tap to upload photo</div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFilePhoto} style={{ display: 'none' }} />
              </div>
            ) : (
              <>
                <button className="mw-cam-trigger" onClick={() => setShowFSCam(true)}>
                  <I.Camera /> Open Camera
                </button>
                {showFSCam && (
                  <FullScreenCamera
                    onCapture={(url, g) => { setPhoto(url); setGps(g); setShowFSCam(false); }}
                    onClose={() => setShowFSCam(false)}
                    t={t}
                  />
                )}
              </>
            )}
          </div>

          <div className="mw-field">
            <label className="mw-flbl">Notes (optional)</label>
            <textarea className="mw-ta" rows={2} placeholder="Additional remarks…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {/* FIX: onClick={handleSubmit} was missing */}
          <button className="mw-submit" onClick={handleSubmit} disabled={loading} style={{ background: loading ? t.surface3 : btnColor }}>
            {loading ? <><div className="mw-spin" />Saving…</> : <><I.Check />Submit Stock {txnType === 'IN' ? 'In' : 'Out'}</>}
          </button>
          <button onClick={reset} style={{ width: '100%', marginTop: 8, padding: '9px', background: 'none', border: `1px solid ${t.border}`, borderRadius: 7, fontSize: 11, color: t.text3, cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear Form
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Balance ───────────────────────────────────────────────────────────────────
function Balance({ inventory, t }) {
  return (
    <div className="mw-body">
      <div className="mw-card">
        <div className="mw-card-hd">
          <span className="mw-card-title"><I.Balance />Stock Balance</span>
          <span style={{ fontSize: 9, color: t.text3, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'DM Mono,monospace' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.green, display: 'inline-block' }} />LIVE
          </span>
        </div>
        {inventory.length === 0 && <div className="mw-empty">No inventory data available</div>}
        {inventory.map(item => {
          const pct = item.maxStock > 0 ? Math.min(100, Math.round((item.currentStock / item.maxStock) * 100)) : 0;
          const isLow = item.currentStock <= item.minStock;
          const barClr = isLow ? t.red : pct > 50 ? t.accent : t.amber;
          return (
            <div className="mw-inv-row" key={item.id}>
              <div className="mw-inv-ic"><I.Package /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{item.name}</div>
                <div style={{ fontSize: 9, color: t.text3, marginTop: 1, fontFamily: 'DM Mono,monospace' }}>{item.category || item.vendorName || '—'}</div>
                <div className="inv-bar"><div className="inv-fill" style={{ width: `${pct}%`, background: barClr }} /></div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: isLow ? t.red : t.text, lineHeight: 1 }}>{item.currentStock}</div>
                <div style={{ fontSize: 9, color: t.text3, fontFamily: 'DM Mono,monospace' }}>{item.unit}{isLow && <span style={{ color: t.red }}> LOW</span>}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────
function History({ myTxns, t }) {
  const [lb, setLb] = useState(null);
  return (
    <div className="mw-body">
      <div className="mw-card">
        <div className="mw-card-hd">
          <span className="mw-card-title"><I.History />My Transactions</span>
          <span className="badge b-blue">{myTxns.length}</span>
        </div>
        {myTxns.length === 0 && <div className="mw-empty">No transactions recorded</div>}
        {myTxns.map(txn => (
          <div className="mw-row" key={txn.id}>
            <div className="mw-row-ico"
              style={{ background: txn.type === 'IN' ? 'rgba(14,122,90,0.1)' : 'rgba(185,28,28,0.1)', color: txn.type === 'IN' ? '#0E7A5A' : '#B91C1C' }}>
              {txn.type === 'IN' ? <I.ArrowDn /> : <I.ArrowUp />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mw-row-title">{txn.itemName} <span className={`badge ${txn.type === 'IN' ? 'b-in' : 'b-out'}`}>{txn.type}</span></div>
              <div className="mw-row-sub">{txn.vendorName || '—'} · <I.Clock />{fmtTime(txn.timestamp)}</div>
              {txn.gpsLat && <div className="mw-row-sub" style={{ display: 'flex', alignItems: 'center', gap: 3 }}><I.Pin />{txn.gpsLat}°N, {txn.gpsLng}°E</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: txn.type === 'IN' ? '#0E7A5A' : '#B91C1C', fontFamily: 'DM Mono,monospace' }}>
                {txn.type === 'IN' ? '+' : '-'}{txn.qty} {txn.unit}
              </div>
              {txn.photo && (
                <button onClick={() => setLb(txn.photo)}
                  style={{ width: 34, height: 34, borderRadius: 6, overflow: 'hidden', border: `1px solid ${t.border}`, padding: 0, cursor: 'pointer' }}>
                  <img src={txn.photo} alt="proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {lb && (
        <div className="mw-lb" onClick={() => setLb(null)}>
          <button className="mw-lb-close" onClick={() => setLb(null)}><I.X /></button>
          <img src={lb} alt="verification" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ── Request ───────────────────────────────────────────────────────────────────
function Request({ worker, myRequests, inventory, vendors, materialTypes, onToast, t }) {
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [vendor, setVendor] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const found = inventory.find(i => i.name === item) || materialTypes.find(m => m.name === item);
    if (found) setUnit(found.unit || '');
  }, [item, inventory, materialTypes]);

  const submit = async () => {
    if (!item || !qty) { alert('Please fill item and quantity'); return; }
    setLoading(true);
    try {
      const reqId = `REQ-${Date.now().toString(36).toUpperCase()}`;
      await addDoc(collection(db, 'materialRequests'), {
        requestId: reqId, itemName: item, qty: Number(qty), unit: unit || '',
        vendorName: vendor, vendorId: worker.vendorId, workerId: worker.id,
        workerName: worker.name, reason, status: 'PENDING',
        createdAt: serverTimestamp(), resolvedAt: null,
      });
      onToast('Request submitted to manager');
      setItem(''); setQty(''); setReason('');
    } catch { alert('Error submitting request.'); }
    setLoading(false);
  };

  const itemOptions = [...new Set([...inventory.map(i => i.name), ...materialTypes.map(m => m.name)])];
  const vendorOptions = vendors.map(v => v.name || v.id);

  const statusMap = s => s === 'PENDING'
    ? { cls: 'b-pend' } : s === 'APPROVED'
    ? { cls: 'b-app' }  : { cls: 'b-rej' };

  return (
    <div className="mw-body">
      <div className="mw-card">
        <div className="mw-card-hd"><span className="mw-card-title"><I.Request />Raise Material Request</span></div>
        <div style={{ padding: 14 }}>
          <div className="mw-field">
            <label className="mw-flbl">Material Required *</label>
            <select className="mw-sel" value={item} onChange={e => setItem(e.target.value)}>
              <option value="">Select item…</option>
              {itemOptions.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div className="mw-grid2">
            <div><label className="mw-flbl">Quantity *</label><input className="mw-inp" type="number" inputMode="numeric" placeholder="e.g. 50" value={qty} onChange={e => setQty(e.target.value)} min="1" /></div>
            <div><label className="mw-flbl">Unit</label><input className="mw-inp" placeholder="Auto-filled" value={unit} onChange={e => setUnit(e.target.value)} /></div>
          </div>
          <div className="mw-field">
            <label className="mw-flbl">Preferred Vendor</label>
            <select className="mw-sel" value={vendor} onChange={e => setVendor(e.target.value)}>
              <option value="">Select vendor…</option>
              {vendorOptions.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="mw-field">
            <label className="mw-flbl">Justification / Urgency</label>
            <textarea className="mw-ta" rows={3} placeholder="Reason for request and urgency level…" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <button className="mw-submit" style={{ background: loading ? t.surface3 : t.accent }} onClick={submit} disabled={loading}>
            {loading ? <><div className="mw-spin" />Submitting…</> : <><I.Send />Submit to Manager</>}
          </button>
        </div>
      </div>

      {myRequests.length > 0 && (
        <div className="mw-card">
          <div className="mw-card-hd"><span className="mw-card-title">My Requests</span><span className="badge b-blue">{myRequests.length}</span></div>
          {myRequests.map(r => {
            const ss = statusMap(r.status);
            return (
              <div className="mw-row" key={r.id}>
                <div className="mw-row-ico" style={{ background: 'rgba(26,63,191,0.08)', color: '#1A3FBF', borderRadius: 6 }}>
                  {r.status === 'PENDING' ? <I.Clock /> : r.status === 'APPROVED' ? <I.Check /> : <I.X />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mw-row-title">{r.itemName} — {r.qty} {r.unit}</div>
                  <div className="mw-row-sub">{r.vendorName || '—'} · {fmtDate(r.createdAt)}</div>
                </div>
                <span className={`badge ${ss.cls}`}>{r.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function MaterialWorker({ preAuthUser, onLogout }) {
  const [tab, setTab] = useState('entry');
  const [dark, setDark] = useState(false);
  const [inv, setInv] = useState([]);
  const [myTxns, setMyTxns] = useState([]);
  const [myReqs, setMyReqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [matTypes, setMatTypes] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: '' });

  const t = dark ? DARK : LIGHT;

  const worker = {
    id: preAuthUser?.id || '',
    name: preAuthUser?.name || 'Worker',
    vendorId: preAuthUser?.vendorId || preAuthUser?.area || '',
    area: preAuthUser?.area || '',
  };

  const showToast = msg => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'materialInventory'), s => setInv(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = worker.id ? onSnapshot(
      query(collection(db, 'materialTransactions'), where('workerId', '==', worker.id)),
      s => setMyTxns(s.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().createdAt?.toDate?.()?.getTime?.() || null }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)))
    ) : () => {};
    const u3 = worker.id ? onSnapshot(
      query(collection(db, 'materialRequests'), where('workerId', '==', worker.id)),
      s => setMyReqs(s.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.getTime?.() || null }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
    ) : () => {};
    const u4 = onSnapshot(collection(db, 'vendors'), s => setVendors(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u5 = onSnapshot(collection(db, 'materialTypes'), s => setMatTypes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [worker.id]);

  const sharedProps = { worker, inventory: inv, vendors, materialTypes: matTypes, onToast: showToast, t };

  return (
    <>
      <style>{makeCSS(t)}</style>
      <div className="mw-root">
        <div className="mw-header">
          <div className="mw-header-inner">
            <div className="mw-logo-row">
              <img src="/logo.jpeg" alt="logo" className="mw-logo" />
              <div>
                <div className="mw-brand-name">Field Worker Portal</div>
                <div className="mw-brand-sub">NAGPUR JUNCTION</div>
              </div>
            </div>
            <div className="mw-user-row">
              <button className="mw-theme-btn" onClick={() => setDark(v => !v)}>
                {dark ? <I.Sun /> : <I.Moon />}
              </button>
              <div className="mw-uinfo">
                <div className="mw-uname">{worker.name}</div>
                <div className="mw-uid">{worker.id}</div>
              </div>
              <div className="mw-uav">{initials(worker.name)}</div>
              <button className="mw-logout-btn" onClick={() => onLogout?.()}>
                <I.Logout /> Logout
              </button>
            </div>
          </div>
          {worker.area && (
            <div className="mw-gps-bar">
              <span className="mw-gps-dot" />
              AREA: {worker.area}
            </div>
          )}
        </div>

        <div className="mw-tabs">
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} className={`mw-tab${tab === key ? ' on' : ''}`} onClick={() => setTab(key)}>
              <Icon />{label}
            </button>
          ))}
        </div>

        {tab === 'entry'   && <StockEntry {...sharedProps} />}
        {tab === 'balance' && <Balance inventory={inv} t={t} />}
        {tab === 'history' && <History myTxns={myTxns} t={t} />}
        {tab === 'request' && <Request {...sharedProps} myRequests={myReqs} />}

        <div className={`mw-toast${toast.show ? '' : ' off'}`}><I.Check />{toast.msg}</div>
      </div>
    </>
  );
}
