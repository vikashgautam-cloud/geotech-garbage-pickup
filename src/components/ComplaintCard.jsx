// src/components/ComplaintCard.jsx
import React from 'react';
import {
  MapPin, Clock, User, AlertTriangle, CheckCircle2,
  XCircle, MessageSquare, Navigation2, Trash2, Package, FlaskConical, Recycle, Droplets
} from 'lucide-react';
import { Modal, ModalHeader, StatRow } from './UI';
import { timeAgo } from '../utils/helpers';

const C = {
  navy:'#0A1628', blue:'#1565C0', blueL:'#E3F2FD', green:'#2E7D32', greenL:'#E8F5E9',
  red:'#B71C1C', redL:'#FFEBEE', amber:'#E65100', amberL:'#FFF3E0', purple:'#4527A0', purpleL:'#EDE7F6',
  gray:'#546E7A', grayL:'#ECEFF1', text:'#0D1117', text2:'#3D4F61', text3:'#7A8FA6',
  white:'#fff', surface:'#F7F9FC', border:'#DDE3E9',
};

const STATUS_MAP = {
  NEW: { bg: C.amberL, color: C.amber, label: 'New', Icon: AlertTriangle },
  ACCEPTED: { bg: C.blueL, color: C.blue, label: 'Accepted', Icon: CheckCircle2 },
  IN_PROGRESS: { bg: C.purpleL, color: C.purple, label: 'In Progress', Icon: Navigation2 },
  COMPLETED: { bg: C.greenL, color: C.green, label: 'Completed', Icon: CheckCircle2 },
  QUERIED: { bg: '#FFF8E1', color: '#F57F17', label: 'Queried', Icon: MessageSquare },
  ESCALATED: { bg: C.redL, color: C.red, label: 'Escalated', Icon: AlertTriangle },
  REJECTED: { bg: C.grayL, color: C.gray, label: 'Rejected', Icon: XCircle },
};

const GTYPE_ICONS = {
  'Plastic Waste': Trash2, 'Food Waste': Package, 'Abandoned Item': Package,
  'Chemical Spill': FlaskConical, 'Recyclable': Recycle, 'Sewage / Water': Droplets,
};

// Clean String Helper to prevent empty strings ("") or null entities from breaking UI
const getValidImageSource = (c) => {
  if (c.image && typeof c.image === 'string' && c.image.trim().length > 10) return c.image.trim();
  if (c.cleanerPhoto && typeof c.cleanerPhoto === 'string' && c.cleanerPhoto.trim().length > 10) return c.cleanerPhoto.trim();
  if (c.photo && typeof c.photo === 'string' && c.photo.trim().length > 10) return c.photo.trim();
  return null;
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

export function ComplaintCard({ complaint: c, actions, onClick }) {
  const TypeIcon = GTYPE_ICONS[c.gtype] || Trash2;
  const imageSource = getValidImageSource(c);

  return (
    <div onClick={onClick} style={{
      background:C.white, border:`1px solid ${C.border}`, borderRadius:16,
      overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)',
      cursor:onClick?'pointer':'default', transition:'box-shadow .2s',
    }}
      onMouseEnter={e=>{if(onClick)e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.1)';}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.06)';}}
    >
      <div style={{ height:130, background:'#111', position:'relative', overflow:'hidden' }}>
        {imageSource ? (
          <img 
            src={imageSource} 
            alt="complaint proof" 
            style={{ width:'100%', height:'100%', objectFit:'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{ width:'100%', height:'100%', background:`linear-gradient(135deg,#1a2744,#1565C0)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
            <TypeIcon size={32} color="rgba(255,255,255,.3)"/>
            <span style={{ color:'rgba(255,255,255,.3)', fontSize:11, fontWeight:600 }}>No photo</span>
          </div>
        )}
        <div style={{ position:'absolute', top:8, right:8 }}><Badge status={c.status}/></div>
        {c.severity==='critical' && (
          <div style={{ position:'absolute', top:8, left:8, background:C.red, color:'#fff', fontSize:9.5, fontWeight:700, padding:'2px 7px', borderRadius:99, display:'flex', alignItems:'center', gap:3 }}>
            <AlertTriangle size={9}/> CRITICAL
          </div>
        )}
      </div>

      <div style={{ padding:'12px 14px' }}>
        <div style={{ fontSize:10, fontFamily:'monospace', color:C.text3, marginBottom:2 }}>{c.customTicketId || c.id}</div>
        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:5, lineHeight:1.3, display:'flex', alignItems:'center', gap:6 }}>
          <TypeIcon size={14} color={C.blue}/> {c.area} — {c.gtype}
        </div>
        <div style={{ fontSize:11.5, color:C.text3, marginBottom:8, display:'flex', gap:10, flexWrap:'wrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:3 }}><MapPin size={11}/>{c.station?.name || 'Station'}</span>
          <span style={{ display:'flex', alignItems:'center', gap:3 }}><Clock size={11}/>{timeAgo(c.reportedAt)}</span>
          <span style={{ display:'flex', alignItems:'center', gap:3 }}><User size={11}/>{c.reportedBy}</span>
        </div>
        {actions && <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginTop:8 }}>{actions}</div>}
      </div>
    </div>
  );
}

