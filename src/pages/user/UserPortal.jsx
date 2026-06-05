import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../App';
import { STATIONS, GARBAGE_TYPES, AREAS } from '../../data/mockData';
import LiveMap from '../../components/LiveMap';
import {
  Camera, MapPin, Send, ChevronLeft, CheckCircle2, AlertTriangle,
  Trash2, Recycle, Package, FlaskConical, Droplets, Clock,
  Image, X, RotateCcw, ZoomIn, Bell, Shield,
  FileText, HelpCircle, Map, CheckCircle, Circle,
  Navigation, ChevronDown, ChevronRight, Phone, Mail,
  MessageCircle, AlertCircle, Info, Star, Filter,
  TrendingUp, Calendar, Hash, Search
} from 'lucide-react';

/* ─── TOKENS ─── */
const T = {
  navy:'#0A1628', navyMid:'#122040',
  blue:'#1565C0', blueHov:'#1976D2', blueXL:'#E3F2FD',
  green:'#2E7D32', greenL:'#E8F5E9', greenB:'#C8E6C9',
  red:'#B71C1C', redL:'#FFEBEE',
  amber:'#E65100', amberL:'#FFF3E0',
  purple:'#4527A0', purpleL:'#EDE7F6',
  gray:'#546E7A', grayMid:'#78909C', grayL:'#ECEFF1',
  text:'#0D1117', text2:'#3D4F61', text3:'#7A8FA6',
  white:'#FFFFFF', border:'#DDE3E9', surface:'#F7F9FC',
};

const GTYPE_ICONS = {
  'Plastic Waste':Trash2,'Food Waste':Package,'Abandoned Item':Package,
  'Chemical Spill':FlaskConical,'Recyclable':Recycle,'Recyclable Waste':Recycle,'Sewage / Water':Droplets,
};

const STATUS_COLORS = {
  NEW:        {bg:T.amberL,  color:T.amber,  label:'Pending'},
  ACCEPTED:   {bg:T.blueXL,  color:T.blue,   label:'Accepted'},
  IN_PROGRESS:{bg:T.purpleL, color:T.purple, label:'In Progress'},
  COMPLETED:  {bg:T.greenL,  color:T.green,  label:'Done'},
  QUERIED:    {bg:'#FFF8E1', color:'#F57F17', label:'Queried'},
  ESCALATED:  {bg:T.redL,    color:T.red,    label:'Escalated'},
  REJECTED:   {bg:T.grayL,   color:T.gray,   label:'Rejected'},
};

