import React, { useState, useEffect } from 'react';
import { LayoutDashboard, List, Map, Building2, BarChart2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp, bus } from '../../App';
import { Sidebar } from '../../components/Sidebar';
import { Badge } from '../../components/ComplaintCard';
import { ComplaintCard, AdminComplaintModal } from '../../components/ComplaintCard';
import { KPI, ProgressBar, NotifBanner, Alert, Table } from '../../components/UI';
import LiveMap from '../../components/LiveMap';
import { STATIONS, VENDORS, STATUS_META } from '../../data/mockData';
import { timeAgo, calcResolutionRate, avgResolutionTime } from '../../utils/helpers';

/* ── DASHBOARD ── */
function Dashboard({ complaints, onSelect, onTabChange }) {
  const total = complaints.length;
  const esc   = complaints.filter(c => c.status==='ESCALATED');
  const done  = complaints.filter(c => c.status==='COMPLETED');
  return (
    <>
      <div className="page-hd"><div className="page-title">Dashboard</div><div className="page-sub">{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div></div>
      {esc.length>0 && (
        <Alert type="red" icon="⚠️">
          <strong>{esc.length} escalated</strong> — not accepted within 2 hours.{' '}
          <span style={{textDecoration:'underline',cursor:'pointer'}} onClick={()=>onTabChange('map')}>View on map →</span>
        </Alert>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:10,marginBottom:16}}>
        <KPI label="Total"     value={total}                                                      />
        <KPI label="New"       value={complaints.filter(c=>c.status==='NEW').length}       color="#E65100" />
        <KPI label="Resolved"  value={done.length}                                         color="#2E7D32" />
        <KPI label="Escalated" value={esc.length}                                          color="#B71C1C" />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14,marginBottom:16}}>
        <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:14,padding:18}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Status Overview</div>
          {['NEW','ACCEPTED','IN_PROGRESS','COMPLETED','QUERIED','ESCALATED'].map(s=>{
            const cnt=complaints.filter(c=>c.status===s).length;
            const pct=Math.round(cnt/(total||1)*100);
            const col={COMPLETED:'#2E7D32',ESCALATED:'#B71C1C',NEW:'#E65100',QUERIED:'#F57F17'}[s]||'#1565C0';
            return <div key={s} style={{marginBottom:9}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}><Badge status={s}/><span style={{fontSize:12,fontWeight:700}}>{cnt}</span></div>
              <ProgressBar value={pct} color={col}/>
            </div>;
          })}
        </div>
        <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:14,padding:18}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Station Load</div>
          {STATIONS.map(s=>{const cnt=complaints.filter(c=>c.station?.id===s.id).length;return(
            <div key={s.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #DDE3E9'}}>
              <span style={{fontSize:12,color:'#3D4F61'}}>📍 {s.name.split(' ')[0]}</span>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <div style={{width:52,height:4,background:'#ECEFF1',borderRadius:99,overflow:'hidden'}}><div style={{width:(cnt/(total||1)*100)+'%',height:'100%',background:'#1565C0'}}/></div>
                <span style={{fontSize:13,fontWeight:700}}>{cnt}</span>
              </div>
            </div>);
          })}
        </div>
      </div>
      <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Recent Complaints</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
        {complaints.slice(0,4).map(c=><ComplaintCard key={c.id} complaint={c} onClick={()=>onSelect(c)}/>)}
      </div>
    </>
  );
}