export function VendorComplaintModal({ complaint: c, onClose, onAction }) {
  const TypeIcon = GTYPE_ICONS[c.gtype] || Trash2;
  const imageSource = getValidImageSource(c);
  
  const tl = [
    { label:'Report Submitted', done:true, icon:CheckCircle2, time:c.reportedAt },
    { label:'Assigned to Cleaner', done:true, icon:User },
    { label:'Vendor Accepted', done:['ACCEPTED','IN_PROGRESS','COMPLETED'].includes(c.status), icon:CheckCircle2 },
    { label:'Cleaning In Progress', done:['IN_PROGRESS','COMPLETED'].includes(c.status), icon:Navigation2 },
    { label:'Completed', done:c.status==='COMPLETED', icon:CheckCircle2, time:c.resolvedAt },
  ];

  // Primary Document targeting fallback identifier check
  const targetId = c.id || c.customTicketId;

  return (
    <Modal onClose={onClose}>
      <ModalHeader title={c.gtype} sub={c.customTicketId || c.id} onClose={onClose}/>
      <div style={{ padding:'0 20px 22px' }}>
        <div style={{ borderRadius:12, overflow:'hidden', marginBottom:12, background:'#111', height:200 }}>
          {imageSource ? (
            <img 
              src={imageSource} 
              alt="complaint proof detailing" 
              style={{ width:'100%', height:'100%', objectFit:'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#1a2744,#1565C0)' }}>
              <TypeIcon size={40} color="rgba(255,255,255,.25)"/>
              <span style={{ color:'rgba(255,255,255,.3)', fontSize:12 }}>No photo captured</span>
            </div>
          )}
        </div>
        <div style={{ marginBottom:12 }}><Badge status={c.status}/></div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:'4px 14px', marginBottom:12 }}>
          <StatRow label="Station" value={c.station?.name || 'Nagpur Junction'}/>
          <StatRow label="Area" value={c.area}/>
          <StatRow label="GPS" value={c.lat ? `${c.lat}°N, ${c.lng}°E` : "21.16542°N, 79.08095°E"}/>
          <StatRow label="Reported" value={timeAgo(c.reportedAt)}/>
          <StatRow label="By" value={c.reportedBy} last/>
        </div>
        {c.desc && <div style={{ background:C.surface, borderRadius:8, padding:'9px 12px', fontSize:12.5, color:C.text2, fontStyle:'italic', marginBottom:12 }}>"{c.desc}"</div>}
        
        <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Progress Timeline</div>
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
          {c.status==='NEW' && <ActionBtn onClick={()=>onAction(targetId,'ACCEPTED')} color={C.blue} Icon={CheckCircle2}>Accept Task</ActionBtn>}
          {c.status==='ACCEPTED' && <ActionBtn onClick={()=>onAction(targetId,'IN_PROGRESS')} color={C.purple} Icon={Navigation2}>Start Work</ActionBtn>}
          {c.status==='IN_PROGRESS' && <ActionBtn onClick={()=>onAction(targetId,'COMPLETED')} color={C.green} Icon={CheckCircle2}>Mark Complete</ActionBtn>}
          {['NEW','ACCEPTED'].includes(c.status) && <ActionBtn onClick={()=>onAction(targetId,'QUERIED')} color={C.amber} Icon={MessageSquare} outline>Raise Query</ActionBtn>}
        </div>
      </div>
    </Modal>
  );
}

export function AdminComplaintModal({ complaint: c, onClose, onStatusChange }) {
  const TypeIcon = GTYPE_ICONS[c.gtype] || Trash2;
  const imageSource = getValidImageSource(c);
  const targetId = c.id || c.customTicketId;

  return (
    <Modal onClose={onClose}>
      <ModalHeader title={`${c.gtype} — ${c.station?.name || 'Nagpur Junction'}`} sub={c.customTicketId || c.id} onClose={onClose}/>
      <div style={{ padding:'0 20px 22px' }}>
        <div style={{ borderRadius:12, overflow:'hidden', marginBottom:12, background:'#111', height:190 }}>
          {imageSource ? (
            <img 
              src={imageSource} 
              alt="complaint proof confirmation" 
              style={{ width:'100%', height:'100%', objectFit:'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#1a2744,#1565C0)' }}>
              <TypeIcon size={38} color="rgba(255,255,255,.25)"/>
              <span style={{ color:'rgba(255,255,255,.3)', fontSize:12 }}>No photo captured</span>
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
          <Badge status={c.status}/>
          {c.severity==='critical' && <span style={{ background:C.redL, color:C.red, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, display:'flex', alignItems:'center', gap:4 }}><AlertTriangle size={11}/>Critical Priority</span>}
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:'4px 14px', marginBottom:12 }}>
          <StatRow label="Station" value={c.station?.name || 'Nagpur Junction'}/>
          <StatRow label="Area" value={c.area}/>
          <StatRow label="GPS" value={c.lat ? `${c.lat}°N, ${c.lng}°E` : "21.16542°N, 79.08095°E"}/>
          <StatRow label="Reported by" value={c.reportedBy}/>
          <StatRow label="Reported" value={timeAgo(c.reportedAt)} last/>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {!['COMPLETED','REJECTED'].includes(c.status) && <ActionBtn onClick={()=>{onStatusChange(targetId,'COMPLETED'); onClose();}} color={C.green} Icon={CheckCircle2}>Force Complete</ActionBtn>}
          {c.status!=='REJECTED' && <ActionBtn onClick={()=>{onStatusChange(targetId,'REJECTED'); onClose();}} color={C.red} Icon={XCircle}>Reject Ticket</ActionBtn>}
        </div>
      </div>
    </Modal>
  );
}

function ActionBtn({ children, onClick, color, outline=false, Icon, small=false }) {
  return (
    <button onClick={onClick} style={{
      padding:small?'6px 12px':'9px 16px', borderRadius:9, fontSize:small?12:13, fontWeight:600, cursor:'pointer',
      background:outline?'#fff':color, color:outline?color:'#fff',
      border:outline?`1px solid ${color}`:'none', transition:'all .15s',
      display:'inline-flex', alignItems:'center', gap:6,
    }}>
      {Icon && <Icon size={small?12:14}/>} {children}
    </button>
  );
}