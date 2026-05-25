// src/components/UI.jsx
import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle, MessageSquare, Navigation2, Clock } from 'lucide-react';

const C = {
  navy:'#0A1628', blue:'#1565C0', blue2:'#1976D2', blueL:'#E3F2FD',
  green:'#2E7D32', greenL:'#E8F5E9', red:'#B71C1C', redL:'#FFEBEE',
  amber:'#E65100', amberL:'#FFF3E0', purple:'#4527A0', purpleL:'#EDE7F6',
  gray:'#546E7A', grayL:'#ECEFF1', text:'#0D1117', text2:'#3D4F61', text3:'#7A8FA6',
  white:'#fff', surface:'#F7F9FC', border:'#DDE3E9',
};

export function KPI({ label, value, sub, color }) {
  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:'13px 16px', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
      <div style={{ fontSize:10.5, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'.6px', marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color:color||C.text, lineHeight:1, marginBottom:2 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.text3 }}>{sub}</div>}
    </div>
  );
}

export function ProgressBar({ value, color=C.blue, height=5 }) {
  return (
    <div style={{ height, background:C.grayL, borderRadius:99, overflow:'hidden' }}>
      <div style={{ width:`${Math.min(value,100)}%`, height:'100%', background:color, borderRadius:99, transition:'width .5s' }}/>
    </div>
  );
}

export function Modal({ onClose, children, maxWidth=520 }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:300, padding:0 }}>
      <style>{`@media(min-width:640px){.mo-box{border-radius:16px!important;max-width:${maxWidth}px!important;align-self:center!important}}`}</style>
      <div className="mo-box" onClick={e=>e.stopPropagation()} style={{ background:C.white, borderRadius:'20px 20px 0 0', width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 12px 40px rgba(0,0,0,.18)' }}>
        <div style={{ width:36, height:4, background:C.border, borderRadius:99, margin:'10px auto 0' }}/>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, sub, onClose }) {
  return (
    <div style={{ padding:'16px 20px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
      <div>
        {sub && <div style={{ fontSize:10, color:C.text3, fontFamily:'monospace', fontWeight:600, marginBottom:3 }}>{sub}</div>}
        <div style={{ fontSize:15, fontWeight:800, color:C.text }}>{title}</div>
      </div>
      <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', background:C.surface, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.text2, flexShrink:0 }}>✕</button>
    </div>
  );
}

export function StatRow({ label, value, last }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:last?'none':`1px solid ${C.border}` }}>
      <span style={{ fontSize:12.5, color:C.text2 }}>{label}</span>
      <span style={{ fontSize:12.5, fontWeight:700, color:C.text, maxWidth:220, textAlign:'right' }}>{value}</span>
    </div>
  );
}

export function Alert({ type='blue', icon, children }) {
  const colors = { blue:{bg:C.blueL,border:'#BBDEFB',text:C.blue}, green:{bg:C.greenL,border:'#C8E6C9',text:C.green}, red:{bg:C.redL,border:'#FFCDD2',text:C.red}, amber:{bg:C.amberL,border:'#FFE0B2',text:C.amber} };
  const cc = colors[type];
  return (
    <div style={{ background:cc.bg, border:`1px solid ${cc.border}`, borderRadius:10, padding:'10px 13px', display:'flex', alignItems:'flex-start', gap:9, marginBottom:14 }}>
      {icon && <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>}
      <div style={{ fontSize:13, color:cc.text, flex:1 }}>{children}</div>
    </div>
  );
}

export function Table({ headers, rows }) {
  return (
    <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
        <thead>
          <tr>{headers.map(h=>(
            <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:10.5, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'.5px', borderBottom:`1px solid ${C.border}`, background:C.surface, whiteSpace:'nowrap' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={i} style={{ cursor:row.onClick?'pointer':'default' }} onClick={row.onClick}
              onMouseEnter={e=>{if(row.onClick)e.currentTarget.style.background=C.surface;}}
              onMouseLeave={e=>{e.currentTarget.style.background='';}}>
              {row.cells.map((cell,j)=>(
                <td key={j} style={{ padding:'10px 12px', borderBottom:`1px solid ${C.border}`, color:C.text2, verticalAlign:'middle' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NotifBanner({ msg, type='green', onDone }) {
  React.useEffect(()=>{ const t=setTimeout(onDone,3200); return()=>clearTimeout(t); },[onDone]);
  const bg={green:C.green,amber:C.amber,red:C.red}[type];
  return (
    <div style={{ background:bg, color:'#fff', padding:'10px 18px', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8, animation:'slideDown .3s ease', flexShrink:0, position:'fixed', top:0, left:0, right:0, zIndex:99999 }}>
      <CheckCircle2 size={16}/> {msg}
    </div>
  );
}