/* ── LIVE MAP TAB ── */
function LiveMapTab({ complaints, onSelect }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const filtered = statusFilter==='ALL' ? complaints : complaints.filter(c=>c.status===statusFilter);
  const withCoords = filtered.filter(c=>c.lat&&c.lng);
  return (
    <>
      <div className="page-hd"><div className="page-title">Live Map</div><div className="page-sub">{withCoords.length} complaints plotted in real-time</div></div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:12,alignItems:'center'}}>
        <span style={{fontSize:12,fontWeight:600,color:'#7A8FA6'}}>Filter:</span>
        {['ALL','NEW','ACCEPTED','IN_PROGRESS','COMPLETED','ESCALATED'].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)} style={{
            padding:'4px 11px',borderRadius:99,fontSize:11.5,fontWeight:600,cursor:'pointer',border:'1px solid #DDE3E9',
            background:statusFilter===s?'#0A1628':'#fff',color:statusFilter===s?'#fff':'#3D4F61',transition:'all .15s',
          }}>{s==='ALL'?'All':STATUS_META[s]?.dot+' '+STATUS_META[s]?.label}</button>
        ))}
      </div>
      <LiveMap complaints={withCoords} height="380px" onPinClick={onSelect}/>
      <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:14,marginTop:14,overflow:'hidden'}}>
        <div style={{padding:'10px 14px',borderBottom:'1px solid #DDE3E9',fontWeight:700,fontSize:13}}>
          Complaint List ({filtered.length})
        </div>
        <div style={{maxHeight:320,overflowY:'auto'}}>
          {filtered.map(c=>(
            <div key={c.id} onClick={()=>onSelect(c)} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 14px',borderBottom:'1px solid #DDE3E9',cursor:'pointer',transition:'background .15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='#F7F9FC'} onMouseLeave={e=>e.currentTarget.style.background=''}>
              <span style={{fontSize:20,flexShrink:0}}>{c.emoji}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.id} — {c.station?.name}</div>
                <div style={{fontSize:11,color:'#7A8FA6'}}>{c.gtype} · {timeAgo(c.reportedAt)} · {c.reportedBy}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
                <Badge status={c.status}/>
                <span style={{fontSize:10,color:'#7A8FA6'}}>{c.lat}°N</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── COMPLAINTS LIST ── */
function ComplaintsList({ complaints, onSelect }) {
  const [filter, setFilter] = useState({status:'ALL',station:'ALL',q:''});
  const filtered = complaints.filter(c=>{
    if(filter.status!=='ALL'&&c.status!==filter.status) return false;
    if(filter.station!=='ALL'&&c.station?.id!==filter.station) return false;
    if(filter.q&&!c.id.includes(filter.q.toUpperCase())&&!c.station?.name.toLowerCase().includes(filter.q.toLowerCase())) return false;
    return true;
  });
  return (
    <>
      <div className="page-hd"><div className="page-title">All Complaints</div><div className="page-sub">{filtered.length} result{filtered.length!==1?'s':''}</div></div>
      <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:12,padding:'12px 14px',marginBottom:12,display:'flex',gap:9,flexWrap:'wrap'}}>
        <input value={filter.q} onChange={e=>setFilter({...filter,q:e.target.value})} placeholder="Search ticket # or station…"
          style={{flex:1,minWidth:140,padding:'8px 11px',border:'1px solid #DDE3E9',borderRadius:8,fontSize:13,fontFamily:'inherit'}}/>
        <select value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})}
          style={{padding:'8px 11px',border:'1px solid #DDE3E9',borderRadius:8,fontSize:13,fontFamily:'inherit',background:'#fff'}}>
          <option value="ALL">All Status</option>
          {Object.entries(STATUS_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filter.station} onChange={e=>setFilter({...filter,station:e.target.value})}
          style={{padding:'8px 11px',border:'1px solid #DDE3E9',borderRadius:8,fontSize:13,fontFamily:'inherit',background:'#fff'}}>
          <option value="ALL">All Stations</option>
          {STATIONS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:12,overflow:'hidden'}}>
        <Table
          headers={['Ticket','Type','Station','Status','Vendor','Reported','']}
          rows={filtered.map(c=>({
            onClick:()=>onSelect(c),
            cells:[
              <span style={{fontFamily:'monospace',fontWeight:600,fontSize:11.5}}>{c.id}</span>,
              <span>{c.emoji} {c.gtype}</span>,
              <span style={{fontSize:12}}>{c.station?.name}</span>,
              <Badge status={c.status}/>,
              <span style={{fontSize:12}}>{c.vendor?.name}</span>,
              <span style={{fontSize:11.5,color:'#7A8FA6'}}>{timeAgo(c.reportedAt)}</span>,
              <button onClick={e=>{e.stopPropagation();onSelect(c);}} style={{padding:'4px 10px',borderRadius:7,background:'#F7F9FC',border:'1px solid #DDE3E9',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>View</button>,
            ],
          }))}
        />
      </div>
    </>
  );
}

