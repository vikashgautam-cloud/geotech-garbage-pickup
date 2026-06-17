/**
 * MaterialDept.jsx — Manager Dashboard
 * Fixed: scroll lock, worker area alignment, all features working
 * FIX: vendorDocId/vendorId now use preAuthUser.id FIRST (the real vendor
 * login document ID), not preAuthUser.area (just a display name). Using
 * area as a Firestore path segment created workers/materials under a
 * "phantom" vendor document that never actually existed, so WorkerLogin's
 * vendor-listing query could never find them — causing "No account found".
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../App';
import {
  collection, addDoc, serverTimestamp, query, where,
  onSnapshot, doc, updateDoc, getDocs, deleteDoc
} from 'firebase/firestore';
import { db } from '../../utils/firebase';

const I = {
  Grid:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Box:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  List:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Users:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Truck:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Bell:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Menu:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  X:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Camera:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  ArrowUp: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  ArrowDn: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  Check:   () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Trash:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Plus:    () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Alert:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Pin:     () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Search:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Sun:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Logout:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Package: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  Clock:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

const DARK_THEME = {
  isDark: true,
  bg:'#080E1A', surface:'#0D1526', surface2:'#111E30', surface3:'#162235',
  border:'rgba(255,255,255,0.07)', border2:'rgba(255,255,255,0.04)',
  accent:'#2A5CE8', green:'#10B981', amber:'#F59E0B', red:'#EF4444',
  text:'#E6EDF8', text2:'#8FA3C4', text3:'#4A5F80',
  navActive:'rgba(42,92,232,0.1)', navActiveBorder:'rgba(42,92,232,0.2)',
  topbar:'rgba(8,14,26,0.9)', cardShadow:'none',
  headerBg:'#060D1A', headerBorder:'rgba(255,255,255,0.06)',
};
const LIGHT_THEME = {
  isDark: false,
  bg:'#F2F4F7', surface:'#FFFFFF', surface2:'#F8F9FB', surface3:'#EEF1F6',
  border:'#DDE1EA', border2:'#EAEEf5',
  accent:'#1A3FBF', green:'#0E7A5A', amber:'#92400E', red:'#B91C1C',
  text:'#0C1A35', text2:'#3D4F72', text3:'#7A8BAA',
  navActive:'#EEF2FF', navActiveBorder:'#C7D2F8',
  topbar:'rgba(255,255,255,0.92)', cardShadow:'0 1px 3px rgba(0,0,0,0.06)',
  headerBg:'#FFFFFF', headerBorder:'#DDE1EA',
};

const makeCSS = (t) => `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

/* FIX: html/body must scroll freely */
html,body{
  height:100%;
  overflow-y:auto !important;
  -webkit-overflow-scrolling:touch;
}
body{background:${t.bg};font-family:'DM Sans',sans-serif;}

@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

/* FIX: root is flex column, not fixed height */
.md-root{
  display:flex;
  min-height:100%;
  background:${t.bg};
  color:${t.text};
  font-family:'DM Sans',sans-serif;
}

/* Sidebar — fixed, no overflow issue */
.md-side{width:220px;background:${t.surface};border-right:1px solid ${t.border};display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:200;transition:transform .25s ease;overflow-y:auto;}
.md-side.hidden{transform:translateX(-100%);}
.md-side-head{padding:16px 14px 13px;border-bottom:1px solid ${t.border};flex-shrink:0;}
.md-side-brand{display:flex;align-items:center;gap:10px;margin-bottom:13px;}
.md-side-brand img{width:28px;height:28px;border-radius:5px;object-fit:contain;background:#fff;padding:2px;flex-shrink:0;}
.md-side-bname{font-size:12px;font-weight:700;color:${t.text};}
.md-side-bsub{font-size:9px;color:${t.text3};margin-top:1px;font-family:'DM Mono',monospace;letter-spacing:.5px;}
.md-area-chip{background:${t.isDark ? 'rgba(42,92,232,0.08)' : '#EEF2FF'};border:1px solid ${t.isDark ? 'rgba(42,92,232,0.15)' : '#C7D2F8'};border-radius:5px;padding:7px 10px;}
.md-area-lbl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${t.text3};margin-bottom:3px;font-family:'DM Mono',monospace;}
.md-area-val{font-size:11px;font-weight:600;color:${t.isDark ? '#93C5FD' : t.accent};}
.md-nav{flex:1;padding:8px;overflow-y:auto;}
.md-nav-btn{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border-radius:6px;border:1px solid transparent;background:none;cursor:pointer;font-size:12px;font-weight:500;color:${t.text2};transition:all .15s;font-family:'DM Sans',sans-serif;margin-bottom:1px;text-align:left;-webkit-tap-highlight-color:transparent;}
.md-nav-btn:hover{color:${t.text};background:${t.isDark ? 'rgba(255,255,255,0.03)' : t.surface2};}
.md-nav-btn.on{color:${t.text};background:${t.navActive};border-color:${t.navActiveBorder};font-weight:600;}
.md-nav-btn.on svg{color:${t.accent};}
.md-side-foot{padding:12px;border-top:1px solid ${t.border};flex-shrink:0;}
.md-side-foot-top{display:flex;align-items:center;gap:9px;margin-bottom:10px;}
.md-avatar{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;background:${t.isDark ? 'rgba(42,92,232,0.15)' : '#E0E7FF'};color:${t.isDark ? '#93C5FD' : '#1A3FBF'};border:1px solid ${t.isDark ? 'rgba(42,92,232,0.25)' : '#C7D2F8'};font-family:'DM Mono',monospace;}
.md-uname{font-size:11px;font-weight:600;color:${t.text};}
.md-urole{font-size:9px;color:${t.text3};margin-top:1px;font-family:'DM Mono',monospace;}
.md-foot-btns{display:flex;gap:6px;}
.md-foot-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:7px;border-radius:6px;border:1px solid ${t.border};background:${t.isDark ? 'rgba(255,255,255,0.03)' : t.surface2};cursor:pointer;font-size:10px;font-weight:600;color:${t.text3};transition:all .15s;font-family:'DM Sans',sans-serif;}
.md-foot-btn.logout:hover{color:${t.isDark ? '#F87171' : '#B91C1C'};border-color:${t.isDark ? 'rgba(239,68,68,0.25)' : '#FECACA'};background:${t.isDark ? 'rgba(239,68,68,0.06)' : '#FEF2F2'};}

