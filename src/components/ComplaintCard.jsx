import React, { useState } from 'react';
import {
  MapPin, Clock, User, AlertTriangle, RotateCcw, CheckCircle2,
  XCircle, MessageSquare, Navigation2, Image, Trash2, Recycle,
  Package, FlaskConical, Droplets
} from 'lucide-react';
import { Modal, ModalHeader, StatRow } from './UI';
import { VENDORS, STATUS_META } from '../data/mockData';
import { timeAgo } from '../utils/helpers';

const C = {
  navy:'#0A1628',blue:'#1565C0',blueL:'#E3F2FD',green:'#2E7D32',greenL:'#E8F5E9',
  red:'#B71C1C',redL:'#FFEBEE',amber:'#E65100',amberL:'#FFF3E0',purple:'#4527A0',purpleL:'#EDE7F6',
  gray:'#546E7A',grayL:'#ECEFF1',text:'#0D1117',text2:'#3D4F61',text3:'#7A8FA6',
  white:'#fff',surface:'#F7F9FC',border:'#DDE3E9',
};

const STATUS_MAP = {
  NEW:{ bg:C.amberL, color:C.amber, label:'New', Icon:AlertTriangle },
  ACCEPTED:{ bg:C.blueL, color:C.blue, label:'Accepted', Icon:CheckCircle2 },
  IN_PROGRESS:{ bg:C.purpleL, color:C.purple, label:'In Progress', Icon:Navigation2 },
  COMPLETED:{ bg:C.greenL, color:C.green, label:'Completed', Icon:CheckCircle2 },
  QUERIED:{ bg:'#FFF8E1', color:'#F57F17', label:'Queried', Icon:MessageSquare },
  ESCALATED:{ bg:C.redL, color:C.red, label:'Escalated ⚠️', Icon:AlertTriangle },
  REJECTED:{ bg:C.grayL, color:C.gray, label:'Rejected', Icon:XCircle },
};

const GTYPE_ICONS = {
  'Plastic Waste':Trash2,'Food Waste':Package,'Abandoned Item':Package,
  'Chemical Spill':FlaskConical,'Recyclable':Recycle,'Sewage / Water':Droplets,
};

export function Badge({ status }) {
  const m = STATUS_MAP[status] || STATUS_MAP.NEW;
  const Icon = m.Icon;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:99, fontSize:11, fontWeight:700, whiteSpace:'nowrap', background:m.bg, color:m.color }}>
      <Icon size={11}/> {m.label}
    </span>
  );
}

