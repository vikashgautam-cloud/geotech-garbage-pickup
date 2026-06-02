import { db } from '../../utils/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../App';
import { ComplaintCard, AdminComplaintModal } from '../../components/ComplaintCard';
import LiveMap from '../../components/LiveMap';
import { STATIONS } from '../../data/mockData';
import { timeAgo, calcResolutionRate, avgResolutionTime } from '../../utils/helpers';

/* ICONS */
const I = {
  Grid:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Map:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Users:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Chart:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  Bell:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Menu:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  X:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Sun:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Logout:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Plus:    () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Pin:     () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Alert:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Eye:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Image:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Building:() => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18"/><path d="M9 22V12h6v10"/><path d="M2 9h20"/></svg>,
  Broom:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3L5 21"/><path d="M9 3l10 4-4 4-6-8z"/><path d="M5 21h14"/></svg>,
  Check:   () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

/* THEMES */
const DARK_THEME = {
  isDark: true,
  bg:'#080E1A', surface:'#0D1526', surface2:'#111E30', surface3:'#162235',
  border:'rgba(255,255,255,0.07)', border2:'rgba(255,255,255,0.04)',
  accent:'#2A5CE8', green:'#10B981', amber:'#F59E0B', red:'#EF4444',
  text:'#E6EDF8', text2:'#8FA3C4', text3:'#4A5F80',
  navActive:'rgba(42,92,232,0.1)', navActiveBorder:'rgba(42,92,232,0.2)',
  topbar:'rgba(8,14,26,0.9)', cardShadow:'none'
};
const LIGHT_THEME = {
  isDark: false,
  bg:'#F2F4F7', surface:'#FFFFFF', surface2:'#F8F9FB', surface3:'#EEF1F6',
  border:'#DDE1EA', border2:'#EAEEf5',
  accent:'#1A3FBF', green:'#0E7A5A', amber:'#92400E', red:'#B91C1C',
  text:'#0C1A35', text2:'#3D4F72', text3:'#7A8BAA',
  navActive:'#EEF2FF', navActiveBorder:'#C7D2F8',
  topbar:'rgba(255,255,255,0.92)', cardShadow:'0 1px 3px rgba(0,0,0,0.06)',
};

/* GLOBAL CSS */
const makeCSS = (t) => `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;overflow-y:auto!important;-webkit-overflow-scrolling:touch;}
body{background:${t.bg};font-family:'DM Sans',sans-serif;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.ap-root{display:flex;min-height:100%;background:${t.bg};color:${t.text};font-family:'DM Sans',sans-serif;}
.ap-side{width:220px;background:${t.surface};border-right:1px solid ${t.border};display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:200;transition:transform .25s ease;overflow-y:auto;}
.ap-side.hidden{transform:translateX(-100%);}
.ap-side-head{padding:16px 14px 13px;border-bottom:1px solid ${t.border};flex-shrink:0;}
.ap-side-brand{display:flex;align-items:center;gap:10px;margin-bottom:0;}
.ap-side-brand img{width:30px;height:30px;border-radius:5px;object-fit:contain;background:#fff;padding:2px;flex-shrink:0;}
.ap-side-bname{font-size:12px;font-weight:700;color:${t.text};}
.ap-side-bsub{font-size:9px;color:${t.text3};margin-top:1px;font-family:'DM Mono',monospace;letter-spacing:.5px;}
.ap-nav{flex:1;padding:8px;overflow-y:auto;}
.ap-nav-btn{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border-radius:6px;border:1px solid transparent;background:none;cursor:pointer;font-size:12px;font-weight:500;color:${t.text2};transition:all .15s;font-family:'DM Sans',sans-serif;margin-bottom:1px;text-align:left;}
.ap-nav-btn:hover{color:${t.text};background:${t.isDark?'rgba(255,255,255,0.03)':t.surface2};}
.ap-nav-btn.on{color:${t.text};background:${t.navActive};border-color:${t.navActiveBorder};font-weight:600;}
.ap-nav-btn.on svg{color:${t.accent};}
.ap-side-foot{padding:12px;border-top:1px solid ${t.border};flex-shrink:0;}
.ap-side-foot-top{display:flex;align-items:center;gap:9px;margin-bottom:10px;}
.ap-avatar{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;background:${t.isDark?'rgba(239,68,68,0.15)':'#FEE2E2'};color:${t.isDark?'#F87171':'#B91C1C'};border:1px solid ${t.isDark?'rgba(239,68,68,0.25)':'#FECACA'};font-family:'DM Mono',monospace;}
.ap-uname{font-size:11px;font-weight:600;color:${t.text};}
.ap-urole{font-size:9px;color:${t.text3};margin-top:1px;font-family:'DM Mono',monospace;}
.ap-foot-btns{display:flex;gap:6px;}
.ap-foot-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:7px;border-radius:6px;border:1px solid ${t.border};background:${t.isDark?'rgba(255,255,255,0.03)':t.surface2};cursor:pointer;font-size:10px;font-weight:600;color:${t.text3};transition:all .15s;font-family:'DM Sans',sans-serif;}
.ap-foot-btn.logout:hover{color:${t.isDark?'#F87171':'#B91C1C'};border-color:${t.isDark?'rgba(239,68,68,0.25)':'#FECACA'};background:${t.isDark?'rgba(239,68,68,0.06)':'#FEF2F2'};}
.ap-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:199;}
.ap-overlay.show{display:block;}
.ap-main{flex:1;margin-left:220px;display:flex;flex-direction:column;min-height:100vh;}
.ap-topbar{height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 22px;background:${t.topbar};border-bottom:1px solid ${t.border};backdrop-filter:blur(12px);position:sticky;top:0;z-index:100;flex-shrink:0;}
.ap-topbar-l{display:flex;align-items:center;gap:11px;}
.ap-burger{display:none;background:none;border:none;color:${t.text};cursor:pointer;padding:4px;align-items:center;justify-content:center;}
.ap-ptitle{font-size:13px;font-weight:700;color:${t.text};}
.ap-psub{font-size:10px;color:${t.text3};margin-top:1px;font-family:'DM Mono',monospace;}
.ap-topbar-r{display:flex;align-items:center;gap:7px;}
.ap-tbchip{display:flex;align-items:center;gap:5px;background:${t.isDark?'rgba(255,255,255,0.04)':t.surface2};border:1px solid ${t.border};border-radius:4px;padding:4px 10px;font-size:10px;color:${t.text3};font-family:'DM Mono',monospace;}
.ap-livdot{width:5px;height:5px;border-radius:50%;background:${t.green};animation:pulse 2s infinite;}
.ap-tb-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:5px;border:1px solid ${t.border};background:${t.isDark?'rgba(255,255,255,0.03)':t.surface2};cursor:pointer;font-size:10px;font-weight:600;color:${t.text3};font-family:'DM Sans',sans-serif;transition:all .15s;}
.ap-tb-logout{border-color:${t.isDark?'rgba(239,68,68,0.2)':'#FECACA'};background:${t.isDark?'rgba(239,68,68,0.05)':'#FEF2F2'};color:${t.isDark?'#F87171':'#B91C1C'};}
.ap-content{flex:1;padding:22px;overflow-x:hidden;}
.ap-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:20px;}
.ap-stat{background:${t.surface};border:1px solid ${t.border};border-radius:10px;padding:16px 18px;animation:fadeUp .3s ease both;box-shadow:${t.cardShadow};}
.ap-stat-lbl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:${t.text3};margin-bottom:10px;font-family:'DM Mono',monospace;}
.ap-stat-val{font-size:26px;font-weight:800;line-height:1;margin-bottom:4px;font-family:'DM Mono',monospace;}
.ap-stat-sub{font-size:10px;color:${t.text3};font-family:'DM Mono',monospace;}
.ap-card{background:${t.surface};border:1px solid ${t.border};border-radius:10px;overflow:hidden;margin-bottom:16px;animation:fadeUp .3s ease both;box-shadow:${t.cardShadow};}
.ap-card-hd{padding:12px 16px;border-bottom:1px solid ${t.border};display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;background:${t.surface2};}
.ap-card-title{font-size:11px;font-weight:700;color:${t.text};display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:.5px;font-family:'DM Mono',monospace;}
.ap-tbl-wrap{overflow-x:auto;}
.ap-tbl{width:100%;border-collapse:collapse;font-size:12px;min-width:480px;}
.ap-tbl th{padding:8px 13px;text-align:left;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:${t.text3};background:${t.isDark?'rgba(255,255,255,0.02)':t.surface2};border-bottom:1px solid ${t.border};white-space:nowrap;font-family:'DM Mono',monospace;}
.ap-tbl td{padding:10px 13px;border-bottom:1px solid ${t.border2};color:${t.text};vertical-align:middle;font-size:12px;}
.ap-tbl tr:last-child td{border-bottom:none;}
.ap-tbl tr:hover td{background:${t.isDark?'rgba(255,255,255,0.01)':t.surface2};}
.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:3px;font-size:9px;font-weight:700;letter-spacing:.5px;white-space:nowrap;font-family:'DM Mono',monospace;text-transform:uppercase;}
${t.isDark ? `
.b-new  {background:rgba(245,158,11,0.12);color:#FCD34D;}
.b-acc  {background:rgba(59,130,246,0.12);color:#93C5FD;}
.b-prog {background:rgba(16,185,129,0.12);color:#34D399;}
.b-done {background:rgba(16,185,129,0.18);color:#6EE7B7;}
.b-quer {background:rgba(245,158,11,0.1);color:#FCD34D;}
.b-esc  {background:rgba(239,68,68,0.12);color:#F87171;}
.b-blue {background:rgba(59,130,246,0.1);color:#93C5FD;}
.b-muted{background:rgba(255,255,255,0.05);color:#64748B;}
.b-mat  {background:rgba(6,182,212,0.1);color:#67E8F9;}
.b-garb {background:rgba(16,185,129,0.1);color:#34D399;}
` : `
.b-new  {background:rgba(245,158,11,0.1);color:#92400E;}
.b-acc  {background:rgba(26,63,191,0.1);color:#1A3FBF;}
.b-prog {background:rgba(14,122,90,0.1);color:#0E7A5A;}
.b-done {background:rgba(14,122,90,0.15);color:#065F46;}
.b-quer {background:rgba(146,64,14,0.1);color:#92400E;}
.b-esc  {background:rgba(185,28,28,0.1);color:#B91C1C;}
.b-blue {background:rgba(26,63,191,0.1);color:#1A3FBF;}
.b-muted{background:#F1F5F9;color:#64748B;}
.b-mat  {background:rgba(6,182,212,0.08);color:#0E7490;}
.b-garb {background:rgba(14,122,90,0.08);color:#0E7A5A;}
`}
.ap-bar-track{width:100%;height:5px;background:${t.isDark?'rgba(255,255,255,0.06)':t.border};border-radius:99px;overflow:hidden;margin-top:4px;}
.ap-bar-fill{height:100%;border-radius:99px;transition:width .4s;}
.ap-inp{width:100%;padding:8px 10px;background:${t.isDark?t.bg:t.surface2};border:1px solid ${t.border};border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;color:${t.text};outline:none;transition:border-color .15s;}
.ap-inp::placeholder{color:${t.text3};}
.ap-inp:focus{border-color:${t.isDark?'rgba(42,92,232,0.4)':t.accent};}
.ap-sel{width:100%;padding:8px 10px;background:${t.isDark?t.bg:t.surface2};border:1px solid ${t.border};border-radius:6px;font-size:12px;font-family:'DM Sans',sans-serif;color:${t.text};outline:none;cursor:pointer;}
.ap-flbl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:${t.text3};display:block;margin-bottom:5px;font-family:'DM Mono',monospace;}
.ap-form-row{display:grid;gap:10px;padding:13px 16px;border-bottom:1px solid ${t.border};align-items:end;}
.ap-btn{padding:8px 13px;border-radius:6px;border:none;cursor:pointer;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px;transition:all .15s;white-space:nowrap;}
.ap-btn-p{background:${t.accent};color:#fff;}
.ap-btn-p:hover{opacity:.88;}
.ap-btn-r{background:${t.isDark?'rgba(239,68,68,0.1)':'rgba(185,28,28,0.07)'};color:${t.isDark?'#F87171':'#B91C1C'};border:1px solid ${t.isDark?'rgba(239,68,68,0.2)':'rgba(185,28,28,0.15)'};}
.ap-btn-sm{padding:5px 10px;font-size:10px;}
.ap-icon-btn{background:none;border:none;cursor:pointer;color:${t.text3};padding:4px;border-radius:5px;display:flex;align-items:center;transition:all .15s;}
.ap-icon-btn:hover{color:${t.red};background:${t.isDark?'rgba(239,68,68,0.08)':'#FEF2F2'};}
.ap-vgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;padding:16px;}
.ap-vcard{background:${t.surface2};border:1px solid ${t.border};border-radius:8px;padding:14px;}
.ap-igrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;}
.ap-icard{background:${t.surface};border:1px solid ${t.border};border-radius:10px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .15s;}
.ap-icard:hover{border-color:${t.isDark?'rgba(42,92,232,0.3)':'#A5B4FC'};}
.ap-icard-img{height:120px;background:${t.isDark?'#060D1A':'#EEF1F6'};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;cursor:zoom-in;}
.ap-icard-img img{width:100%;height:100%;object-fit:cover;}
.ap-icard-body{padding:12px;flex:1;display:flex;flex-direction:column;gap:8px;}
.ap-icard-footer{padding:0 12px 12px;}
.ap-icard-meta{background:${t.isDark?'rgba(255,255,255,0.03)':t.surface2};border-radius:6px;padding:8px 10px;border:1px solid ${t.border2};font-size:11px;}
.ap-icard-meta-row{display:flex;align-items:center;gap:6px;color:${t.text2};margin-bottom:4px;}
.ap-icard-meta-row:last-child{margin-bottom:0;}
.ap-icard-meta-row strong{color:${t.text};}
.ap-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${t.surface};border:1px solid ${t.border};color:${t.text};padding:9px 18px;border-radius:5px;font-size:11px;font-weight:600;z-index:9999;display:flex;align-items:center;gap:6px;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:opacity .3s;font-family:'DM Mono',monospace;}
.ap-toast.off{opacity:0;pointer-events:none;}
.ap-page-hd{margin-bottom:18px;}
.ap-page-title{font-size:17px;font-weight:800;letter-spacing:-.3px;color:${t.text};margin-bottom:3px;}
.ap-page-sub{font-size:11px;color:${t.text3};font-family:'DM Mono',monospace;}
.ap-alert{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:8px;margin-bottom:16px;font-size:12px;}
.ap-alert-red{background:${t.isDark?'rgba(239,68,68,0.1)':'#FEF2F2'};border:1px solid ${t.isDark?'rgba(239,68,68,0.2)':'#FECACA'};color:${t.isDark?'#F87171':'#B91C1C'};}
.ap-alert-amber{background:${t.isDark?'rgba(245,158,11,0.08)':'#FFFBEB'};border:1px solid ${t.isDark?'rgba(245,158,11,0.2)':'#FDE68A'};color:${t.isDark?'#FCD34D':'#92400E'};}
.ap-notif{background:#1A3FBF;color:#fff;padding:10px 22px;font-size:12px;font-weight:600;text-align:center;font-family:'DM Mono',monospace;display:flex;align-items:center;justify-content:center;gap:8px;}
.ap-lb{position:fixed;inset:0;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;cursor:zoom-out;backdrop-filter:blur(5px);}
.ap-lb img{max-width:100%;max-height:85vh;border-radius:12px;}
.ap-lb-close{position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:50%;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;}
.ap-no-photo{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:100%;height:100%;color:${t.text3};}
.ap-no-photo span{font-size:10px;font-family:'DM Mono',monospace;letter-spacing:.3px;}
@media(max-width:960px){
  .ap-main{margin-left:0;}
  .ap-side{transform:translateX(-100%);}
  .ap-side.show{transform:translateX(0);}
  .ap-burger{display:flex!important;}
  .ap-stats{grid-template-columns:1fr 1fr;}
  .ap-content{padding:14px;}
  .ap-topbar{padding:0 14px;}
  .ap-topbar-r{display:none;}}
@media(max-width:520px){
  .ap-stats{grid-template-columns:1fr 1fr;gap:8px;}
  .ap-igrid{grid-template-columns:1fr;}}
`;

/* HELPERS */
const safeStr = (val, fallback = '—') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val || fallback;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return val.name || val.id || val.label || fallback;
  return String(val) || fallback;
};

const safeId = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.id || val.name || '';
  return String(val);
};

const initials = (n = '') => safeStr(n, 'AD').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD';

const statusBadgeClass = (s) => ({
  NEW:'b-new', ACCEPTED:'b-acc', IN_PROGRESS:'b-prog',
  COMPLETED:'b-done', QUERIED:'b-quer', ESCALATED:'b-esc'
}[safeStr(s)] || 'b-muted');

const progressPct = (status) => ({
  NEW: 20, ACCEPTED: 45, IN_PROGRESS: 70, COMPLETED: 100, QUERIED: 50, ESCALATED: 15
}[safeStr(status)] || 0);

function ProgressBar({ value, color }) {
  const pct = Math.min(Math.max(parseInt(value) || 0, 0), 100);
  return (
    <div className="ap-bar-track">
      <div className="ap-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/* LIGHTBOX */
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);
  if (!src) return null;
  return (
    <div className="ap-lb" onClick={onClose}>
      <button className="ap-lb-close" onClick={onClose}><I.X /></button>
      <img src={src} alt="Evidence" onClick={e => e.stopPropagation()} />
    </div>
  );
}

/* TOAST */
function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  return (
    <div className={`ap-toast${msg ? '' : ' off'}`}>
      <I.Check />
      {typeof msg === 'object' ? JSON.stringify(msg) : String(msg || '')}
    </div>
  );
}

/* DASHBOARD */
function Dashboard({ complaints, t, onSelect, onTabChange, onViewImage }) {
  const total = complaints.length;
  const esc   = complaints.filter(c => safeStr(c.status) === 'ESCALATED');
  const done  = complaints.filter(c => safeStr(c.status) === 'COMPLETED');

  const stats = [
    { lbl: 'Total Influx',   val: total,                                                                           sub: 'All tickets',     color: t.accent },
    { lbl: 'New Tickets',    val: complaints.filter(c => safeStr(c.status) === 'NEW').length,                      sub: 'Awaiting action', color: t.amber  },
    { lbl: 'Resolved Cases', val: complaints.filter(c => safeStr(c.status) === 'COMPLETED').length,                sub: 'Closed pipeline', color: t.green  },
    { lbl: 'Escalations',    val: complaints.filter(c => safeStr(c.status) === 'ESCALATED').length,                sub: 'Past SLA',        color: t.red    },
  ];

  return (
    <>
      <div className="ap-page-hd">
        <div className="ap-page-title">Dashboard Hub</div>
        <div className="ap-page-sub">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {esc.length > 0 && (
        <div className="ap-alert ap-alert-red">
          <I.Alert />
          <span>
            <strong>{esc.length} escalated operation{esc.length > 1 ? 's' : ''}</strong> — not accepted within standard SLA.
          </span>
          <span
            style={{ marginLeft: 'auto', cursor: 'pointer', textDecoration: 'underline', fontSize: 11, fontFamily: "'DM Mono', monospace" }}
            onClick={() => onTabChange('map')}
          >
            View on map →
          </span>
        </div>
      )}

      <div className="ap-stats">
        {stats.map((s, i) => (
          <div className="ap-stat" key={s.lbl} style={{ animationDelay: `${i * 50}ms` }}>
            <div className="ap-stat-lbl">{s.lbl}</div>
            <div className="ap-stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="ap-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, marginBottom: 16 }}>
        {/* Status Overview */}
        <div className="ap-card">
          <div className="ap-card-hd">
            <span className="ap-card-title"><I.Chart /> Status Overview</span>
          </div>
          <div style={{ padding: '14px 16px' }}>
            {['NEW','ACCEPTED','IN_PROGRESS','COMPLETED','QUERIED','ESCALATED'].map(s => {
              const cnt = complaints.filter(c => safeStr(c.status) === s).length;
              const pct = Math.round(cnt / (total || 1) * 100);
              const colorMap = { NEW: t.amber, ACCEPTED: t.accent, IN_PROGRESS: t.green, COMPLETED: t.green, QUERIED: t.amber, ESCALATED: t.red };
              return (
                <div key={s} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span className={`badge ${statusBadgeClass(s)}`}>{s.replace('_', ' ')}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{cnt}</span>
                  </div>
                  <ProgressBar value={pct} color={colorMap[s]} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Station Load */}
        <div className="ap-card">
          <div className="ap-card-hd">
            <span className="ap-card-title"><I.Pin /> Station Load</span>
            <span className="badge b-blue">Live</span>
          </div>
          <div className="ap-tbl-wrap">
            <table className="ap-tbl">
              <thead>
                <tr><th>Station</th><th>Tickets</th><th>Load</th></tr>
              </thead>
              <tbody>
                {STATIONS.map(st => {
                  const sid   = typeof st === 'object' ? st.id   : st;
                  const sname = typeof st === 'object' ? st.name : st;
                  const cnt   = complaints.filter(c => safeId(c.station) === sid).length;
                  return (
                    <tr key={sid}>
                      <td>{String(sname)}</td>
                      <td style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{cnt}</td>
                      <td style={{ width: 80 }}><ProgressBar value={Math.round(cnt / (total || 1) * 100)} color={t.accent} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Incident Cards */}
      <div className="ap-card">
        <div className="ap-card-hd">
          <span className="ap-card-title"><I.Bell /> Live Incidents</span>
          <span className="badge b-muted">{total} total</span>
        </div>
        <div style={{ padding: 14 }}>
          <div className="ap-igrid">
            {complaints.map(c => {
              const area   = safeStr(c.area,    'General Terminal');
              const gtype  = safeStr(c.gtype,   'General');
              const vendor = safeStr(c.vendorId,'Unassigned');
              const status = safeStr(c.status,  'NEW');
              const pct    = progressPct(status);
              const barColor = status === 'COMPLETED' ? t.green : status === 'ESCALATED' ? t.red : t.accent;

              return (
                <div key={c.id} className="ap-icard">
                  {/* Image */}
                  <div
                    className="ap-icard-img"
                    onClick={() => c.cleanerPhoto && onViewImage(c.cleanerPhoto)}
                    style={{ cursor: c.cleanerPhoto ? 'zoom-in' : 'default' }}
                  >
                    {c.cleanerPhoto ? (
                      <>
                        <img src={c.cleanerPhoto} alt="Evidence" />
                        <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 3, fontFamily: "'DM Mono', monospace", display: 'flex', alignItems: 'center', gap: 4 }}>
                          <I.Eye /> Expand
                        </div>
                      </>
                    ) : (
                      <div className="ap-no-photo">
                        <I.Image />
                        <span>No Photo</span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 6, right: 6 }}>
                      <span className={`badge ${statusBadgeClass(status)}`}>{status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="ap-icard-body">
                    <div style={{ fontWeight: 700, fontSize: 13, color: t.text }}>{area}</div>
                    <div style={{ fontSize: 11, color: t.text3, fontFamily: "'DM Mono', monospace" }}>
                      {gtype} &middot; {timeAgo(c.reportedAt)}
                    </div>
                    <div className="ap-icard-meta">
                      <div className="ap-icard-meta-row">
                        <I.Building />
                        <span>Vendor: <strong>{vendor}</strong></span>
                      </div>
                      <div className="ap-icard-meta-row">
                        <I.Broom />
                        <span>Cleaner: <strong>{safeStr(c.cleanerName || c.assignedCleaner, 'Awaiting Accept')}</strong></span>
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: t.text3, fontFamily: "'DM Mono', monospace" }}>
                        <span>Pipeline</span>
                        <span>{pct}%</span>
                      </div>
                      <ProgressBar value={pct} color={barColor} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="ap-icard-footer">
                    <button
                      className="ap-btn ap-btn-p"
                      style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}
                      onClick={() => onSelect(c)}
                    >
                      <I.Eye /> Inspect Details
                    </button>
                  </div>
                </div>
              );
            })}

            {complaints.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: t.text3, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                No incidents recorded
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* LIVE MAP TAB */
function LiveMapTab({ complaints, t, onSelect }) {
  const active = complaints.filter(c => c.lat && c.lng);
  return (
    <>
      <div className="ap-page-hd">
        <div className="ap-page-title">Live Node GIS Map</div>
        <div className="ap-page-sub">Real-time GPS — {active.length} pinned incidents</div>
      </div>
      <div className="ap-card" style={{ overflow: 'hidden', marginBottom: 16 }}>
        <LiveMap complaints={active} height="340px" onPinClick={onSelect} />
      </div>
      <div className="ap-card">
        <div className="ap-card-hd">
          <span className="ap-card-title"><I.Pin /> Active Incidents</span>
          <span className="badge b-blue">{active.length} located</span>
        </div>
        <div className="ap-tbl-wrap">
          <table className="ap-tbl">
            <thead>
              <tr><th>Area</th><th>Category</th><th>Station</th><th>Reported</th><th>Status</th></tr>
            </thead>
            <tbody>
              {active.map(c => {
                const sname   = safeStr(c.station, '—');
                const cStatus = safeStr(c.status,  'NEW');
                return (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(c)}>
                    <td><strong>{safeStr(c.area, 'General')}</strong></td>
                    <td style={{ color: t.text2 }}>{safeStr(c.gtype, 'General')}</td>
                    <td><span className="badge b-muted">{sname}</span></td>
                    <td style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", opacity: .55 }}>{timeAgo(c.reportedAt)}</td>
                    <td><span className={`badge ${statusBadgeClass(cStatus)}`}>{cStatus.replace('_', ' ')}</span></td>
                  </tr>
                );
              })}
              {active.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', opacity: .35, padding: 28, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>
                    No geo-tagged incidents
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* VENDORS TAB */
const AREAS = [
  'Platform 1 (Main Entry)', 'Platform 2', 'Platform 3', 'Platform 4',
  'Platform 5', 'Platform 6 (Santaraj Entry)', 'Main Waiting Hall',
  'Foot Over Bridge (FOB) - Central', 'Foot Over Bridge (FOB) - Itwari Side',
  'Circulating Area (Main Gate)', 'Santaracha Side Parking',
  'Reservation Ticket Counter', 'Running Room & Yard Area', 'Food Plaza (Platform 1)',
];

function VendorsTab({ complaints, vendors, t, onAddVendor, onDeleteVendor }) {
  const [vId,      setVId]      = useState('');
  const [vPass,    setVPass]    = useState('');
  const [vName,    setVName]    = useState('');
  const [vStation, setVStation] = useState(STATIONS[0]?.name || '');
  const [vType,    setVType]    = useState('GARBAGE');
  const [vArea,    setVArea]    = useState(AREAS[0]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!vId.trim() || !vPass || !vName.trim()) return alert('Fill all fields.');
    onAddVendor({ id: vId.trim(), password: vPass, name: vName.trim(), stationName: vStation, vendorType: vType, areaName: vArea });
    setVId(''); setVPass(''); setVName('');
  };

  return (
    <>
      <div className="ap-page-hd">
        <div className="ap-page-title">Operational Vendors</div>
        <div className="ap-page-sub">Provision and deregister platform management contractors</div>
      </div>

      {/* Add Vendor Form */}
      <div className="ap-card">
        <div className="ap-card-hd">
          <span className="ap-card-title"><I.Plus /> Register New Vendor</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, padding: '13px 16px', borderBottom: `1px solid ${t.border}`, alignItems: 'end' }}>
            <div>
              <label className="ap-flbl">Vendor ID</label>
              <input className="ap-inp" placeholder="vendor_ngp_01" value={vId} onChange={e => setVId(e.target.value)} required />
            </div>
            <div>
              <label className="ap-flbl">Password</label>
              <input className="ap-inp" type="password" placeholder="••••••••" value={vPass} onChange={e => setVPass(e.target.value)} required />
            </div>
            <div>
              <label className="ap-flbl">Contractor Name</label>
              <input className="ap-inp" placeholder="Khalsa Cleaning Services" value={vName} onChange={e => setVName(e.target.value)} required />
            </div>
            <div>
              <label className="ap-flbl">Station Terminal</label>
              <select className="ap-sel" value={vStation} onChange={e => setVStation(e.target.value)}>
                {STATIONS.map(st => <option key={st.id} value={st.name}>{String(st.name)}</option>)}
              </select>
            </div>
            <div>
              <label className="ap-flbl">Target Area</label>
              <select className="ap-sel" value={vArea} onChange={e => setVArea(e.target.value)}>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="ap-flbl">Sector Type</label>
              <select className="ap-sel" value={vType} onChange={e => setVType(e.target.value)}>
                <option value="GARBAGE">Garbage Cleaning</option>
                <option value="MATERIAL">Material Storage</option>
              </select>
            </div>
            <button type="submit" className="ap-btn ap-btn-p" style={{ alignSelf: 'end' }}>
              <I.Plus /> Provision
            </button>
          </div>
        </form>
      </div>

      {/* Vendor Grid */}
      <div className="ap-card">
        <div className="ap-card-hd">
          <span className="ap-card-title"><I.Users /> Registered Contractors</span>
          <span className="badge b-muted">{vendors.length} vendors</span>
        </div>
        <div className="ap-vgrid">
          {vendors.map(v => {
            const tickets = complaints.filter(c => safeId(c.vendorId) === v.id);
            const done    = tickets.filter(c => safeStr(c.status) === 'COMPLETED').length;
            const pct     = Math.round(done / (tickets.length || 1) * 100);
            const isMat   = v.vendorType === 'MATERIAL';
            return (
              <div key={v.id} className="ap-vcard" style={{ border: `1px solid ${isMat ? t.accent : t.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: isMat ? t.accent : t.isDark ? 'rgba(42,92,232,0.15)' : '#E0E7FF', color: isMat ? '#fff' : t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>
                    {initials(v.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{safeStr(v.name)}</div>
                    <div style={{ fontSize: 10, color: t.text3, fontFamily: "'DM Mono', monospace" }}>{safeStr(v.loginId || v.id)}</div>
                  </div>
                  <button className="ap-icon-btn" onClick={() => onDeleteVendor(v.id)}><I.Trash /></button>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span className="badge b-muted">{safeStr(v.stationName)}</span>
                  <span className={`badge ${isMat ? 'b-mat' : 'b-garb'}`}>{isMat ? 'MATERIAL' : 'GARBAGE'}</span>
                  {v.areaName && <span className="badge b-blue">{safeStr(v.areaName)}</span>}
                </div>
                {!isMat ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      {[{ lbl: 'Assigned', val: tickets.length }, { lbl: 'Completed', val: done }].map(s => (
                        <div key={s.lbl} style={{ background: t.isDark ? 'rgba(255,255,255,0.03)' : t.bg, border: `1px solid ${t.border2}`, borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: t.text3, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 3 }}>{s.lbl}</div>
                          <div style={{ fontWeight: 800, fontSize: 18, fontFamily: "'DM Mono', monospace" }}>{s.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: t.text3, marginBottom: 3, fontFamily: "'DM Mono', monospace", display: 'flex', justifyContent: 'space-between' }}>
                      <span>SLA Efficiency</span><span>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} color={t.green} />
                  </>
                ) : (
                  <div style={{ background: t.isDark ? 'rgba(255,255,255,0.03)' : t.bg, borderRadius: 6, padding: '10px 12px', border: `1px dashed ${t.border}` }}>
                    <div style={{ fontSize: 10, color: t.text3, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>INVENTORY UNITS ON HOLD</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: t.text, fontFamily: "'DM Mono', monospace" }}>{v.totalStockCurrent || 0}</div>
                  </div>
                )}
              </div>
            );
          })}
          {vendors.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: t.text3, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
              No vendors provisioned
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* REPORTS TAB */
function ReportsTab({ complaints, t }) {
  const done = complaints.filter(c => safeStr(c.status) === 'COMPLETED');
  const rate = calcResolutionRate(complaints);
  const avg  = avgResolutionTime(complaints);

  const byCategory = complaints.reduce((acc, c) => {
    const k = safeStr(c.gtype, 'General');
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="ap-page-hd">
        <div className="ap-page-title">Analytics Matrix</div>
        <div className="ap-page-sub">Cloud snapshot computation — Railway Board Nagpur</div>
      </div>

      <div className="ap-stats">
        {[
          { lbl: 'Total Influx',  val: complaints.length, sub: 'All time',        color: t.accent },
          { lbl: 'Resolved',      val: done.length,       sub: 'Closed pipeline', color: t.green  },
          { lbl: 'Close Rate',    val: rate + '%',        sub: 'SLA performance', color: t.accent },
          { lbl: 'Mean Avg Time', val: avg + ' min',      sub: 'To resolution',   color: t.amber  },
        ].map((s, i) => (
          <div className="ap-stat" key={s.lbl} style={{ animationDelay: `${i * 50}ms` }}>
            <div className="ap-stat-lbl">{s.lbl}</div>
            <div className="ap-stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="ap-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
        <div className="ap-card">
          <div className="ap-card-hd"><span className="ap-card-title"><I.Chart /> By Category</span></div>
          <div style={{ padding: '14px 16px' }}>
            {Object.entries(byCategory).map(([cat, cnt]) => {
              const pct = Math.round(cnt / (complaints.length || 1) * 100);
              return (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: t.text2 }}>{cat}</span>
                    <span style={{ fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{cnt}</span>
                  </div>
                  <ProgressBar value={pct} color={t.accent} />
                </div>
              );
            })}
            {Object.keys(byCategory).length === 0 && (
              <div style={{ color: t.text3, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>No data</div>
            )}
          </div>
        </div>

        <div className="ap-card">
          <div className="ap-card-hd"><span className="ap-card-title"><I.Chart /> Status Breakdown</span></div>
          <div className="ap-tbl-wrap">
            <table className="ap-tbl">
              <thead><tr><th>Status</th><th>Count</th><th>Share</th></tr></thead>
              <tbody>
                {['NEW','ACCEPTED','IN_PROGRESS','COMPLETED','QUERIED','ESCALATED'].map(s => {
                  const cnt = complaints.filter(c => safeStr(c.status) === s).length;
                  const pct = Math.round(cnt / (complaints.length || 1) * 100);
                  return (
                    <tr key={s}>
                      <td><span className={`badge ${statusBadgeClass(s)}`}>{s.replace('_', ' ')}</span></td>
                      <td style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{cnt}</td>
                      <td style={{ width: 80 }}><ProgressBar value={pct} color={t.accent} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/* LOGIN SCREEN */
function LoginScreen({ onLogin }) {
  const [id,   setId]   = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!id.trim() || !pass) return alert('Fill all fields.');
    setBusy(true);
    try {
      const res = await getDoc(doc(db, 'admins', id.trim()));
      if (res.exists() && res.data().password === pass) {
        onLogin();
      } else {
        alert('Invalid credentials.');
      }
    } catch {
      alert('Auth error — check connection.');
    }
    setBusy(false);
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
      background: '#080E1A',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(42,92,232,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(239,68,68,0.06) 0%, transparent 50%)',
    }}>
      <div style={{ width: 360, background: '#0D1526', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '28px 28px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/logo.jpeg" alt="Indian Railways" style={{ width: 44, height: 44, borderRadius: 8, background: '#fff', padding: 3, objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#E6EDF8', fontFamily: "'DM Sans', sans-serif" }}>ADMIN LOGIN</div>
            <div style={{ fontSize: 10, color: '#4A5F80', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>ADMIN CENTRAL NODE · NAGPUR JN.</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '22px 28px 28px' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px', color: '#4A5F80', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
              Admin Control ID
            </label>
            <input
              value={id} onChange={e => setId(e.target.value)} placeholder="e.g. admin_ngp"
              style={{ width: '100%', padding: '10px 12px', background: '#080E1A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#E6EDF8', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px', color: '#4A5F80', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"
              style={{ width: '100%', padding: '10px 12px', background: '#080E1A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#E6EDF8', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
            />
          </div>
          <button
            type="submit" disabled={busy}
            style={{ width: '100%', padding: 11, background: busy ? '#1A3FBF' : '#2A5CE8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: busy ? .75 : 1 }}
          >
            {busy ? 'Verifying…' : 'Verify & Open HQ'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* MAIN ADMIN PORTAL */
export default function AdminPortal() {
  const { complaints, updateComplaint } = useApp();

  const [loggedIn, setLoggedIn] = useState(false);
  const [tab,      setTab]      = useState('dashboard');
  const [selected, setSelected] = useState(null);
  const [notif,    setNotif]    = useState(null);
  const [vendors,  setVendors]  = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [dark,     setDark]     = useState(true);
  const [sideOpen, setSideOpen] = useState(false);
  const [toast,    setToast]    = useState({ show: false, msg: '' });

  const t = dark ? DARK_THEME : LIGHT_THEME;

  const showToast = msg => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3500);
  };

  useEffect(() => {
    if (!loggedIn) return;
    const unsub = onSnapshot(collection(db, 'vendors'), snap => {
      setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [loggedIn]);

  const handleProvisionVendor = async payload => {
    try {
      await setDoc(doc(db, 'vendors', payload.id), {
        loginId: payload.id,
        password: payload.password,
        name: payload.name,
        stationName: payload.stationName,
        areaName: payload.areaName || AREAS[0],
        vendorType: payload.vendorType || 'GARBAGE',
        totalStockCurrent: payload.vendorType === 'MATERIAL' ? 0 : null,
        createdAt: serverTimestamp(),
      });
      showToast(`Vendor ${payload.id} [${payload.vendorType}] provisioned to ${payload.areaName}`);
    } catch {
      alert('Failed to save vendor.');
    }
  };

  const handleRevokeVendor = async id => {
    if (!window.confirm('Permanently remove this vendor?')) return;
    try {
      await deleteDoc(doc(db, 'vendors', id));
      showToast(`Vendor ${id} removed.`);
    } catch (err) {
      console.error(err);
    }
  };

  const onStatusChange = (id, status) => {
    updateComplaint(id, { status });
    if (selected?.id === id) setSelected(s => ({ ...s, status }));
    showToast(`Ticket ${id} updated to ${status}`);
  };

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  const NAV = [
    { key: 'dashboard', label: 'Dashboard',  Icon: I.Grid  },
    { key: 'map',       label: 'Live Map',   Icon: I.Map   },
    { key: 'vendors',   label: 'Vendors',    Icon: I.Users },
    { key: 'reports',   label: 'Reports',    Icon: I.Chart },
  ];

  const navTitles = {
    dashboard: 'Dashboard Hub',
    map:       'Live GIS Map',
    vendors:   'Vendor Network',
    reports:   'Analytics Matrix',
  };

  const sharedProps = { t, complaints, onSelect: setSelected, onTabChange: setTab, onViewImage: setLightbox };

  return (
    <>
      <style>{makeCSS(t)}</style>
      <div className="ap-root">
        <div className={`ap-overlay${sideOpen ? ' show' : ''}`} onClick={() => setSideOpen(false)} />

        {/* SIDEBAR */}
        <aside className={`ap-side${sideOpen ? ' show' : ''}`}>
          <div className="ap-side-head">
            <div className="ap-side-brand">
              <img src="/logo.jpeg" alt="Indian Railways" />
              <div>
                <div className="ap-side-bname">Admin Control</div>
                <div className="ap-side-bsub">RAILWAY BOARD · NGP</div>
              </div>
            </div>
          </div>
          <nav className="ap-nav">
            {NAV.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`ap-nav-btn${tab === key ? ' on' : ''}`}
                onClick={() => { setTab(key); setSideOpen(false); }}
              >
                <Icon />
                {label}
              </button>
            ))}
          </nav>
          <div className="ap-side-foot">
            <div className="ap-side-foot-top">
              <div className="ap-avatar" style={{ width: 30, height: 30, fontSize: 10 }}>AD</div>
              <div>
                <div className="ap-uname">Admin Officer</div>
                <div className="ap-urole">RAILWAY BOARD</div>
              </div>
            </div>
            <div className="ap-foot-btns">
              <button className="ap-foot-btn" onClick={() => setDark(v => !v)}>
                {dark ? <><I.Sun /> Light</> : <><I.Moon /> Dark</>}
              </button>
              <button className="ap-foot-btn logout" onClick={() => setLoggedIn(false)}>
                <I.Logout /> Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="ap-main">
          {notif && (
            <div className="ap-notif">
              <I.Bell />
              {typeof notif === 'object' ? JSON.stringify(notif) : String(notif)}
              <button onClick={() => setNotif(null)} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: .7 }}>
                <I.X />
              </button>
            </div>
          )}

          {/* Topbar */}
          <div className="ap-topbar">
            <div className="ap-topbar-l">
              <button className="ap-burger" onClick={() => setSideOpen(v => !v)}><I.Menu /></button>
              <div>
                <div className="ap-ptitle">{navTitles[tab]}</div>
                <div className="ap-psub">Railway Board · Nagpur Junction</div>
              </div>
            </div>
            <div className="ap-topbar-r">
              <div className="ap-tbchip"><span className="ap-livdot" /> Live</div>
              <div className="ap-tbchip"><I.Bell /> {complaints.filter(c => safeStr(c.status) === 'NEW').length} new</div>
              <div className="ap-tbchip"><I.Alert /> {complaints.filter(c => safeStr(c.status) === 'ESCALATED').length} esc.</div>
              <button className="ap-tb-btn" onClick={() => setDark(v => !v)}>
                {dark ? <><I.Sun /> Light</> : <><I.Moon /> Dark</>}
              </button>
              <button className="ap-tb-btn ap-tb-logout" onClick={() => setLoggedIn(false)}>
                <I.Logout /> Sign Out
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="ap-content">
            {tab === 'dashboard' && <Dashboard {...sharedProps} />}
            {tab === 'map'       && <LiveMapTab {...sharedProps} />}
            {tab === 'vendors'   && <VendorsTab {...sharedProps} vendors={vendors} onAddVendor={handleProvisionVendor} onDeleteVendor={handleRevokeVendor} />}
            {tab === 'reports'   && <ReportsTab {...sharedProps} />}
          </div>
        </main>

        {selected && <AdminComplaintModal complaint={selected} onClose={() => setSelected(null)} onStatusChange={onStatusChange} />}
        <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
        <Toast msg={toast.msg} onDone={() => setToast({ show: false, msg: '' })} />
      </div>
    </>
  );
}