.md-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:199;}
.md-overlay.show{display:block;}

/* FIX: main scrolls independently */
.md-main{
  flex:1;
  margin-left:220px;
  display:flex;
  flex-direction:column;
  min-height:100vh;
  overflow-y:auto;
}
.md-topbar{height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 22px;background:${t.topbar};border-bottom:1px solid ${t.border};backdrop-filter:blur(12px);position:sticky;top:0;z-index:100;flex-shrink:0;}
.md-topbar-l{display:flex;align-items:center;gap:11px;}
.md-burger{display:none;background:none;border:none;color:${t.text};cursor:pointer;padding:4px;align-items:center;justify-content:center;}
.md-ptitle{font-size:13px;font-weight:700;color:${t.text};}
.md-psub{font-size:10px;color:${t.text3};margin-top:1px;font-family:'DM Mono',monospace;}
.md-topbar-r{display:flex;align-items:center;gap:7px;}
.md-tbchip{display:flex;align-items:center;gap:5px;background:${t.isDark ? 'rgba(255,255,255,0.04)' : t.surface2};border:1px solid ${t.border};border-radius:4px;padding:4px 10px;font-size:10px;color:${t.text3};font-family:'DM Mono',monospace;}
.md-livdot{width:5px;height:5px;border-radius:50%;background:${t.green};animation:pulse 2s infinite;}
.md-tb-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:5px;border:1px solid ${t.border};background:${t.isDark ? 'rgba(255,255,255,0.03)' : t.surface2};cursor:pointer;font-size:10px;font-weight:600;color:${t.text3};font-family:'DM Sans',sans-serif;transition:all .15s;}
.md-tb-logout{border-color:${t.isDark ? 'rgba(239,68,68,0.2)' : '#FECACA'};background:${t.isDark ? 'rgba(239,68,68,0.05)' : '#FEF2F2'};color:${t.isDark ? '#F87171' : '#B91C1C'};}

.md-content{flex:1;padding:22px;overflow-x:hidden;}

.md-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:20px;}
.md-stat{background:${t.surface};border:1px solid ${t.border};border-radius:10px;padding:16px 18px;animation:fadeUp .3s ease both;box-shadow:${t.cardShadow};}
.md-stat-lbl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:${t.text3};margin-bottom:10px;font-family:'DM Mono',monospace;}
.md-stat-val{font-size:26px;font-weight:800;line-height:1;margin-bottom:4px;font-family:'DM Mono',monospace;}
.md-stat-sub{font-size:10px;color:${t.text3};font-family:'DM Mono',monospace;}

.md-card{background:${t.surface};border:1px solid ${t.border};border-radius:10px;overflow:hidden;margin-bottom:16px;animation:fadeUp .3s ease both;box-shadow:${t.cardShadow};}
.md-card-hd{padding:12px 16px;border-bottom:1px solid ${t.border};display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;background:${t.surface2};}
.md-card-title{font-size:11px;font-weight:700;color:${t.text};display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:.5px;font-family:'DM Mono',monospace;}

.md-tbl-wrap{overflow-x:auto;}
.md-tbl{width:100%;border-collapse:collapse;font-size:12px;min-width:560px;}
.md-tbl th{padding:8px 13px;text-align:left;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:${t.text3};background:${t.isDark ? 'rgba(255,255,255,0.02)' : t.surface2};border-bottom:1px solid ${t.border};white-space:nowrap;font-family:'DM Mono',monospace;}
.md-tbl td{padding:10px 13px;border-bottom:1px solid ${t.border2};color:${t.text};vertical-align:middle;font-size:12px;}
.md-tbl tr:last-child td{border-bottom:none;}
.md-tbl tr:hover td{background:${t.isDark ? 'rgba(255,255,255,0.01)' : t.surface2};}

.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:3px;font-size:9px;font-weight:700;letter-spacing:.5px;white-space:nowrap;font-family:'DM Mono',monospace;text-transform:uppercase;}
${t.isDark ? `
.b-in  {background:rgba(16,185,129,0.1);color:#34D399;}
.b-out {background:rgba(239,68,68,0.1);color:#F87171;}
.b-amber{background:rgba(245,158,11,0.1);color:#FCD34D;}
.b-blue{background:rgba(59,130,246,0.1);color:#93C5FD;}
.b-muted{background:rgba(255,255,255,0.05);color:#64748B;}
.b-good{background:rgba(16,185,129,0.1);color:#34D399;}
.b-low {background:rgba(245,158,11,0.1);color:#FCD34D;}
.b-crit{background:rgba(239,68,68,0.1);color:#F87171;}
.b-pend{background:rgba(245,158,11,0.1);color:#FCD34D;}
.b-app {background:rgba(16,185,129,0.1);color:#34D399;}
.b-rej {background:rgba(239,68,68,0.1);color:#F87171;}
` : `
.b-in  {background:rgba(14,122,90,0.1);color:#0E7A5A;}
.b-out {background:rgba(185,28,28,0.1);color:#B91C1C;}
.b-amber{background:rgba(146,64,14,0.1);color:#92400E;}
.b-blue{background:rgba(26,63,191,0.1);color:#1A3FBF;}
.b-muted{background:#F1F5F9;color:#64748B;}
.b-good{background:rgba(14,122,90,0.1);color:#0E7A5A;}
.b-low {background:rgba(146,64,14,0.1);color:#92400E;}
.b-crit{background:rgba(185,28,28,0.1);color:#B91C1C;}
.b-pend{background:rgba(146,64,14,0.1);color:#92400E;}
.b-app {background:rgba(14,122,90,0.1);color:#0E7A5A;}
.b-rej {background:rgba(185,28,28,0.1);color:#B91C1C;}
`}