/* ── COMPLAINT CARD ── */
export function ComplaintCard({ complaint:c, actions, onClick }) {
  const TypeIcon = GTYPE_ICONS[c.gtype] || Trash2;
  const sm = STATUS_MAP[c.status] || STATUS_MAP.NEW;
  return (
    <div onClick={onClick} style={{
      background:C.white, border:`1px solid ${C.border}`, borderRadius:16,
      overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)',
      cursor:onClick?'pointer':'default', transition:'box-shadow .2s',
    }}
      onMouseEnter={e=>{if(onClick)e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.1)';}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.06)';}}
    >
      {/* photo or placeholder */}
      <div style={{ height:130, background:'#111', position:'relative', overflow:'hidden' }}>
        {c.photoURL
          ? <img src={c.photoURL} alt="complaint" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : (
            <div style={{ width:'100%', height:'100%', background:`linear-gradient(135deg,#1a2744,#1565C0)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
              <TypeIcon size={32} color="rgba(255,255,255,.3)"/>
              <span style={{ color:'rgba(255,255,255,.3)', fontSize:11, fontWeight:600 }}>No photo</span>
            </div>
          )
        }
        {/* status pill overlay */}
        <div style={{ position:'absolute', top:8, right:8 }}>
          <Badge status={c.status}/>
        </div>
        {c.severity==='critical' && (
          <div style={{ position:'absolute', top:8, left:8, background:C.red, color:'#fff', fontSize:9.5, fontWeight:700, padding:'2px 7px', borderRadius:99, display:'flex', alignItems:'center', gap:3 }}>
            <AlertTriangle size={9}/> CRITICAL
          </div>
        )}
      </div>

      <div style={{ padding:'12px 14px' }}>
        <div style={{ fontSize:10, fontFamily:'monospace', color:C.text3, marginBottom:2 }}>{c.id}</div>
        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:5, lineHeight:1.3, display:'flex', alignItems:'center', gap:6 }}>
          <TypeIcon size={14} color={C.blue}/> {c.area} — {c.gtype}
        </div>
        <div style={{ fontSize:11.5, color:C.text3, marginBottom:8, display:'flex', gap:10, flexWrap:'wrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:3 }}><MapPin size={11}/>{c.station?.name?.split(' ')[0]}</span>
          <span style={{ display:'flex', alignItems:'center', gap:3 }}><Clock size={11}/>{timeAgo(c.reportedAt)}</span>
          <span style={{ display:'flex', alignItems:'center', gap:3 }}><User size={11}/>{c.reportedBy}</span>
        </div>
        {actions && <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>{actions}</div>}
      </div>
    </div>
  );
}

/* ── VENDOR MODAL ── */
export function VendorComplaintModal({ complaint:c, onClose, onAction }) {
  const TypeIcon = GTYPE_ICONS[c.gtype] || Trash2;
  const tl = [
    { label:'Report Submitted',      done:true,                                                       icon:CheckCircle2, time:c.reportedAt },
    { label:'Assigned to Vendor',    done:true,                                                       icon:User },
    { label:'Vendor Accepted',       done:['ACCEPTED','IN_PROGRESS','COMPLETED'].includes(c.status),  icon:CheckCircle2 },
    { label:'Cleaning In Progress',  done:['IN_PROGRESS','COMPLETED'].includes(c.status),             icon:Navigation2 },
    { label:'Completed',             done:c.status==='COMPLETED',                                     icon:CheckCircle2, time:c.resolvedAt },
  ];
  return (
    <Modal onClose={onClose}>
      <ModalHeader title={c.gtype} sub={c.id} onClose={onClose}/>
      <div style={{ padding:'0 20px 22px' }}>
        {/* photo */}
        <div style={{ borderRadius:12, overflow:'hidden', marginBottom:12, background:'#111', height:200 }}>
          {c.photoURL
            ? <img src={c.photoURL} alt="complaint" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#1a2744,#1565C0)' }}>
                <TypeIcon size={40} color="rgba(255,255,255,.25)"/>
                <span style={{ color:'rgba(255,255,255,.3)', fontSize:12 }}>No photo captured</span>
              </div>
          }
        </div>
        <div style={{ marginBottom:12 }}><Badge status={c.status}/></div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:'4px 14px', marginBottom:12 }}>
          <StatRow label="Station"    value={c.station?.name}/>
          <StatRow label="Area"       value={c.area}/>
          <StatRow label="GPS"        value={`${c.lat}°N, ${c.lng}°E`}/>
          <StatRow label="Reported"   value={timeAgo(c.reportedAt)}/>
          <StatRow label="By"         value={c.reportedBy} last/>
        </div>
        {c.desc && <div style={{ background:C.surface, borderRadius:8, padding:'9px 12px', fontSize:12.5, color:C.text2, fontStyle:'italic', marginBottom:12 }}>"{c.desc}"</div>}
        {/* timeline */}
        <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Progress</div>
        <div style={{ marginBottom:16 }}>
          {tl.map((s,i)=>{
            const Icon = s.icon;
            return (
              <div key={i} style={{ display:'flex', gap:10, paddingBottom:i<tl.length-1?14:0, position:'relative' }}>
                {i<tl.length-1 && <div style={{ position:'absolute', left:13, top:28, bottom:0, width:2, background:C.border }}/>}
                <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', background:s.done?C.greenL:C.grayL, border:`2px solid ${s.done?C.green:C.border}` }}>
                  <Icon size={12} color={s.done?C.green:C.gray}/>
                </div>
                <div style={{ paddingTop:4 }}>
                  <div style={{ fontSize:12.5, fontWeight:600, color:s.done?C.text:C.text3 }}>{s.label}</div>
                  {s.time && <div style={{ fontSize:11, color:C.text3 }}>{timeAgo(s.time)}</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {c.status==='NEW'         && <ActionBtn onClick={()=>onAction(c.id,'ACCEPTED')}     color={C.blue}   Icon={CheckCircle2}>Accept Task</ActionBtn>}
          {c.status==='ACCEPTED'    && <ActionBtn onClick={()=>onAction(c.id,'IN_PROGRESS')}  color={C.purple} Icon={Navigation2} outline>Start Work</ActionBtn>}
          {c.status==='IN_PROGRESS' && <ActionBtn onClick={()=>onAction(c.id,'COMPLETED')}    color={C.green}  Icon={CheckCircle2}>Mark Complete</ActionBtn>}
          {['NEW','ACCEPTED'].includes(c.status) && <ActionBtn onClick={()=>onAction(c.id,'QUERIED')} color={C.amber} Icon={MessageSquare} outline>Raise Query</ActionBtn>}
        </div>
      </div>
    </Modal>
  );
}

/* ── ADMIN MODAL ── */
export function AdminComplaintModal({ complaint:c, onClose, onStatusChange, onReassign }) {
  const [reassigning, setReassigning] = useState(false);
  const TypeIcon = GTYPE_ICONS[c.gtype] || Trash2;
  return (
    <Modal onClose={onClose}>
      <ModalHeader title={`${c.gtype} — ${c.station?.name}`} sub={c.id} onClose={onClose}/>
      <div style={{ padding:'0 20px 22px' }}>
        {/* photo */}
        <div style={{ borderRadius:12, overflow:'hidden', marginBottom:12, background:'#111', height:190 }}>
          {c.photoURL
            ? <img src={c.photoURL} alt="complaint" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#1a2744,#1565C0)' }}>
                <TypeIcon size={38} color="rgba(255,255,255,.25)"/>
                <span style={{ color:'rgba(255,255,255,.3)', fontSize:12 }}>No photo captured</span>
              </div>
          }
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
          <Badge status={c.status}/>
          {c.severity==='critical' && <span style={{ background:C.redL, color:C.red, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, display:'flex', alignItems:'center', gap:4 }}><AlertTriangle size={11}/>Critical Priority</span>}
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:'4px 14px', marginBottom:12 }}>
          <StatRow label="Station"    value={c.station?.name}/>
          <StatRow label="Area"       value={c.area}/>
          <StatRow label="GPS"        value={`${c.lat}°N, ${c.lng}°E`}/>
          <StatRow label="Reported by" value={c.reportedBy}/>
          <StatRow label="Reported"   value={timeAgo(c.reportedAt)}/>
          <StatRow label="Vendor"     value={c.vendor?.name} last/>
        </div>
        {c.desc && <div style={{ background:C.surface, borderRadius:8, padding:'9px 12px', fontSize:12.5, color:C.text2, fontStyle:'italic', marginBottom:12 }}>"{c.desc}"</div>}

        {!reassigning ? (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {!['COMPLETED','REJECTED'].includes(c.status) && <ActionBtn onClick={()=>{onStatusChange(c.id,'COMPLETED');onClose();}} color={C.green} Icon={CheckCircle2}>Force Complete</ActionBtn>}
            <ActionBtn onClick={()=>setReassigning(true)} color={C.blue} Icon={RotateCcw} outline>Reassign</ActionBtn>
            {c.status!=='REJECTED' && <ActionBtn onClick={()=>{onStatusChange(c.id,'REJECTED');onClose();}} color={C.red} Icon={XCircle}>Reject</ActionBtn>}
          </div>
        ) : (
          <div>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Select new vendor:</div>
            {VENDORS.map(v=>(
              <div key={v.id} onClick={()=>{onReassign(c.id,v.id);onClose();}}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:9, cursor:'pointer', marginBottom:8, transition:'background .15s' }}
                onMouseEnter={e=>e.currentTarget.style.background=C.blueL}
                onMouseLeave={e=>e.currentTarget.style.background=''}
              >
                <div style={{ width:34, height:34, borderRadius:'50%', background:C.blue, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{v.name[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{v.name}</div>
                  <div style={{ fontSize:11.5, color:C.text3 }}>{v.contact} · ⭐ {v.rating}</div>
                </div>
                {v.id===c.vendor?.id && <span style={{ fontSize:11, color:C.text3, fontStyle:'italic' }}>Current</span>}
              </div>
            ))}
            <ActionBtn onClick={()=>setReassigning(false)} color={C.gray} outline Icon={ChevronLeft}>Cancel</ActionBtn>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ActionBtn({ children, onClick, color, outline=false, Icon, small=false }) {
  return (
    <button onClick={onClick} style={{
      padding:small?'6px 12px':'9px 16px', borderRadius:9, fontSize:small?12:13, fontWeight:600, cursor:'pointer',
      background:outline?C.white:color, color:outline?color:C.white,
      border:outline?`1px solid ${color}`:'none', transition:'all .15s',
      display:'inline-flex', alignItems:'center', gap:6,
    }}>
      {Icon && <Icon size={small?12:14}/>} {children}
    </button>
  );
}

// need ChevronLeft
function ChevronLeft({ size=14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>;
}