/* ─── HELPERS ─── */
function timeAgo(date) {
  if (!date) return 'Unknown';
  const d = date instanceof Date ? date : new Date(date);
  const s = Math.floor((Date.now()-d)/1000);
  if (s<60) return 'Just now';
  if (s<3600) return `${Math.floor(s/60)}m ago`;
  if (s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

/* ─── SHARED COMPONENTS ─── */
const StatusBadge = ({status}) => {
  const s = STATUS_COLORS[status]||STATUS_COLORS.NEW;
  return <span style={{background:s.bg,color:s.color,padding:'3px 10px',borderRadius:99,fontSize:10.5,fontWeight:700,whiteSpace:'nowrap'}}>{s.label}</span>;
};

const TopBar = ({title,onBack,right}) => (
  <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderBottom:`1px solid ${T.border}`,background:T.white,flexShrink:0}}>
    {onBack&&<button onClick={onBack} style={{width:34,height:34,borderRadius:'50%',background:T.surface,border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><ChevronLeft size={18} color={T.text2}/></button>}
    <span style={{fontSize:15,fontWeight:700,flex:1,color:T.text}}>{title}</span>
    {right}
  </div>
);

const Logo = () => (
  <img src="/logo.jpeg" alt="Swachh Rail" style={{width:28,height:28,borderRadius:6,objectFit:'cover',flexShrink:0}}
    onError={e=>{e.currentTarget.style.display='none';}}/>
);

function LiveToast({msg,onDone}) {
  useEffect(()=>{const t=setTimeout(onDone,4000);return()=>clearTimeout(t);},[onDone]);
  return <>
    <div style={{position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',background:T.navy,color:T.white,padding:'10px 18px',borderRadius:12,fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,.3)',whiteSpace:'nowrap',animation:'slideUp .3s ease'}}>
      <Bell size={15} color="#42A5F5"/> {msg}
    </div>
    <style>{`@keyframes slideUp{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
  </>;
}

function BottomNav({active,onChange}) {
  const tabs=[{id:'map',Icon:Map,label:'Map'},{id:'reports',Icon:FileText,label:'Reports'},{id:'help',Icon:HelpCircle,label:'Help'}];
  return (
    <div style={{background:T.white,borderTop:`1px solid ${T.border}`,display:'flex',flexShrink:0,paddingBottom:'env(safe-area-inset-bottom)'}}>
      {tabs.map(b=>(
        <button key={b.id} onClick={()=>onChange(b.id)} style={{flex:1,padding:'9px 4px',textAlign:'center',cursor:'pointer',border:'none',background:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
          <b.Icon size={19} color={active===b.id?T.blue:T.text3}/>
          <span style={{fontSize:9.5,fontWeight:700,color:active===b.id?T.blue:T.text3}}>{b.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAP HOME
══════════════════════════════════════════ */
function MapHome({onReport,myReports,liveToast,onClearToast,onTabChange}) {
  const {complaints} = useApp();
  const [userLocation,setUserLocation] = useState({lat:21.15230,lng:79.08820});
  const mapComplaints = (complaints||[]).filter(c=>c.lat&&c.lng);

  useEffect(()=>{
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      p=>setUserLocation({lat:p.coords.latitude,lng:p.coords.longitude}),
      ()=>{},{enableHighAccuracy:true,timeout:6000}
    );
  },[]);

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div style={{background:`linear-gradient(135deg,${T.navy} 0%,${T.navyMid} 100%)`,padding:'12px 18px',flexShrink:0,paddingTop:'calc(12px + env(safe-area-inset-top))'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
          <div style={{width:22,height:15,borderRadius:2,overflow:'hidden',display:'flex',flexDirection:'column',flexShrink:0}}>
            <div style={{flex:1,background:'#FF9933'}}/><div style={{flex:1,background:'#fff'}}/><div style={{flex:1,background:'#138808'}}/>
          </div>
          <span style={{color:'rgba(255,255,255,.55)',fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>Indian Railways · Nagpur Division</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Logo/>
          <div>
            <div style={{color:T.white,fontSize:17,fontWeight:800,lineHeight:1.2}}>Swachh Rail — Nagpur</div>
            <div style={{color:'rgba(255,255,255,.5)',fontSize:11,marginTop:1}}>Report garbage near you · No login needed</div>
          </div>
        </div>
      </div>
      <div style={{flex:1,position:'relative',minHeight:200}}>
        <LiveMap complaints={mapComplaints} center={[userLocation.lat,userLocation.lng]} zoom={16} height="100%"/>
        <div style={{position:'absolute',top:10,right:10,background:'rgba(10,22,40,.85)',color:T.white,padding:'5px 12px',borderRadius:8,fontSize:11,fontWeight:600,zIndex:400,display:'flex',alignItems:'center',gap:5}}>
          <Shield size={12} color="#42A5F5"/>{mapComplaints.length} active reports
        </div>
        <button onClick={onReport} style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',background:T.blue,color:T.white,padding:'13px 26px',borderRadius:99,fontWeight:800,fontSize:14,border:'none',cursor:'pointer',boxShadow:`0 4px 20px ${T.blue}66`,display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap',zIndex:500,WebkitTapHighlightColor:'transparent'}}>
          <Camera size={18}/> Report Garbage
        </button>
      </div>
      <div style={{background:T.white,borderTop:`1px solid ${T.border}`,padding:'10px 14px',maxHeight:175,overflowY:'auto',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,color:T.text}}>Your Reports ({myReports.length})</div>
          {myReports.length>0&&<button onClick={()=>onTabChange('reports')} style={{fontSize:11,color:T.blue,fontWeight:600,background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}>View all <ChevronRight size={12}/></button>}
        </div>
        {myReports.length===0
          ? <div style={{fontSize:12,color:T.text3,textAlign:'center',padding:'10px 0',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><MapPin size={13} color={T.text3}/> Tap the button above to make your first report</div>
          : myReports.slice(0,3).map(r=>(
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 0',borderBottom:`1px solid ${T.border}`}}>
              <div style={{width:40,height:40,borderRadius:8,overflow:'hidden',flexShrink:0,border:`1px solid ${T.border}`,background:T.surface,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {r.photoURL?<img src={r.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<Image size={14} color={T.text3}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,fontFamily:'monospace',color:T.text3}}>{String(r.id)}</div>
                <div style={{fontSize:12.5,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.gtype} — {r.area}</div>
                <div style={{fontSize:11,color:T.text3,display:'flex',alignItems:'center',gap:4}}><Clock size={10}/> {timeAgo(r.reportedAt)}</div>
              </div>
              <StatusBadge status={r.status}/>
            </div>
          ))
        }
      </div>
      <BottomNav active="map" onChange={onTabChange}/>
      {liveToast&&<LiveToast msg={liveToast} onDone={onClearToast}/>}
    </div>
  );
}

/* ══════════════════════════════════════════
   REPORTS SCREEN
══════════════════════════════════════════ */
function ReportsScreen({myReports,onTabChange}) {
  const {complaints,loading} = useApp();
  const [filter,setFilter] = useState('ALL');
  const [search,setSearch] = useState('');
  const [expanded,setExpanded] = useState(null);

  const firestoreIds = new Set((complaints||[]).map(c=>c.customTicketId));
  const localOnly = myReports.filter(r=>!firestoreIds.has(r.id));
  const allReports = [...localOnly.map(r=>({...r,_source:'local'})),...(complaints||[]).map(c=>({...c,_source:'firestore'}))];

  const FILTERS = ['ALL','NEW','ACCEPTED','IN_PROGRESS','COMPLETED','ESCALATED'];
  const filtered = allReports.filter(r=>{
    const matchStatus = filter==='ALL'||r.status===filter;
    const q = search.toLowerCase();
    const matchSearch = !q||(r.gtype||'').toLowerCase().includes(q)||(r.area||'').toLowerCase().includes(q)||(r.id||'').toLowerCase().includes(q)||(r.customTicketId||'').toLowerCase().includes(q);
    return matchStatus&&matchSearch;
  });

  const total=allReports.length, done=allReports.filter(r=>r.status==='COMPLETED').length,
    pending=allReports.filter(r=>['NEW','ACCEPTED','IN_PROGRESS'].includes(r.status)).length,
    escalated=allReports.filter(r=>r.status==='ESCALATED').length;

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div style={{background:`linear-gradient(135deg,${T.navy} 0%,${T.navyMid} 100%)`,padding:'14px 18px',flexShrink:0,paddingTop:'calc(14px + env(safe-area-inset-top))'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <Logo/>
          <div>
            <div style={{color:T.white,fontSize:16,fontWeight:800}}>All Reports</div>
            <div style={{color:'rgba(255,255,255,.5)',fontSize:11}}>Live from Nagpur Division</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {[{label:'Total',value:total,color:'#42A5F5'},{label:'Pending',value:pending,color:'#FFA726'},{label:'Done',value:done,color:'#66BB6A'},{label:'Escalated',value:escalated,color:'#EF5350'}].map(s=>(
            <div key={s.label} style={{flex:1,background:'rgba(255,255,255,.08)',borderRadius:10,padding:'8px 6px',textAlign:'center'}}>
              <div style={{color:s.color,fontSize:18,fontWeight:800}}>{s.value}</div>
              <div style={{color:'rgba(255,255,255,.5)',fontSize:9.5,fontWeight:600}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:'10px 14px 6px',background:T.white,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'8px 12px'}}>
          <Search size={14} color={T.text3}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by type, area, ticket ID…"
            style={{flex:1,border:'none',background:'none',fontSize:13,outline:'none',color:T.text,fontFamily:'inherit'}}/>
          {search&&<button onClick={()=>setSearch('')} style={{border:'none',background:'none',cursor:'pointer',color:T.text3}}><X size={13}/></button>}
        </div>
      </div>
      <div style={{display:'flex',gap:6,padding:'8px 14px',overflowX:'auto',flexShrink:0,background:T.white,borderBottom:`1px solid ${T.border}`}}>
        {FILTERS.map(f=>{
          const count=f==='ALL'?allReports.length:allReports.filter(r=>r.status===f).length, active=filter===f;
          return (
            <button key={f} onClick={()=>setFilter(f)} style={{whiteSpace:'nowrap',padding:'5px 12px',borderRadius:99,fontSize:11.5,fontWeight:700,border:`1.5px solid ${active?T.blue:T.border}`,background:active?T.blue:T.white,color:active?T.white:T.text2,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',gap:5}}>
              {f==='ALL'?'All':(STATUS_COLORS[f]?.label||f)}
              <span style={{background:active?'rgba(255,255,255,.25)':T.grayL,color:active?T.white:T.text3,borderRadius:99,padding:'1px 6px',fontSize:10}}>{count}</span>
            </button>
          );
        })}
      </div>
      <div style={{flex:1,overflowY:'auto',background:T.surface}}>
        {loading&&allReports.length===0
          ? <div style={{padding:32,textAlign:'center',color:T.text3,fontSize:13}}><TrendingUp size={28} style={{display:'block',margin:'0 auto 8px'}}/>Loading reports…</div>
          : filtered.length===0
            ? <div style={{padding:32,textAlign:'center',color:T.text3,fontSize:13}}><FileText size={28} style={{display:'block',margin:'0 auto 8px',opacity:.4}}/>No reports match your filter</div>
            : <div style={{padding:'8px 12px',display:'flex',flexDirection:'column',gap:8}}>
              {filtered.map(r=>{
                const Icon=GTYPE_ICONS[r.gtype]||Trash2, ticketId=r.customTicketId||r.id, isOpen=expanded===ticketId;
                const stationName=typeof r.station==='object'?r.station?.name:r.station;
                return (
                  <div key={ticketId} style={{background:T.white,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden'}}>
                    <div onClick={()=>setExpanded(isOpen?null:ticketId)} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 13px',cursor:'pointer'}}>
                      <div style={{width:44,height:44,borderRadius:8,overflow:'hidden',flexShrink:0,background:T.surface,border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {r.image||r.photoURL?<img src={r.image||r.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<Icon size={18} color={T.gray}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                          <span style={{fontSize:10,fontFamily:'monospace',color:T.text3,fontWeight:600}}>{ticketId}</span>
                          {r._source==='local'&&<span style={{fontSize:9,background:T.blueXL,color:T.blue,padding:'1px 5px',borderRadius:4,fontWeight:700}}>LOCAL</span>}
                        </div>
                        <div style={{fontSize:13,fontWeight:700,color:T.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.gtype}</div>
                        <div style={{fontSize:11,color:T.text3,display:'flex',alignItems:'center',gap:4,marginTop:1}}><MapPin size={9}/> {r.area}</div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
                        <StatusBadge status={r.status}/>
                        <span style={{fontSize:10,color:T.text3}}>{timeAgo(r.reportedAt)}</span>
                      </div>
                      <ChevronDown size={14} color={T.text3} style={{transform:isOpen?'rotate(180deg)':'none',transition:'transform .2s',marginLeft:2,flexShrink:0}}/>
                    </div>
                    {isOpen&&(
                      <div style={{borderTop:`1px solid ${T.border}`,padding:'10px 13px',background:T.surface}}>
                        {(r.image||r.photoURL)&&<div style={{borderRadius:8,overflow:'hidden',marginBottom:10,maxHeight:160}}><img src={r.image||r.photoURL} alt="evidence" style={{width:'100%',height:160,objectFit:'cover',display:'block'}}/></div>}
                        <div style={{display:'flex',flexDirection:'column',gap:6}}>
                          {[['Station',stationName||'—'],['Area',r.area||'—'],['Severity',r.severity||'—'],['Reported by',r.reportedBy||'Citizen (App)'],['GPS',r.lat&&r.lng?`${r.lat}°N, ${r.lng}°E`:'—'],...(r.desc?[['Note',r.desc]]:[]),...(r.resolvedAt?[['Resolved',timeAgo(r.resolvedAt)]]:[]),...(r.resolutionMins?[['Resolution time',`${r.resolutionMins} min`]]:[])].map(([k,v])=>(
                            <div key={k} style={{display:'flex',justifyContent:'space-between',gap:8}}>
                              <span style={{fontSize:11.5,color:T.text3,flexShrink:0}}>{k}</span>
                              <span style={{fontSize:11.5,fontWeight:600,color:T.text,textAlign:'right'}}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
        }
      </div>
      <BottomNav active="reports" onChange={onTabChange}/>
    </div>
  );
}

/* ══════════════════════════════════════════
   HELP SCREEN
══════════════════════════════════════════ */
function HelpScreen({onTabChange}) {
  const {complaints} = useApp();
  const [openFaq,setOpenFaq] = useState(null);

  const total=(complaints||[]).length, completed=(complaints||[]).filter(c=>c.status==='COMPLETED').length;
  const avgRes=(()=>{const r=(complaints||[]).filter(c=>c.resolutionMins);if(!r.length)return null;return Math.round(r.reduce((s,c)=>s+c.resolutionMins,0)/r.length);})();

  const FAQS=[
    {q:'How do I report garbage?',a:'Tap "Report Garbage" on the Map screen, take a photo, select the garbage type, confirm your location and nearest station, then tap "Send Report". Your complaint is instantly forwarded to the assigned cleaning vendor.'},
    {q:'Do I need to create an account?',a:'No. Swachh Rail works without any login or registration. Just open the app and report directly. Your GPS coordinates are captured automatically.'},
    {q:`How can I track my complaint?`,a:`Go to the Reports tab to see all submitted complaints with live status updates. ${total>0?`There are currently ${total} reports in the system.`:''} Each report shows its current status: Pending → Accepted → In Progress → Done.`},
    {q:'How quickly is a complaint resolved?',a:avgRes?`Currently, the average resolution time is ${avgRes} minutes. ${completed} out of ${total} reports have been resolved.`:'Most complaints are addressed within 30–90 minutes depending on severity. Critical issues like chemical spills are escalated immediately.'},
    {q:'What types of garbage can I report?',a:`You can report: ${GARBAGE_TYPES.map(g=>g.label).join(', ')}.`},
    {q:'Which areas and stations are covered?',a:`Currently covering: ${STATIONS.map(s=>s.name).join(', ')}.`},
    {q:'What happens after I submit a report?',a:'1. Your report is logged with GPS and photo evidence.\n2. The assigned vendor is notified instantly.\n3. A cleaner is dispatched.\n4. Status updates in real-time.\n5. You receive a ticket number to track progress.'},
    {q:'My camera or GPS is not working.',a:'Make sure you have granted camera and location permissions in your device settings. On iOS, go to Settings → Safari/Browser → Camera & Location. If GPS fails, the app defaults to Nagpur Railway Station coordinates.'},
  ];

  const CONTACTS=[
    {label:'Station Manager',name:'Nagpur Railway Station',phone:'0712-274-2080',icon:Phone},
    {label:'Cleaning Helpline',name:'CleanRail Pvt Ltd',phone:'98123-45670',icon:Phone},
    {label:'Email Grievance',name:'ngp.complaints@cr.railnet.gov.in',phone:null,icon:Mail,isEmail:true},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <div style={{background:`linear-gradient(135deg,${T.navy} 0%,${T.navyMid} 100%)`,padding:'14px 18px',flexShrink:0,paddingTop:'calc(14px + env(safe-area-inset-top))'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <Logo/>
          <div>
            <div style={{color:T.white,fontSize:16,fontWeight:800}}>Help & Support</div>
            <div style={{color:'rgba(255,255,255,.5)',fontSize:11}}>Swachh Rail · Nagpur Division</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {[{label:'Reports Filed',value:total,icon:FileText},{label:'Resolved',value:completed,icon:CheckCircle2},{label:'Avg. Resolution',value:avgRes?`${avgRes}m`:'N/A',icon:Clock}].map(s=>(
            <div key={s.label} style={{flex:1,background:'rgba(255,255,255,.08)',borderRadius:10,padding:'8px 6px',textAlign:'center'}}>
              <s.icon size={14} color="rgba(255,255,255,.4)" style={{display:'block',margin:'0 auto 3px'}}/>
              <div style={{color:T.white,fontSize:16,fontWeight:800}}>{s.value}</div>
              <div style={{color:'rgba(255,255,255,.45)',fontSize:9,fontWeight:600}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',background:T.surface}}>
        <div style={{margin:'12px 12px 0',background:T.blueXL,border:`1px solid ${T.blue}33`,borderRadius:12,padding:'12px 14px'}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}><Info size={15} color={T.blue}/><span style={{fontSize:13,fontWeight:700,color:T.blue}}>How to Use</span></div>
          {[{step:'1',text:'Open the Map tab and tap "Report Garbage"'},{step:'2',text:'Take a photo of the garbage or issue'},{step:'3',text:'Select the garbage type from the list'},{step:'4',text:'Confirm your location and nearest station'},{step:'5',text:'Tap "Send Report" — done! Vendor is notified'}].map(s=>(
            <div key={s.step} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:7}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:T.blue,color:T.white,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,flexShrink:0}}>{s.step}</div>
              <span style={{fontSize:12.5,color:T.text2,lineHeight:1.5,paddingTop:1}}>{s.text}</span>
            </div>
          ))}
        </div>
        <div style={{padding:'14px 12px 6px'}}>
          <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Phone size={13} color={T.text}/> Contact</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {CONTACTS.map(c=>(
              <div key={c.label} style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:11,padding:'11px 13px',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:T.blueXL,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><c.icon size={16} color={T.blue}/></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10.5,color:T.text3,fontWeight:600}}>{c.label}</div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name}</div>
                  {c.phone&&<div style={{fontSize:11.5,color:T.blue,marginTop:1,fontFamily:'monospace'}}>{c.phone}</div>}
                </div>
                <a href={c.isEmail?`mailto:${c.name}`:`tel:${c.phone}`} style={{width:32,height:32,borderRadius:'50%',background:T.blue,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,textDecoration:'none'}}><c.icon size={14} color={T.white}/></a>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:'14px 12px 12px'}}>
          <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><MessageCircle size={13} color={T.text}/> Frequently Asked Questions</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {FAQS.map((faq,i)=>{
              const isOpen=openFaq===i;
              return (
                <div key={i} style={{background:T.white,border:`1px solid ${isOpen?T.blue:T.border}`,borderRadius:11,overflow:'hidden'}}>
                  <button onClick={()=>setOpenFaq(isOpen?null:i)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 13px',background:'none',border:'none',cursor:'pointer',gap:10,textAlign:'left'}}>
                    <span style={{fontSize:13,fontWeight:600,color:isOpen?T.blue:T.text,lineHeight:1.4}}>{faq.q}</span>
                    <ChevronDown size={15} color={isOpen?T.blue:T.text3} style={{transform:isOpen?'rotate(180deg)':'none',transition:'transform .2s',flexShrink:0}}/>
                  </button>
                  {isOpen&&<div style={{padding:'0 13px 13px',fontSize:12.5,color:T.text2,lineHeight:1.7,whiteSpace:'pre-line'}}>{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{padding:'0 12px 16px'}}>
          <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><AlertCircle size={13} color={T.text}/> Severity Guide</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {GARBAGE_TYPES.map(g=>{
              const Icon=GTYPE_ICONS[g.label]||Trash2;
              const sevColor={critical:T.red,high:T.amber,medium:T.blue,low:T.green}[g.severity]||T.gray;
              const sevBg={critical:T.redL,high:T.amberL,medium:T.blueXL,low:T.greenL}[g.severity]||T.grayL;
              return (
                <div key={g.id} style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:10,padding:'9px 13px',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{background:T.grayL,padding:7,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={16} color={T.gray}/></div>
                  <span style={{flex:1,fontSize:13,fontWeight:600,color:T.text}}>{g.label}</span>
                  <span style={{fontSize:10,fontWeight:700,background:sevBg,color:sevColor,padding:'3px 8px',borderRadius:99,textTransform:'uppercase'}}>{g.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <BottomNav active="help" onChange={onTabChange}/>
    </div>
  );
}

/* ══════════════════════════════════════════
   CAMERA SCREEN — iOS/Android fixed
══════════════════════════════════════════ */
function CameraScreen({onCapture,onBack}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [gps,setGps] = useState(null);
  const [camReady,setCamReady] = useState(false);
  const [camErr,setCamErr] = useState(null);
  const [facing,setFacing] = useState('environment');
  const [flash,setFlash] = useState(false);

  const stopStream = useCallback(()=>{
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t=>t.stop());
      streamRef.current=null;
    }
    setCamReady(false);
  },[]);

  const startCamera = useCallback(async(facingMode)=>{
    stopStream();
    setCamErr(null);
    try {
      // iOS Safari requires exact constraints format
      const constraints = {
        audio: false,
        video: {
          facingMode: {ideal: facingMode},
          width: {ideal: 1280},
          height: {ideal: 720}
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stopStream(); return; }
      video.srcObject = stream;
      video.setAttribute('playsinline','');      // required for iOS
      video.setAttribute('muted','');
      video.setAttribute('autoplay','');
      // iOS needs explicit play() in user gesture context
      await new Promise((res,rej)=>{
        video.onloadedmetadata = async()=>{
          try { await video.play(); res(); }
          catch(e){ if(e.name!=='AbortError') rej(e); else res(); }
        };
        video.onerror = rej;
        setTimeout(()=>rej(new Error('timeout')),8000);
      });
      setCamReady(true);
    } catch(e) {
      console.warn('Camera error:',e);
      if (facingMode==='environment') {
        // Fallback to user/front camera
        try {
          stopStream();
          const stream = await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user'}});
          streamRef.current=stream;
          const video=videoRef.current;
          if(video){
            video.srcObject=stream;
            video.setAttribute('playsinline','');
            await new Promise(res=>{video.onloadedmetadata=async()=>{await video.play().catch(()=>{});res();};setTimeout(res,5000);});
            setCamReady(true);
            setFacing('user');
          }
        } catch(e2) {
          setCamErr('Camera not available. Please allow camera access in your device Settings.');
        }
      } else {
        setCamErr('Camera not available. Please allow camera access in your device Settings.');
      }
    }
  },[stopStream]);

  useEffect(()=>{
    startCamera(facing);
    return ()=>stopStream();
  },[facing]);// eslint-disable-line

  useEffect(()=>{
    if (!navigator.geolocation){setGps({lat:'21.15230',lng:'79.08820'});return;}
    navigator.geolocation.getCurrentPosition(
      p=>setGps({lat:p.coords.latitude.toFixed(5),lng:p.coords.longitude.toFixed(5)}),
      ()=>setGps({lat:'21.15230',lng:'79.08820'}),
      {enableHighAccuracy:true,timeout:10000}
    );
  },[]);

  const flipCamera = ()=>{
    if (!camReady) return;
    setFacing(f=>f==='environment'?'user':'environment');
  };

  const shoot = ()=>{
    if (!camReady||!canvasRef.current||!videoRef.current||!gps) return;
    setFlash(true); setTimeout(()=>setFlash(false),180);
    const v=videoRef.current, c=canvasRef.current;
    c.width=v.videoWidth||640; c.height=v.videoHeight||480;
    const ctx=c.getContext('2d');
    if (facing==='user'){ctx.translate(c.width,0);ctx.scale(-1,1);}
    ctx.drawImage(v,0,0,c.width,c.height);
    const dataURL=c.toDataURL('image/jpeg',0.85);
    stopStream();
    onCapture(dataURL,gps);
  };

  const corners=[
    {top:18,left:18,borderWidth:'3px 0 0 3px',borderRadius:'4px 0 0 0'},
    {top:18,right:18,borderWidth:'3px 3px 0 0',borderRadius:'0 4px 0 0'},
    {bottom:18,left:18,borderWidth:'0 0 3px 3px',borderRadius:'0 0 0 4px'},
    {bottom:18,right:18,borderWidth:'0 3px 3px 0',borderRadius:'0 0 4px 0'},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,background:'#000',overflow:'hidden',position:'relative'}}>
      <canvas ref={canvasRef} style={{display:'none'}}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',paddingTop:'calc(12px + env(safe-area-inset-top))',position:'absolute',top:0,left:0,right:0,zIndex:10,background:'linear-gradient(to bottom,rgba(0,0,0,.65),transparent)'}}>
        <button onClick={()=>{stopStream();onBack();}} style={{width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.45)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',WebkitTapHighlightColor:'transparent'}}>
          <X size={18} color={T.white}/>
        </button>
        <div style={{display:'flex',alignItems:'center',gap:6,background:gps?'rgba(46,125,50,.85)':'rgba(211,47,47,.85)',padding:'5px 12px',borderRadius:99}}>
          <MapPin size={12} color={T.white}/>
          <span style={{fontSize:11,fontWeight:600,color:T.white}}>{gps?`${gps.lat}°N, ${gps.lng}°E`:'Syncing location…'}</span>
        </div>
        <button onClick={flipCamera} style={{width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.45)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',WebkitTapHighlightColor:'transparent'}}>
          <RotateCcw size={16} color={T.white}/>
        </button>
      </div>
      <div style={{flex:1,position:'relative',overflow:'hidden',minHeight:280,display:'flex',alignItems:'center',justifyContent:'center'}}>
        {flash&&<div style={{position:'absolute',inset:0,background:T.white,zIndex:20,opacity:.85}}/>}
        {camErr
          ? <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,gap:12}}>
              <AlertTriangle size={40} color={T.amber}/>
              <div style={{color:T.white,textAlign:'center',fontSize:13,lineHeight:1.6}}>{camErr}</div>
            </div>
          : <>
              <video ref={videoRef} playsInline muted autoPlay
                style={{width:'100%',height:'100%',objectFit:'cover',transform:facing==='user'?'scaleX(-1)':'none'}}/>
              {corners.map((c,i)=><div key={i} style={{position:'absolute',width:44,height:44,borderColor:'rgba(255,255,255,.75)',borderStyle:'solid',...c}}/>)}
            </>
        }
      </div>
      <div style={{background:'#111',padding:'18px 24px',paddingBottom:'calc(26px + env(safe-area-inset-bottom))',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{width:36}}/>
        <button onClick={shoot} disabled={!camReady||!gps}
          style={{width:72,height:72,borderRadius:'50%',background:camReady&&gps?T.white:'#555',border:'4px solid rgba(255,255,255,.3)',cursor:camReady&&gps?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',WebkitTapHighlightColor:'transparent'}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:camReady&&gps?T.white:'#444',border:`3px solid ${T.border}`}}/>
        </button>
        <button onClick={flipCamera}
          style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.1)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',WebkitTapHighlightColor:'transparent'}}>
          <RotateCcw size={17} color="rgba(255,255,255,.7)"/>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TYPE PICKER
══════════════════════════════════════════ */
function PickerScreen({photoURL,onSelect,onBack}) {
  const [sel,setSel] = useState(null);
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <TopBar title="What did you photograph?" onBack={onBack}/>
      <div style={{height:110,background:'#000',flexShrink:0,position:'relative',overflow:'hidden'}}>
        <img src={photoURL} alt="captured" style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.55}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'rgba(0,0,0,.6)',color:T.white,padding:'5px 13px',borderRadius:99,fontSize:11,fontWeight:600,display:'flex',alignItems:'center',gap:5}}><Image size={13}/> Classify your photo</div>
        </div>
      </div>
      <div style={{padding:'12px 16px 4px',color:T.text3,fontSize:12,flexShrink:0,fontWeight:600}}>Select the closest match:</div>
      <div style={{display:'flex',flexDirection:'column',gap:8,padding:'8px 16px',overflowY:'auto',flex:1}}>
        {GARBAGE_TYPES.map(g=>{
          const Icon=GTYPE_ICONS[g.label]||Trash2, isSelected=sel===g.id;
          return (
            <div key={g.id} onClick={()=>setSel(g.id)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:isSelected?T.blueXL:T.surface,border:`1.5px solid ${isSelected?T.blue:T.border}`,borderRadius:12,padding:'10px 14px',cursor:'pointer',transition:'all .2s ease',WebkitTapHighlightColor:'transparent'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{background:isSelected?T.white:T.grayL,padding:7,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={18} color={isSelected?T.blue:T.gray}/></div>
                <span style={{fontSize:13,fontWeight:700,color:isSelected?T.blue:T.text2}}>{g.label}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {g.severity==='critical'&&<span style={{fontSize:9,color:T.red,fontWeight:800,background:T.redL,padding:'2px 6px',borderRadius:4}}>URGENT</span>}
                {isSelected?<CheckCircle size={18} color={T.blue}/>:<Circle size={18} color={T.grayMid}/>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{padding:'12px 16px 16px',flexShrink:0,background:T.white,borderTop:`1px solid ${T.border}`}}>
        <button disabled={!sel} onClick={()=>onSelect(GARBAGE_TYPES.find(g=>g.id===sel))}
          style={{width:'100%',background:sel?T.blue:T.grayL,color:sel?T.white:T.gray,padding:13,borderRadius:12,fontSize:14.5,fontWeight:800,border:'none',cursor:sel?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:8,WebkitTapHighlightColor:'transparent'}}>
          Continue <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   CONFIRM SCREEN
══════════════════════════════════════════ */
function ConfirmScreen({ photoURL, gtype, gps, onSend, onBack, isSubmitting }) {
  const [station, setStation] = useState('Nagpur Railway Station');
  const [area, setArea] = useState(AREAS[0]);
  const [note, setNote] = useState('');
  const [zoom, setZoom] = useState(false);
  const Icon = GTYPE_ICONS[gtype.label] || Trash2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar title="Confirm & Send" onBack={onBack} />
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ position: 'relative', background: '#000' }}>
          <img src={photoURL} alt="garbage" style={{ width: '100%', maxHeight: 210, objectFit: 'cover', display: 'block' }} />
          <button onClick={() => setZoom(true)} style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: 8, padding: '4px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: T.white, fontSize: 11, fontWeight: 600 }}>
            <ZoomIn size={12} /> View full
          </button>
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,.65)', color: T.white, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon size={12} /> {gtype.label}
          </div>
        </div>

        <div style={{ padding: '13px 15px' }}>
          <div style={{ background: T.greenL, border: `1px solid ${T.greenB}`, borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
            <MapPin size={15} color={T.green} />
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: T.green }}>Location captured — Nagpur</div>
              <div style={{ fontSize: 10.5, color: T.green, fontFamily: 'monospace' }}>{gps?.lat}°N, {gps?.lng}°E</div>
            </div>
          </div>
          
          <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 11, border: `1px solid ${T.border}` }}>
            <LiveMap singlePin singleCoords={gps} height="120px" zoom={16} />
          </div>

          {/* Static Station Block */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>
              Nearest Station
            </label>
            <div style={{ width: '100%', padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, background: '#f9f9f9', color: '#555' }}>
              {station}
            </div>
          </div>

          {/* Dynamic Area Dropdown */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>
              Exact Area
            </label>
            <select value={area} onChange={e => setArea(e.target.value)} style={{ width: '100%', padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, fontFamily: 'inherit', background: T.white, WebkitAppearance: 'auto' }}>
              {AREAS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Note <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
            <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={200} placeholder="Describe what you see…"
              style={{ width: '100%', padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, minHeight: 56, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        </div>
      </div>

      <div style={{padding:'11px 14px',paddingBottom:'calc(15px + env(safe-area-inset-bottom))',borderTop:`1px solid ${T.border}`,display:'flex',gap:9,flexShrink:0,background:T.white}}>
        <button onClick={onBack} disabled={isSubmitting} style={{background:T.surface,color:T.text2,padding:'11px 13px',borderRadius:11,fontSize:13,fontWeight:600,border:`1px solid ${T.border}`,cursor:'pointer'}}>Back</button>
        <button onClick={()=>onSend({gtype,station,area,note,lat:gps?.lat,lng:gps?.lng,photoURL})} disabled={isSubmitting}
          style={{flex:1,background:isSubmitting?T.gray:T.blue,color:T.white,padding:12,borderRadius:11,fontSize:14,fontWeight:800,border:'none',cursor:isSubmitting?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:`0 2px 12px ${T.blue}55`}}>
          <Send size={16}/> {isSubmitting?'Sending…':'Send Report'}
        </button>
      </div>

      {zoom&&(
        <div onClick={()=>setZoom(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.93)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <img src={photoURL} alt="fullscreen" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',borderRadius:8}}/>
          <button onClick={()=>setZoom(false)} style={{position:'absolute',top:16,right:16,background:'rgba(255,255,255,.15)',border:'none',borderRadius:'50%',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><X size={18} color={T.white}/></button>
        </div>
      )}
    </div>
  );
}
/* ══════════════════════════════════════════
   SUCCESS SCREEN
══════════════════════════════════════════ */
function SuccessScreen({ticket,photoURL,gps,gtype,station,onDone}) {
  const Icon=GTYPE_ICONS[gtype?.label]||Trash2;
  const rows=[
    {label:'Type',icon:<Icon size={13}/>,value:gtype?.label},
    {label:'Station',icon:<Navigation size={13}/>,value:station},
    {label:'GPS',icon:<MapPin size={13}/>,value:`${gps?.lat}°N, ${gps?.lng}°E`},
    {label:'Reported',icon:<Clock size={13}/>,value:'Just now'},
  ];
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{position:'relative',flexShrink:0}}>
        <img src={photoURL} alt="reported" style={{width:'100%',height:170,objectFit:'cover',display:'block',filter:'brightness(.6)'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
          <CheckCircle2 size={48} color="#4CAF50" strokeWidth={1.5}/>
          <div style={{color:T.white,fontSize:20,fontWeight:800}}>Report Sent!</div>
          <div style={{color:'rgba(255,255,255,.7)',fontSize:12}}>Vendor notified instantly</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 16px 0'}}>
        <div style={{background:T.navy,color:T.white,borderRadius:14,padding:'13px 18px',marginBottom:13}}>
          <div style={{fontSize:9.5,opacity:.5,fontWeight:700,letterSpacing:.5,textTransform:'uppercase',marginBottom:2}}>Ticket Number</div>
          <div style={{fontSize:21,fontWeight:800,fontFamily:'monospace',letterSpacing:2}}>{String(ticket)}</div>
          <div style={{fontSize:10.5,opacity:.45,marginTop:3}}>Screenshot to track your complaint</div>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'11px 13px',marginBottom:11}}>
          {rows.map(({label,icon,value},i)=>(
            <div key={label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:i<rows.length-1?`1px solid ${T.border}`:'none'}}>
              <span style={{fontSize:12.5,color:T.text2,display:'flex',alignItems:'center',gap:5}}>{icon} {label}</span>
              <span style={{fontSize:12,fontWeight:600,color:T.text,maxWidth:180,textAlign:'right'}}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{borderRadius:12,overflow:'hidden',marginBottom:11,border:`1px solid ${T.border}`}}>
          <LiveMap singlePin singleCoords={gps} height="130px" zoom={16}/>
        </div>
      </div>
      <div style={{padding:'11px 16px',paddingBottom:'calc(18px + env(safe-area-inset-bottom))',borderTop:`1px solid ${T.border}`,flexShrink:0,background:T.white}}>
        <button onClick={onDone} style={{width:'100%',background:T.blue,color:T.white,padding:13,borderRadius:12,fontSize:14,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,WebkitTapHighlightColor:'transparent'}}>
          <MapPin size={16}/> Back to Map
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ROOT
══════════════════════════════════════════ */
export default function UserPortal() {
  const {addComplaint} = useApp();
  const [tab,setTab] = useState('map');
  const [screen,setScreen] = useState('home');
  const [photoURL,setPhotoURL] = useState(null);
  const [gps,setGps] = useState(null);
  const [gtype,setGtype] = useState(null);
  const [ticket,setTicket] = useState(null);
  const [sentData,setSentData] = useState(null);
  const [myReports,setMyReports] = useState([]);
  const [isSubmitting,setIsSubmitting] = useState(false);
  const [liveToast,setLiveToast] = useState(null);

  const handleTabChange = (newTab)=>{ setTab(newTab); setScreen('home'); };

  const handleSend = async(data)=>{
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await addComplaint({gtype:data.gtype.label,severity:data.gtype.severity,station:data.station,area:data.area,note:data.note,lat:data.lat,lng:data.lng,photoURL:data.photoURL});
      const finalTicketId=`SR-${Math.floor(100000+Math.random()*900000)}`;
      setTicket(finalTicketId);
      setSentData(data);
      setMyReports(prev=>[{id:finalTicketId,gtype:data.gtype.label,area:data.area,photoURL:data.photoURL,station:{name:data.station},status:'NEW',reportedAt:new Date(),lat:parseFloat(data.lat),lng:parseFloat(data.lng)},...prev]);
      setLiveToast(`Report ${finalTicketId} submitted!`);
      setScreen('success');
    } catch(err) {
      console.error('Portal submit error:',err);
      alert('Submission failed. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = ()=>{
    if (screen==='camera') return <CameraScreen onCapture={(url,g)=>{setPhotoURL(url);setGps(g);setScreen('picker');}} onBack={()=>setScreen('home')}/>;
    if (screen==='picker') return <PickerScreen photoURL={photoURL} onSelect={g=>{setGtype(g);setScreen('confirm');}} onBack={()=>setScreen('camera')}/>;
    if (screen==='confirm'&&gtype) return <ConfirmScreen photoURL={photoURL} gtype={gtype} gps={gps} onSend={handleSend} onBack={()=>setScreen('picker')} isSubmitting={isSubmitting}/>;
    if (screen==='success'&&ticket&&sentData) return <SuccessScreen ticket={ticket} photoURL={photoURL} gps={gps} gtype={gtype} station={sentData.station} onDone={()=>{setScreen('home');setTab('map');}}/>;
    if (tab==='reports') return <ReportsScreen myReports={myReports} onTabChange={handleTabChange}/>;
    if (tab==='help') return <HelpScreen onTabChange={handleTabChange}/>;
    return <MapHome onReport={()=>setScreen('camera')} myReports={myReports} liveToast={liveToast} onClearToast={()=>setLiveToast(null)} onTabChange={handleTabChange}/>;
  };

  return (
    <div style={{width:'100%',maxWidth:430,margin:'0 auto',background:T.white,display:'flex',flexDirection:'column',height:'100svh',fontFamily:'DM Sans, system-ui, sans-serif',overflow:'hidden'}}>
      {renderContent()}
    </div>
  );
}