.av{border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;background:${t.isDark ? 'rgba(42,92,232,0.12)' : '#E0E7FF'};color:${t.isDark ? '#93C5FD' : '#1A3FBF'};font-size:10px;font-family:'DM Mono',monospace;}
.inv-bar{height:2px;background:${t.isDark ? 'rgba(255,255,255,0.05)' : t.border};border-radius:2px;margin-top:5px;overflow:hidden;}
.inv-fill{height:100%;border-radius:2px;transition:width .4s;}
.ph-thumb{width:34px;height:34px;border-radius:5px;object-fit:cover;border:1px solid ${t.border};cursor:pointer;transition:opacity .15s;display:block;}
.ph-thumb:hover{opacity:.7;}
.ph-empty{width:34px;height:34px;border-radius:5px;background:${t.isDark ? 'rgba(255,255,255,0.03)' : t.surface2};border:1px solid ${t.border};display:flex;align-items:center;justify-content:center;color:${t.text3};}

.md-lb{position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;cursor:zoom-out;}
.md-lb img{max-width:100%;max-height:85vh;border-radius:8px;}
.md-lb-close{position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:50%;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;}

.md-wgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;padding:13px;}
.md-wcard{background:${t.surface2};border:1px solid ${t.border};border-radius:8px;padding:11px 13px;display:flex;align-items:center;gap:10px;transition:border-color .15s;}
.md-wname{font-size:12px;font-weight:600;color:${t.text};}
.md-wid{font-size:9px;color:${t.text3};margin-top:2px;font-family:'DM Mono',monospace;}
.md-icon-btn{background:none;border:none;cursor:pointer;color:${t.text3};padding:4px;border-radius:5px;display:flex;align-items:center;transition:all .15s;margin-left:auto;flex-shrink:0;}
.md-icon-btn:hover{color:${t.red};background:${t.isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2'};}

.md-form-row{display:grid;gap:10px;padding:13px 16px;border-bottom:1px solid ${t.border};align-items:end;}
.md-f3{grid-template-columns:1fr 1fr 1fr auto;}
.md-flbl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:${t.text3};display:block;margin-bottom:5px;font-family:'DM Mono',monospace;}
.md-inp{width:100%;padding:8px 10px;background:${t.isDark ? t.bg : t.surface2};border:1px solid ${t.border};border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;color:${t.text};outline:none;transition:border-color .15s;}
.md-inp::placeholder{color:${t.text3};}
.md-inp:focus{border-color:${t.isDark ? 'rgba(42,92,232,0.4)' : t.accent};}
.md-sel{width:100%;padding:8px 10px;background:${t.isDark ? t.bg : t.surface2};border:1px solid ${t.border};border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;color:${t.text};outline:none;cursor:pointer;}

.md-btn{padding:8px 13px;border-radius:6px;border:none;cursor:pointer;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px;transition:all .15s;white-space:nowrap;}
.md-btn-p{background:${t.accent};color:#fff;}
.md-btn-p:hover{opacity:.88;}
.md-btn-g{background:${t.isDark ? 'rgba(16,185,129,0.12)' : 'rgba(14,122,90,0.08)'};color:${t.isDark ? '#34D399' : '#0E7A5A'};border:1px solid ${t.isDark ? 'rgba(16,185,129,0.2)' : 'rgba(14,122,90,0.2)'};}
.md-btn-r{background:${t.isDark ? 'rgba(239,68,68,0.1)' : 'rgba(185,28,28,0.07)'};color:${t.isDark ? '#F87171' : '#B91C1C'};border:1px solid ${t.isDark ? 'rgba(239,68,68,0.2)' : 'rgba(185,28,28,0.15)'};}
.md-btn:disabled{opacity:.45;cursor:not-allowed;}

.md-srch{padding:6px 10px;background:${t.isDark ? t.bg : t.surface2};border:1px solid ${t.border};border-radius:6px;font-size:11px;font-family:'DM Sans',sans-serif;color:${t.text};outline:none;width:180px;transition:border-color .15s;}
.md-srch::placeholder{color:${t.text3};}

.md-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${t.surface};border:1px solid ${t.border};color:${t.text};padding:9px 18px;border-radius:5px;font-size:11px;font-weight:600;z-index:9999;display:flex;align-items:center;gap:6px;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:opacity .3s;font-family:'DM Mono',monospace;}
.md-toast.off{opacity:0;pointer-events:none;}
.md-spin{width:12px;height:12px;border:1.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite;}
.md-empty{padding:36px 20px;text-align:center;color:${t.text3};}
.md-empty p{font-size:12px;margin-top:8px;}

.md-inv-row{display:flex;align-items:center;padding:11px 16px;border-bottom:1px solid ${t.border2};gap:11px;}
.md-inv-row:last-child{border-bottom:none;}
.md-inv-ic{width:34px;height:34px;border-radius:7px;background:${t.isDark ? 'rgba(255,255,255,0.03)' : t.surface2};border:1px solid ${t.border};display:flex;align-items:center;justify-content:center;flex-shrink:0;}

.md-page-hd{margin-bottom:18px;}
.md-page-title{font-size:17px;font-weight:800;letter-spacing:-.3px;color:${t.text};margin-bottom:3px;}
.md-page-sub{font-size:11px;color:${t.text3};font-family:'DM Mono',monospace;}

@media(max-width:960px){
  .md-main{margin-left:0;}
  .md-side{transform:translateX(-100%);}
  .md-side.show{transform:translateX(0);}
  .md-burger{display:flex!important;}
  .md-stats{grid-template-columns:1fr 1fr;}
  .md-content{padding:14px;}
  .md-topbar{padding:0 14px;}
  .md-topbar-r{display:none;}
  .md-f3{grid-template-columns:1fr;}
}
@media(max-width:520px){
  .md-stats{grid-template-columns:1fr 1fr;gap:8px;}
  .md-wgrid{grid-template-columns:1fr;}
}
`;

const initials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
const fmtTime  = ts => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate  = ts => ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const NAV = [
  { key: 'dashboard',    label: 'Dashboard',    Icon: I.Grid },
  { key: 'inventory',    label: 'Inventory',    Icon: I.Box },
  { key: 'transactions', label: 'Transactions', Icon: I.List },
  { key: 'workers',      label: 'Workers',      Icon: I.Users },
  // { key: 'vendors',      label: 'Vendors',      Icon: I.Truck },
  { key: 'requests',     label: 'Requests',     Icon: I.Bell },
  { key: 'materials',    label: 'Materials',    Icon: I.Box },
];

function Av({ name, size = 26 }) {
  return <div className="av" style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>{initials(name)}</div>;
}
function PhotoCell({ photo, onClick }) {
  if (!photo) return <div className="ph-empty"><I.Camera /></div>;
  return <img className="ph-thumb" src={photo} alt="proof" onClick={() => onClick(photo)} />;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ inventory, transactions, requests, onApprove, onReject, onPhoto, t }) {
  const today = new Date().toDateString();
  const todayTxns = transactions.filter(tx => new Date(tx.timestamp).toDateString() === today);
  const inToday   = todayTxns.filter(tx => tx.type === 'IN').reduce((s, tx) => s + Number(tx.qty), 0);
  const outToday  = todayTxns.filter(tx => tx.type === 'OUT').reduce((s, tx) => s + Number(tx.qty), 0);
  const lowStock  = inventory.filter(i => i.currentStock <= i.minStock);
  const pending   = requests.filter(r => r.status === 'PENDING');

  return <>
    <div className="md-page-hd">
      <div className="md-page-title">Operational Overview</div>
      <div className="md-page-sub">Real-time material tracking — Nagpur Junction</div>
    </div>
    <div className="md-stats">
      {[
        { lbl: 'Total Items',      val: inventory.length,  sub: 'In storage',   color: t.accent },
        { lbl: 'Stock In Today',   val: inToday,            sub: `${todayTxns.filter(tx=>tx.type==='IN').length} entries`,  color: t.green },
        { lbl: 'Stock Out Today',  val: outToday,           sub: `${todayTxns.filter(tx=>tx.type==='OUT').length} entries`, color: t.amber },
        { lbl: 'Low Stock Alerts', val: lowStock.length,    sub: 'Needs reorder', color: t.red },
      ].map((s, i) => (
        <div className="md-stat" key={s.lbl} style={{ animationDelay: `${i*50}ms` }}>
          <div className="md-stat-lbl">{s.lbl}</div>
          <div className="md-stat-val" style={{ color: s.color }}>{s.val}</div>
          <div className="md-stat-sub">{s.sub}</div>
        </div>
      ))}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 13, marginBottom: 16 }}>
      <div className="md-card">
        <div className="md-card-hd"><span className="md-card-title"><I.List />Recent Transactions</span><span className="badge b-blue">Live</span></div>
        <div className="md-tbl-wrap">
          <table className="md-tbl">
            <thead><tr>{['Item','Type','Qty','Worker','Photo','Time'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {transactions.slice(0,6).map(tx => (
                <tr key={tx.id}>
                  <td><strong>{tx.itemName}</strong></td>
                  <td><span className={`badge ${tx.type==='IN'?'b-in':'b-out'}`}>{tx.type==='IN'?<I.ArrowDn/>:<I.ArrowUp/>}{tx.type}</span></td>
                  <td style={{ fontWeight:600,fontFamily:'DM Mono,monospace' }}>{tx.qty} {tx.unit}</td>
                  <td><div style={{ display:'flex',alignItems:'center',gap:6 }}><Av name={tx.workerName} size={22}/><span>{tx.workerName?.split(' ')[0]}</span></div></td>
                  <td><PhotoCell photo={tx.photo} onClick={onPhoto}/></td>
                  <td style={{ opacity:.55,fontFamily:'DM Mono,monospace',fontSize:10 }}>{fmtTime(tx.timestamp)}</td>
                </tr>
              ))}
              {transactions.length===0 && <tr><td colSpan={6} style={{ textAlign:'center',opacity:.35,padding:24,fontFamily:'DM Mono,monospace',fontSize:11 }}>No transactions recorded</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="md-card">
        <div className="md-card-hd"><span className="md-card-title"><I.Box />Inventory Levels</span></div>
        {inventory.map(item => {
          const pct   = item.maxStock>0 ? Math.min(100,Math.round((item.currentStock/item.maxStock)*100)) : 0;
          const isLow = item.currentStock <= item.minStock;
          return (
            <div className="md-inv-row" key={item.id}>
              <div className="md-inv-ic"><I.Package /></div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{item.name}</div>
                <div style={{ fontSize:9,opacity:.45,marginTop:1,fontFamily:'DM Mono,monospace' }}>{item.vendorName||'—'}</div>
                <div className="inv-bar"><div className="inv-fill" style={{ width:`${pct}%`,background:isLow?t.red:pct>50?t.accent:t.amber }}/></div>
              </div>
              <div style={{ textAlign:'right',flexShrink:0 }}>
                <div style={{ fontSize:14,fontWeight:800,color:isLow?t.red:undefined,fontFamily:'DM Mono,monospace' }}>{item.currentStock}</div>
                <div style={{ fontSize:9,opacity:.45,fontFamily:'DM Mono,monospace' }}>{item.unit}{isLow&&<span style={{color:t.red}}> LOW</span>}</div>
              </div>
            </div>
          );
        })}
        {inventory.length===0 && <div className="md-empty"><p>No inventory items</p></div>}
      </div>
    </div>

    {pending.length>0 && (
      <div className="md-card">
        <div className="md-card-hd"><span className="md-card-title"><I.Bell />Pending Requests</span><span className="badge b-amber">{pending.length} pending</span></div>
        <div className="md-tbl-wrap">
          <table className="md-tbl">
            <thead><tr>{['Request ID','Worker','Item','Qty','Vendor','Time','Action'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {pending.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily:'DM Mono,monospace',fontSize:10,color:t.accent }}>{r.requestId}</td>
                  <td><div style={{ display:'flex',alignItems:'center',gap:6 }}><Av name={r.workerName} size={22}/><span>{r.workerName}</span></div></td>
                  <td><strong>{r.itemName}</strong></td>
                  <td style={{ fontFamily:'DM Mono,monospace' }}>{r.qty} {r.unit}</td>
                  <td><span className="badge b-blue">{r.vendorName||'—'}</span></td>
                  <td style={{ opacity:.45,fontSize:10,fontFamily:'DM Mono,monospace' }}>{fmtTime(r.createdAt)}</td>
                  <td><div style={{ display:'flex',gap:5 }}><button className="md-btn md-btn-g" onClick={()=>onApprove(r.id)}><I.Check/>Approve</button><button className="md-btn md-btn-r" onClick={()=>onReject(r.id)}><I.X/>Reject</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </>;
}

function InventoryView({ inventory, t }) {
  const [q, setQ] = useState('');
  const rows = inventory.filter(i => i.name?.toLowerCase().includes(q.toLowerCase()));
  return <>
    <div className="md-page-hd"><div className="md-page-title">Inventory</div><div className="md-page-sub">Current stock levels and vendor mapping</div></div>
    <div className="md-card">
      <div className="md-card-hd">
        <span className="md-card-title"><I.Box />All Items</span>
        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
          <I.Search/><input className="md-srch" placeholder="Search items…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
      </div>
      <div className="md-tbl-wrap">
        <table className="md-tbl">
          <thead><tr>{['','Item Name','Category','Stock','Min / Max','Unit','Vendor','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(item => {
              const isLow  = item.currentStock<=item.minStock;
              const isCrit = item.currentStock<=(item.minStock*0.5);
              return <tr key={item.id}>
                <td><I.Package/></td>
                <td><strong>{item.name}</strong></td>
                <td style={{ opacity:.55 }}>{item.category||'—'}</td>
                <td style={{ fontWeight:700,color:isLow?t.red:undefined,fontFamily:'DM Mono,monospace' }}>{item.currentStock}</td>
                <td style={{ opacity:.45,fontFamily:'DM Mono,monospace',fontSize:11 }}>{item.minStock} / {item.maxStock}</td>
                <td style={{ fontFamily:'DM Mono,monospace' }}>{item.unit}</td>
                <td><span className="badge b-blue">{item.vendorName||'—'}</span></td>
                <td><span className={`badge ${isCrit?'b-crit':isLow?'b-low':'b-good'}`}>{isCrit?'Critical':isLow?'Low':'Normal'}</span></td>
              </tr>;
            })}
            {rows.length===0 && <tr><td colSpan={8} style={{ textAlign:'center',opacity:.35,padding:28,fontFamily:'DM Mono,monospace',fontSize:11 }}>No items found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </>;
}

function TransactionsView({ transactions, onPhoto, t }) {
  const [q,  setQ]  = useState('');
  const [tf, setTf] = useState('All');
  const rows = useMemo(() => transactions.filter(tx => {
    const ms = tx.itemName?.toLowerCase().includes(q.toLowerCase()) || tx.workerName?.toLowerCase().includes(q.toLowerCase());
    return ms && (tf==='All' || tx.type===tf);
  }), [transactions, q, tf]);
  return <>
    <div className="md-page-hd"><div className="md-page-title">Transaction Log</div><div className="md-page-sub">Full stock IN/OUT history with photo verification</div></div>
    <div className="md-card">
      <div className="md-card-hd">
        <span className="md-card-title"><I.List />All Transactions</span>
        <div style={{ display:'flex',gap:7,flexWrap:'wrap' }}>
          <div style={{ display:'flex',alignItems:'center',gap:5 }}>
            <I.Search/><input className="md-srch" style={{ width:140 }} placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <select className="md-sel" style={{ width:'auto',padding:'6px 10px' }} value={tf} onChange={e=>setTf(e.target.value)}>
            <option>All</option><option>IN</option><option>OUT</option>
          </select>
        </div>
      </div>
      <div className="md-tbl-wrap">
        <table className="md-tbl">
          <thead><tr>{['TXN ID','Item','Type','Qty','Worker','Vendor','Balance','Photo','Timestamp'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(tx=>(
              <tr key={tx.id}>
                <td style={{ fontFamily:'DM Mono,monospace',fontSize:9,color:t.accent }}>{tx.txnId||tx.id.slice(0,8).toUpperCase()}</td>
                <td><strong>{tx.itemName}</strong></td>
                <td><span className={`badge ${tx.type==='IN'?'b-in':'b-out'}`}>{tx.type==='IN'?<I.ArrowDn/>:<I.ArrowUp/>}{tx.type}</span></td>
                <td style={{ fontWeight:600,fontFamily:'DM Mono,monospace' }}>{tx.qty} {tx.unit}</td>
                <td><div style={{ display:'flex',alignItems:'center',gap:5 }}><Av name={tx.workerName} size={20}/><span>{tx.workerName}</span></div></td>
                <td>{tx.vendorName?<span className="badge b-blue">{tx.vendorName}</span>:<span style={{opacity:.35}}>—</span>}</td>
                <td style={{ fontWeight:600,fontFamily:'DM Mono,monospace' }}>{tx.balanceAfter??'—'} {tx.unit}</td>
                <td><PhotoCell photo={tx.photo} onClick={onPhoto}/></td>
                <td style={{ opacity:.45,fontSize:9,fontFamily:'DM Mono,monospace' }}>{fmtDate(tx.timestamp)}</td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={9} style={{ textAlign:'center',opacity:.35,padding:28,fontFamily:'DM Mono,monospace',fontSize:11 }}>No transactions found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </>;
}

// FIX: WorkersView now uses preAuthUser.id FIRST (the actual vendor login
// document ID) as the Firestore path for storing workers. Previously this
// used `area` first — a human-readable area name, not a real document ID —
// which created workers under a vendor path that never genuinely existed,
// so WorkerLogin.jsx (which lists real vendor docs) could never find them.
function WorkersView({ transactions, preAuthUser, t }) {
  const vendorDocId = (preAuthUser?.id || preAuthUser?.area || '').trim();
  const [wName,  setWName]  = useState('');
  const [wLogin, setWLogin] = useState('');
  const [wPwd,   setWPwd]   = useState('');
  const [adding, setAdding] = useState(false);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    if (!vendorDocId) return;
    const unsub = onSnapshot(
      collection(db, 'vendors', vendorDocId, 'workers'),
      snap => setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [vendorDocId]);

  const addWorker = async e => {
    e.preventDefault();
    if (!wName || !wLogin || !wPwd || !vendorDocId) return;
    setAdding(true);
    try {
      await addDoc(collection(db, 'vendors', vendorDocId, 'workers'), {
        workerName: wName.trim(), loginId: wLogin.trim().toLowerCase(),
        password: wPwd.trim(), createdAt: serverTimestamp()
      });
      setWName(''); setWLogin(''); setWPwd('');
    } catch (err) { alert(err.message); }
    setAdding(false);
  };

  const removeWorker = async id => {
    if (!window.confirm('Remove this worker?')) return;
    try { await deleteDoc(doc(db, 'vendors', vendorDocId, 'workers', id)); } catch (err) { alert(err.message); }
  };

  const actMap = useMemo(() => {
    const m = {};
    transactions.forEach(tx => { if (!tx.workerId) return; if (!m[tx.workerId]) m[tx.workerId]={count:0}; m[tx.workerId].count++; });
    return m;
  }, [transactions]);

  return <>
    <div className="md-page-hd"><div className="md-page-title">Workers</div><div className="md-page-sub">Manage field workers assigned to your area</div></div>
    {!vendorDocId && (
      <div style={{ background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:14,marginBottom:16,fontSize:12,color:'#B91C1C' }}>
        Vendor area not configured. Contact system administrator.
      </div>
    )}
    <div className="md-card">
      <div className="md-card-hd"><span className="md-card-title"><I.Plus />Register New Worker</span><span className="badge b-blue">{vendorDocId || 'N/A'}</span></div>
      <form onSubmit={addWorker}>
        <div className="md-form-row md-f3">
          <div><label className="md-flbl">Full Name</label><input className="md-inp" placeholder="e.g. Ramesh Kumar" value={wName} onChange={e=>setWName(e.target.value)} required/></div>
          <div><label className="md-flbl">Login ID</label><input className="md-inp" placeholder="e.g. ramesh_01" value={wLogin} onChange={e=>setWLogin(e.target.value)} required autoCapitalize="none"/></div>
          <div><label className="md-flbl">Password</label><input className="md-inp" type="password" placeholder="Set password" value={wPwd} onChange={e=>setWPwd(e.target.value)} required/></div>
          <button type="submit" disabled={adding||!vendorDocId} className="md-btn md-btn-p"><I.Plus/>{adding?'Adding…':'Register'}</button>
        </div>
      </form>
    </div>
    <div className="md-card">
      <div className="md-card-hd"><span className="md-card-title"><I.Users />Registered Workers</span><span className="badge b-muted">{workers.length} total</span></div>
      <div className="md-wgrid">
        {workers.map(w => (
          <div className="md-wcard" key={w.id}>
            <div className="av" style={{ width:34,height:34,fontSize:11 }}>{initials(w.workerName)}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div className="md-wname">{w.workerName}</div>
              <div className="md-wid">{w.loginId} · {actMap[w.loginId]?.count||0} txns</div>
            </div>
            <button className="md-icon-btn" onClick={()=>removeWorker(w.id)}><I.Trash/></button>
          </div>
        ))}
        {workers.length===0 && <div className="md-empty" style={{ padding:18 }}><p>No workers registered. Add one above.</p></div>}
      </div>
    </div>
  </>;
}

function VendorsView({ transactions, inventory, t }) {
  const vendorMap = useMemo(() => {
    const m = {};
    inventory.forEach(i => { if (i.vendorName && !m[i.vendorName]) m[i.vendorName]={name:i.vendorName,items:[],workers:new Set(),last:null}; if (i.vendorName) m[i.vendorName].items.push(i.name); });
    transactions.filter(tx=>tx.type==='IN'&&tx.vendorName).forEach(tx => { if (!m[tx.vendorName]) m[tx.vendorName]={name:tx.vendorName,items:[],workers:new Set(),last:null}; m[tx.vendorName].workers.add(tx.workerName); if (!m[tx.vendorName].last||new Date(tx.timestamp)>new Date(m[tx.vendorName].last)) m[tx.vendorName].last=tx.timestamp; });
    return Object.values(m).map(v=>({...v,workers:v.workers.size}));
  }, [transactions, inventory]);
  return <>
    <div className="md-page-hd"><div className="md-page-title">Vendors</div><div className="md-page-sub">Vendor directory and supply information</div></div>
    <div className="md-card">
      <div className="md-tbl-wrap">
        <table className="md-tbl">
          <thead><tr>{['Vendor Name','Items Supplied','Active Workers','Last Delivery'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {vendorMap.map(v=>(
              <tr key={v.name}>
                <td><strong>{v.name}</strong></td>
                <td style={{ fontSize:11,opacity:.55 }}>{[...new Set(v.items)].join(', ')||'—'}</td>
                <td style={{ fontFamily:'DM Mono,monospace' }}>{v.workers}</td>
                <td style={{ opacity:.45,fontSize:10,fontFamily:'DM Mono,monospace' }}>{fmtDate(v.last)}</td>
              </tr>
            ))}
            {vendorMap.length===0 && <tr><td colSpan={4} style={{ textAlign:'center',opacity:.35,padding:28,fontFamily:'DM Mono,monospace',fontSize:11 }}>No vendors on record</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </>;
}

function RequestsView({ requests, onApprove, onReject, t }) {
  return <>
    <div className="md-page-hd"><div className="md-page-title">Stock Requests</div><div className="md-page-sub">Worker-raised material requests pending approval</div></div>
    <div className="md-card">
      <div className="md-tbl-wrap">
        <table className="md-tbl">
          <thead><tr>{['Request ID','Worker','Item','Qty','Vendor','Reason','Status','Date','Action'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {requests.map(r=>{
              const sc = r.status==='APPROVED'?'b-app':r.status==='REJECTED'?'b-rej':'b-pend';
              return <tr key={r.id}>
                <td style={{ fontFamily:'DM Mono,monospace',fontSize:9,color:t.accent }}>{r.requestId}</td>
                <td><div style={{ display:'flex',alignItems:'center',gap:5 }}><Av name={r.workerName} size={20}/><span>{r.workerName}</span></div></td>
                <td><strong>{r.itemName}</strong></td>
                <td style={{ fontFamily:'DM Mono,monospace' }}>{r.qty} {r.unit}</td>
                <td><span className="badge b-blue">{r.vendorName||'—'}</span></td>
                <td style={{ fontSize:11,opacity:.55,maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{r.reason||'—'}</td>
                <td><span className={`badge ${sc}`}>{r.status}</span></td>
                <td style={{ fontSize:9,opacity:.45,fontFamily:'DM Mono,monospace' }}>{r.createdAt?new Date(r.createdAt).toLocaleDateString('en-IN'):'—'}</td>
                <td>{r.status==='PENDING'&&<div style={{ display:'flex',gap:5 }}><button className="md-btn md-btn-g" onClick={()=>onApprove(r.id)}><I.Check/>Approve</button><button className="md-btn md-btn-r" onClick={()=>onReject(r.id)}><I.X/>Reject</button></div>}</td>
              </tr>;
            })}
            {requests.length===0 && <tr><td colSpan={9} style={{ textAlign:'center',opacity:.35,padding:28,fontFamily:'DM Mono,monospace',fontSize:11 }}>No requests submitted</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </>;
}

// FIX: same priority fix as WorkersView — id first, area as fallback.
function MaterialsView({ preAuthUser, t }) {
  const vendorId = (preAuthUser?.id || preAuthUser?.area || '').trim();
  const [types, setTypes] = useState([]);
  const [name,  setName]  = useState('');
  const [unit,  setUnit]  = useState('');
  const [cat,   setCat]   = useState('');
  const [minS,  setMinS]  = useState('10');
  const [maxS,  setMaxS]  = useState('500');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'materialTypes'), s => setTypes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  const addType = async e => {
    e.preventDefault();
    if (!name || !unit) return;
    setAdding(true);
    try {
      await addDoc(collection(db, 'materialTypes'), {
        name: name.trim(), unit: unit.trim(), category: cat.trim()||'General',
        minStock: Number(minS)||10, maxStock: Number(maxS)||500,
        vendorId, createdAt: serverTimestamp()
      });
      setName(''); setUnit(''); setCat(''); setMinS('10'); setMaxS('500');
    } catch (err) { alert(err.message); }
    setAdding(false);
  };

  const removeType = async id => {
    if (!window.confirm('Delete this material type?')) return;
    try { await deleteDoc(doc(db, 'materialTypes', id)); } catch (err) { alert(err.message); }
  };

  return <>
    <div className="md-page-hd"><div className="md-page-title">Material Catalogue</div><div className="md-page-sub">Define material types visible to field workers in stock entry</div></div>
    <div className="md-card">
      <div className="md-card-hd"><span className="md-card-title"><I.Plus />Add Material Type</span></div>
      <form onSubmit={addType}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:10,padding:'13px 16px',borderBottom:`1px solid ${t.border}`,alignItems:'end' }}>
          <div><label className="md-flbl">Material Name *</label><input className="md-inp" placeholder="e.g. Steel Bolts" value={name} onChange={e=>setName(e.target.value)} required/></div>
          <div><label className="md-flbl">Unit *</label><input className="md-inp" placeholder="e.g. kg, pcs" value={unit} onChange={e=>setUnit(e.target.value)} required/></div>
          <div><label className="md-flbl">Category</label><input className="md-inp" placeholder="e.g. Hardware" value={cat} onChange={e=>setCat(e.target.value)}/></div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
            <div><label className="md-flbl">Min</label><input className="md-inp" type="number" value={minS} onChange={e=>setMinS(e.target.value)} min="0"/></div>
            <div><label className="md-flbl">Max</label><input className="md-inp" type="number" value={maxS} onChange={e=>setMaxS(e.target.value)} min="1"/></div>
          </div>
          <button type="submit" disabled={adding} className="md-btn md-btn-p"><I.Plus/>{adding?'Adding…':'Add'}</button>
        </div>
      </form>
    </div>
    <div className="md-card">
      <div className="md-card-hd"><span className="md-card-title"><I.Box />Defined Material Types</span><span className="badge b-muted">{types.length} types</span></div>
      <div className="md-tbl-wrap">
        <table className="md-tbl">
          <thead><tr>{['Name','Category','Unit','Min Stock','Max Stock',''].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {types.map(tp=>(
              <tr key={tp.id}>
                <td><strong>{tp.name}</strong></td>
                <td style={{ opacity:.55 }}>{tp.category||'—'}</td>
                <td><span className="badge b-blue">{tp.unit}</span></td>
                <td style={{ fontFamily:'DM Mono,monospace' }}>{tp.minStock??'—'}</td>
                <td style={{ fontFamily:'DM Mono,monospace' }}>{tp.maxStock??'—'}</td>
                <td><button className="md-icon-btn" onClick={()=>removeType(tp.id)}><I.Trash/></button></td>
              </tr>
            ))}
            {types.length===0 && <tr><td colSpan={6} style={{ textAlign:'center',opacity:.35,padding:28,fontFamily:'DM Mono,monospace',fontSize:11 }}>No material types defined</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </>;
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function MaterialDept({ preAuthUser, onLogout }) {
  const [nav,       setNav]  = useState('dashboard');
  const [sideOpen,  setSide] = useState(false);
  const [lightbox,  setLb]   = useState(null);
  const [dark,      setDark] = useState(true);
  const [inventory, setInv]  = useState([]);
  const [transactions, setTxn] = useState([]);
  const [requests,  setReq]  = useState([]);
  const [toast,     setToast] = useState({ show: false, msg: '' });

  const t = dark ? DARK_THEME : LIGHT_THEME;

  const showToast = msg => { setToast({ show: true, msg }); setTimeout(() => setToast({ show: false, msg: '' }), 3000); };

  const handleLogout = () => { if (window.confirm('Sign out of Material Department portal?')) onLogout?.(); };

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'materialInventory'), s => setInv(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(
      query(collection(db, 'materialTransactions'), where('type', 'in', ['IN','OUT'])),
      s => setTxn(s.docs.map(d => ({ id:d.id,...d.data(),timestamp:d.data().createdAt?.toDate?.()?.getTime?.()||null })).sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)))
    );
    const u3 = onSnapshot(
      collection(db, 'materialRequests'),
      s => setReq(s.docs.map(d => ({ id:d.id,...d.data(),createdAt:d.data().createdAt?.toDate?.()?.getTime?.()||null })).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)))
    );
    return () => { u1(); u2(); u3(); };
  }, []);

  const handleApprove = async id => { await updateDoc(doc(db,'materialRequests',id),{ status:'APPROVED',resolvedAt:serverTimestamp() }); showToast('Request approved'); };
  const handleReject  = async id => { await updateDoc(doc(db,'materialRequests',id),{ status:'REJECTED',resolvedAt:serverTimestamp() }); showToast('Request rejected'); };

  const sharedProps = { inventory, transactions, requests, onApprove: handleApprove, onReject: handleReject, onPhoto: setLb, t };
  const navTitles   = { dashboard:'Dashboard', inventory:'Inventory', transactions:'Transactions', workers:'Workers', vendors:'Vendors', requests:'Requests', materials:'Materials' };

  return (
    <>
      <style>{makeCSS(t)}</style>
      <div className="md-root">
        <div className={`md-overlay${sideOpen?' show':''}`} onClick={() => setSide(false)} />

        <aside className={`md-side${sideOpen?' show':''}`}>
          <div className="md-side-head">
            <div className="md-side-brand">
              <img src="/logo.jpeg" alt="logo" />
              <div><div className="md-side-bname">Material Dept</div><div className="md-side-bsub">MANAGER PORTAL</div></div>
            </div>
            {preAuthUser?.area && (
              <div className="md-area-chip">
                <div className="md-area-lbl">Assigned Area</div>
                <div className="md-area-val">{preAuthUser.area}</div>
              </div>
            )}
          </div>
          <nav className="md-nav">
            {NAV.map(({ key, label, Icon }) => (
              <button key={key} className={`md-nav-btn${nav===key?' on':''}`} onClick={() => { setNav(key); setSide(false); }}>
                <Icon />{label}
              </button>
            ))}
          </nav>
          <div className="md-side-foot">
            <div className="md-side-foot-top">
              <div className="md-avatar" style={{ width:30,height:30,fontSize:10 }}>{initials(preAuthUser?.name||'Manager')}</div>
              <div>
                <div className="md-uname">{preAuthUser?.name||'Manager'}</div>
                <div className="md-urole">DEPT. MANAGER</div>
              </div>
            </div>
            <div className="md-foot-btns">
              <button className="md-foot-btn" onClick={() => setDark(v=>!v)}>
                {dark ? <><I.Sun/>Light</> : <><I.Moon/>Dark</>}
              </button>
              <button className="md-foot-btn logout" onClick={handleLogout}>
                <I.Logout/>Sign Out
              </button>
            </div>
          </div>
        </aside>

        <main className="md-main">
          <div className="md-topbar">
            <div className="md-topbar-l">
              <button className="md-burger" onClick={() => setSide(v=>!v)}><I.Menu /></button>
              <div>
                <div className="md-ptitle">{navTitles[nav]}</div>
                {preAuthUser?.area && <div className="md-psub">{preAuthUser.area}</div>}
              </div>
            </div>
            <div className="md-topbar-r">
              <div className="md-tbchip"><span className="md-livdot"/>Live</div>
              <div className="md-tbchip"><I.Box/>{inventory.length} items</div>
              <div className="md-tbchip"><I.Bell/>{requests.filter(r=>r.status==='PENDING').length} pending</div>
              <button className="md-tb-btn" onClick={() => setDark(v=>!v)}>
                {dark?<><I.Sun/>Light</>:<><I.Moon/>Dark</>}
              </button>
              <button className="md-tb-btn md-tb-logout" onClick={handleLogout}>
                <I.Logout/>Sign Out
              </button>
            </div>
          </div>

          <div className="md-content">
            {nav==='dashboard'    && <Dashboard {...sharedProps}/>}
            {nav==='inventory'    && <InventoryView {...sharedProps}/>}
            {nav==='transactions' && <TransactionsView {...sharedProps}/>}
            {nav==='workers'      && <WorkersView transactions={transactions} preAuthUser={preAuthUser} t={t}/>}
            {nav==='vendors'      && <VendorsView transactions={transactions} inventory={inventory} t={t}/>}
            {nav==='requests'     && <RequestsView requests={requests} onApprove={handleApprove} onReject={handleReject} t={t}/>}
            {nav==='materials'    && <MaterialsView preAuthUser={preAuthUser} t={t}/>}
          </div>
        </main>

        {lightbox && (
          <div className="md-lb" onClick={() => setLb(null)}>
            <button className="md-lb-close" onClick={() => setLb(null)}><I.X /></button>
            <img src={lightbox} alt="verification" onClick={e => e.stopPropagation()} />
          </div>
        )}
        <div className={`md-toast${toast.show?'':' off'}`}><I.Check/>{toast.msg}</div>
      </div>
    </>
  );
}