/* ── VENDORS ── */
function VendorsPage({ complaints }) {
  return (
    <>
      <div className="page-hd"><div className="page-title">Vendors</div><div className="page-sub">Manage contractors and zone assignments</div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>
        {VENDORS.map(v=>{
          const t=complaints.filter(c=>c.vendor?.id===v.id);
          const d=t.filter(c=>c.status==='COMPLETED').length;
          const pct=Math.round(d/(t.length||1)*100);
          return <div key={v.id} style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:14,padding:18}}>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:'#1565C0',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{v.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13.5}}>{v.name}</div><div style={{fontSize:11.5,color:'#7A8FA6'}}>{v.contact} · {v.phone}</div></div>
              <span style={{background:v.active?'#E8F5E9':'#ECEFF1',color:v.active?'#2E7D32':'#546E7A',padding:'2px 9px',borderRadius:99,fontSize:11,fontWeight:700,flexShrink:0}}>{v.active?'Active':'Inactive'}</span>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
              {v.stations.map(sid=>{const st=STATIONS.find(s=>s.id===sid);return st&&<span key={sid} style={{background:'#F7F9FC',border:'1px solid #DDE3E9',borderRadius:99,fontSize:11,padding:'2px 9px'}}>📍 {st.name.split(' ')[0]}</span>;})}
            </div>
            <div style={{display:'flex',background:'#F7F9FC',borderRadius:9,overflow:'hidden',border:'1px solid #DDE3E9',marginBottom:10}}>
              {[['Tasks',t.length],['Done',d],['Rating',`⭐${v.rating}`]].map(([l,val],i)=>(
                <div key={l} style={{flex:1,padding:'9px 6px',textAlign:'center',borderRight:i<2?'1px solid #DDE3E9':'none'}}>
                  <div style={{fontSize:9.5,fontWeight:700,color:'#7A8FA6',textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>{l}</div>
                  <div style={{fontWeight:800,fontSize:17}}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:'#7A8FA6',marginBottom:3}}>Completion rate</div>
            <ProgressBar value={pct} color="#2E7D32" height={5}/>
          </div>;
        })}
      </div>
    </>
  );
}

/* ── REPORTS ── */
function ReportsPage({ complaints }) {
  const done=complaints.filter(c=>c.status==='COMPLETED');
  const rate=calcResolutionRate(complaints);
  const avg=avgResolutionTime(complaints);
  return (
    <>
      <div className="page-hd"><div className="page-title">Reports</div><div className="page-sub">Summary statistics and export</div></div>
      <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:14,padding:18,marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:14}}>Summary Report</div>
          <button style={{padding:'6px 13px',borderRadius:8,background:'#fff',border:'1px solid #DDE3E9',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:'#3D4F61'}}>⬇ Export PDF</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))',gap:10}}>
          {[['Total',complaints.length,''],['Resolved',done.length,'#2E7D32'],['Rate',rate+'%','#1565C0'],['Avg',avg+' min','']].map(([l,v,c])=>(
            <KPI key={l} label={l} value={v} color={c||'#0D1117'}/>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
        <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'10px 14px',borderBottom:'1px solid #DDE3E9',fontWeight:700,fontSize:13}}>By Station</div>
          <Table headers={['Station','Total','Done','%']} rows={STATIONS.map(s=>{
            const t=complaints.filter(c=>c.station?.id===s.id);const d=t.filter(c=>c.status==='COMPLETED');
            return{cells:[s.name.split(' ')[0],t.length,<span style={{color:'#2E7D32',fontWeight:600}}>{d.length}</span>,`${t.length?Math.round(d.length/t.length*100):0}%`]};
          })}/>
        </div>
        <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'10px 14px',borderBottom:'1px solid #DDE3E9',fontWeight:700,fontSize:13}}>By Vendor</div>
          <Table headers={['Vendor','Total','Done','Rating']} rows={VENDORS.map(v=>{
            const t=complaints.filter(c=>c.vendor?.id===v.id);const d=t.filter(c=>c.status==='COMPLETED');
            return{cells:[v.name.split(' ')[0],t.length,<span style={{color:'#2E7D32',fontWeight:600}}>{d.length}</span>,`⭐${v.rating}`]};
          })}/>
        </div>
      </div>
    </>
  );
}

/* ── MAIN ADMIN PORTAL ── */
/* ── LIVE FEED TAB ── */
function LiveFeedTab({ feed, complaints, onSelect }) {
  const recent = complaints.slice(0, 6);
  return (
    <>
      <div className="page-hd">
        <div className="page-title">⚡ Live Activity Feed</div>
        <div className="page-sub">Real-time workflow — user → vendor → cleaner → done</div>
      </div>

      {/* workflow legend */}
      <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:14,padding:'14px 18px',marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>Workflow: How a complaint flows</div>
        <div style={{display:'flex',alignItems:'center',gap:0,flexWrap:'wrap'}}>
          {[
            {step:'1',label:'User reports',sub:'Photos + GPS',color:'#E65100',bg:'#FFF3E0'},
            {step:'→',label:'',sub:'',color:'#ccc',bg:'transparent'},
            {step:'2',label:'Vendor sees it',sub:'Accepts task',color:'#1565C0',bg:'#E3F2FD'},
            {step:'→',label:'',sub:'',color:'#ccc',bg:'transparent'},
            {step:'3',label:'Cleaner assigned',sub:'Goes to spot',color:'#4527A0',bg:'#EDE7F6'},
            {step:'→',label:'',sub:'',color:'#ccc',bg:'transparent'},
            {step:'4',label:'Cleaner cleans',sub:'Takes after photo',color:'#2E7D32',bg:'#E8F5E9'},
            {step:'→',label:'',sub:'',color:'#ccc',bg:'transparent'},
            {step:'✓',label:'Admin confirms',sub:'Auto-completed',color:'#2E7D32',bg:'#E8F5E9'},
          ].map((s,i)=>(
            s.label
              ? <div key={i} style={{textAlign:'center',padding:'6px 10px',background:s.bg,borderRadius:9,margin:'2px'}}>
                  <div style={{fontSize:16,fontWeight:800,color:s.color}}>{s.step}</div>
                  <div style={{fontSize:10.5,fontWeight:700,color:s.color}}>{s.label}</div>
                  <div style={{fontSize:9.5,color:'#7A8FA6'}}>{s.sub}</div>
                </div>
              : <div key={i} style={{color:'#ccc',fontSize:20,margin:'0 2px'}}>→</div>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
        {/* Live event log */}
        <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:14,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #DDE3E9',fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#4CAF50',display:'inline-block',animation:'pulse-live 1.5s infinite'}}/>
            Live Events
            <span style={{marginLeft:'auto',fontSize:11,color:'#7A8FA6'}}>{feed.length} events</span>
          </div>
          <div style={{maxHeight:380,overflowY:'auto',padding:'0 16px'}}>
            {feed.length===0&&<div style={{padding:'24px 0',textAlign:'center',color:'#7A8FA6',fontSize:13}}>Events will appear here as users submit complaints and vendors process them.</div>}
            {feed.map(ev=><LiveFeedItem key={ev.id} event={ev}/>)}
          </div>
        </div>

        {/* Recent complaints with before/after */}
        <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:14,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #DDE3E9',fontWeight:700,fontSize:13}}>Recent Complaints</div>
          <div style={{maxHeight:380,overflowY:'auto'}}>
            {recent.map(c=>(
              <div key={c.id} onClick={()=>onSelect(c)} style={{padding:'10px 14px',borderBottom:'1px solid #DDE3E9',cursor:'pointer',transition:'background .15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#F7F9FC'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:6}}>
                  <div style={{width:40,height:40,borderRadius:8,overflow:'hidden',flexShrink:0,border:'1px solid #DDE3E9',background:'#111'}}>
                    {c.photoURL?<img src={c.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>📷</div>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontFamily:'monospace',color:'#7A8FA6'}}>{c.id}</div>
                    <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.area}</div>
                  </div>
                  <Badge status={c.status}/>
                </div>
                {/* show cleaned photo if available */}
                {c.cleanedPhotoURL&&(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:4}}>
                    <div style={{borderRadius:6,overflow:'hidden',height:50,position:'relative'}}>
                      {c.photoURL&&<img src={c.photoURL} alt="before" style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(.7)'}}/>}
                      <div style={{position:'absolute',bottom:2,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,.7)',color:'#fff',fontSize:8,fontWeight:700,padding:'1px 5px',borderRadius:4,whiteSpace:'nowrap'}}>BEFORE</div>
                    </div>
                    <div style={{borderRadius:6,overflow:'hidden',height:50,position:'relative',border:'1.5px solid #2E7D32'}}>
                      <img src={c.cleanedPhotoURL} alt="after" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      <div style={{position:'absolute',bottom:2,left:'50%',transform:'translateX(-50%)',background:'rgba(46,125,50,.9)',color:'#fff',fontSize:8,fontWeight:700,padding:'1px 5px',borderRadius:4,whiteSpace:'nowrap'}}>AFTER ✓</div>
                    </div>
                  </div>
                )}
                {c.assignedTo&&(
                  <div style={{fontSize:11,color:'#4527A0',marginTop:4,display:'flex',alignItems:'center',gap:4}}>
                    👷 Cleaner: {c.assignedTo} · {c.cleanerStatus==='DONE'?'✅ Cleaned':c.cleanerStatus==='CLEANING'?'🧹 Cleaning':'Assigned'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse-live{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}`}</style>
    </>
  );
}

// LiveFeedItem already defined above

function LiveFeedItem({ event }) {
  const icons = { NEW:'🔴', ACCEPTED:'🔵', IN_PROGRESS:'🟣', COMPLETED:'🟢', CLEANER_DONE:'✅' };
  return (
    <div style={{display:'flex',alignItems:'center',gap:9,padding:'8px 0',borderBottom:'1px solid #DDE3E9'}}>
      <span style={{fontSize:18,flexShrink:0}}>{icons[event.type]||'⚪'}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12.5,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{event.msg}</div>
        <div style={{fontSize:11,color:'#7A8FA6'}}>{event.time}</div>
      </div>
    </div>
  );
}

export default function AdminPortal() {
  const { complaints, updateComplaint } = useApp();
  const [tab,        setTab]       = useState('dashboard');
  const [selected,   setSelected]  = useState(null);
  const [notif,      setNotif]     = useState(null);
  const [liveToast,  setLiveToast] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);

  // Listen for ALL complaint events and push to activity feed
  useEffect(() => {
    const addEvent = (type, msg) => {
      const ev = { id: Date.now(), type, msg, time: new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) };
      setActivityFeed(p => [ev, ...p.slice(0,49)]);
      setLiveToast(msg);
      setTimeout(() => setLiveToast(null), 5000);
    };
    const u1 = bus.on('NEW_COMPLAINT',    c => addEvent('NEW',          `New complaint ${c.id} — ${c.area} (${c.station?.name?.split(' ')[0]})`));
    const u2 = bus.on('COMPLAINT_UPDATED', c => {
      if (c.status==='ACCEPTED')    addEvent('ACCEPTED',    `${c.id} accepted by ${c.vendor?.name}`);
      if (c.status==='IN_PROGRESS') addEvent('IN_PROGRESS', `${c.id} — cleaning in progress`);
      if (c.cleanerStatus==='DONE') addEvent('CLEANER_DONE',`${c.id} cleaned by ${c.assignedTo} ✓`);
      if (c.status==='COMPLETED')   addEvent('COMPLETED',   `${c.id} marked COMPLETED`);
    });
    return () => { u1(); u2(); };
  }, []);

  const onStatusChange = (id, status) => {
    updateComplaint(id, { status });
    if (selected?.id===id) setSelected(s=>({...s,status}));
    setNotif(`Complaint ${id} → ${STATUS_META[status]?.label||status}`);
  };
  const onReassign = (id, vendorId) => {
    const v = VENDORS.find(v=>v.id===vendorId);
    updateComplaint(id, { vendor: v, status: 'ACCEPTED' });
    setNotif(`${id} reassigned to ${v?.name}`);
  };

  const navItems = [
    { key:'dashboard',  icon:'🏠', label:'Dashboard'  },
    { key:'live',       icon:'⚡', label:'Live Feed',   count: activityFeed.filter(e=>e.type==='NEW').length > 0 ? activityFeed.filter(e=>e.type==='NEW').length : 0 },
    { key:'complaints', icon:'📋', label:'Complaints',  count: complaints.filter(c=>c.status==='NEW'||c.status==='ESCALATED').length },
    { key:'map',        icon:'🗺️', label:'Live Map'   },
    { key:'vendors',    icon:'🏢', label:'Vendors'     },
    { key:'reports',    icon:'📊', label:'Reports'     },
  ];

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'DM Sans,system-ui,sans-serif',overflow:'hidden'}}>
      <Sidebar title="Admin Control Center" subtitle="Railway Board · Nagpur" navItems={navItems} activeTab={tab} onTabChange={setTab}
        footerUser={{initials:'AD',name:'Admin Officer',role:'Railway Board',avatarColor:'#B71C1C'}}/>
      <div style={{flex:1,overflowY:'auto',background:'#F7F9FC',display:'flex',flexDirection:'column'}}>
        {/* live toast */}
        {liveToast&&(
          <div style={{background:'#0A1628',color:'#fff',padding:'10px 18px',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8,flexShrink:0,animation:'slideDown .3s ease'}}>
            <span style={{fontSize:16}}>⚡</span>{liveToast}
            <button onClick={()=>setLiveToast(null)} style={{marginLeft:'auto',background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:16}}>✕</button>
          </div>
        )}
        {notif && <NotifBanner msg={notif} type="amber" onDone={()=>setNotif(null)}/>}
        <div style={{padding:22,maxWidth:900,margin:'0 auto',width:'100%'}}>
          {tab==='dashboard'  && <Dashboard    complaints={complaints} onSelect={setSelected} onTabChange={setTab}/>}
          {tab==='live'       && <LiveFeedTab  feed={activityFeed} complaints={complaints} onSelect={setSelected}/>}
          {tab==='complaints' && <ComplaintsList complaints={complaints} onSelect={setSelected}/>}
          {tab==='map'        && <LiveMapTab    complaints={complaints} onSelect={setSelected}/>}
          {tab==='vendors'    && <VendorsPage   complaints={complaints}/>}
          {tab==='reports'    && <ReportsPage   complaints={complaints}/>}
        </div>
      </div>
      {selected && <AdminComplaintModal complaint={selected} onClose={()=>setSelected(null)} onStatusChange={onStatusChange} onReassign={onReassign}/>}
      <style>{`
        .page-hd{margin-bottom:18px}.page-title{font-size:18px;font-weight:800;color:#0D1117;margin-bottom:2px}.page-sub{font-size:12px;color:#7A8FA6}
        @keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:639px){.sidebar{display:none}}
      `}</style>
    </div>
  );
}