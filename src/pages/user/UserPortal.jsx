// cat > /home/claude/grwms/src/pages/vendor/VendorPortal.jsx << 'VENDOREOF'
import React, { useState, useEffect } from 'react';
import { useApp, bus } from '../../App';
import { Sidebar } from '../../components/Sidebar';
import { ComplaintCard, VendorComplaintModal } from '../../components/ComplaintCard';
import { KPI, ProgressBar, NotifBanner } from '../../components/UI';
import { Badge } from '../../components/ComplaintCard';
import LiveMap from '../../components/LiveMap';
import { CLEANERS } from '../../data/mockData';
import { timeAgo, calcResolutionRate, avgResolutionTime } from '../../utils/helpers';
import {
  CheckCircle2, Navigation2, BarChart2, ListChecks, MapPin,
  UserCheck, Bell, Clock, AlertTriangle, Users
} from 'lucide-react';

const C = {
  navy:'#0A1628',blue:'#1565C0',blueL:'#E3F2FD',green:'#2E7D32',greenL:'#E8F5E9',
  red:'#B71C1C',redL:'#FFEBEE',amber:'#E65100',amberL:'#FFF3E0',purple:'#4527A0',
  gray:'#546E7A',grayL:'#ECEFF1',text:'#0D1117',text2:'#3D4F61',text3:'#7A8FA6',
  white:'#fff',surface:'#F7F9FC',border:'#DDE3E9',
};

const Btn = ({ children, onClick, color=C.blue, outline=false, sm=false, Icon, disabled=false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding:sm?'6px 11px':'8px 15px', borderRadius:9, fontSize:sm?11.5:13, fontWeight:600, cursor:disabled?'not-allowed':'pointer',
    background:disabled?C.grayL:outline?C.white:color, color:disabled?C.gray:outline?color:C.white,
    border:outline?`1px solid ${color}`:'none', transition:'all .15s',
    display:'inline-flex', alignItems:'center', gap:5, opacity:disabled?.6:1,
  }}>
    {Icon && <Icon size={sm?12:14}/>} {children}
  </button>
);

/* ─── ASSIGN CLEANER MODAL ─── */
function AssignCleanerModal({ complaint, onClose, onAssign }) {
  const myCleaners = CLEANERS.filter(c => c.vendorId === 'v1' && c.active);
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:400,padding:0}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:'20px 20px 0 0',width:'100%',maxWidth:480,padding:'0 0 24px',boxShadow:'0 -4px 30px rgba(0,0,0,.15)'}}>
        <div style={{width:36,height:4,background:C.border,borderRadius:99,margin:'10px auto 0'}}/>
        <div style={{padding:'14px 20px 12px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:15,fontWeight:800}}>Assign Cleaner</div>
            <div style={{fontSize:12,color:C.text3}}>Task: {complaint.id} — {complaint.area}</div>
          </div>
          <button onClick={onClose} style={{background:C.surface,border:'none',borderRadius:'50%',width:28,height:28,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>✕</button>
        </div>

        {/* captured complaint photo */}
        {complaint.photoURL && (
          <div style={{margin:'12px 20px 0',borderRadius:10,overflow:'hidden',height:90}}>
            <img src={complaint.photoURL} alt="complaint" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          </div>
        )}

        <div style={{padding:'12px 20px 0'}}>
          <div style={{fontSize:12,color:C.text3,marginBottom:10}}>Select an active cleaner to assign this task:</div>
          {myCleaners.map(cl=>(
            <div key={cl.id} onClick={()=>onAssign(complaint.id, cl)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'10px 13px',border:`1px solid ${C.border}`,borderRadius:10,cursor:'pointer',marginBottom:8,transition:'background .15s'}}
              onMouseEnter={e=>e.currentTarget.style.background=C.blueL}
              onMouseLeave={e=>e.currentTarget.style.background=''}>
              <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${C.blue},${C.purple})`,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>
                {cl.name.split(' ').map(w=>w[0]).join('')}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13}}>{cl.name}</div>
                <div style={{fontSize:11.5,color:C.text3}}>{cl.area} · {cl.phone}</div>
              </div>
              <UserCheck size={16} color={C.green}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── TASK INBOX ─── */
function TaskInbox({ tasks, onAction, onSelect, onAssignCleaner }) {
  const active = tasks.filter(c => !['COMPLETED','REJECTED'].includes(c.status));
  return (
    <>
      <div className="page-hd">
        <div className="page-title">My Tasks</div>
        <div className="page-sub">Nagpur Railway Stations · {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:10,marginBottom:16}}>
        <KPI label="Total"  value={tasks.length}/>
        <KPI label="New"    value={tasks.filter(c=>c.status==='NEW').length}          color={C.amber}/>
        <KPI label="Active" value={tasks.filter(c=>c.status==='IN_PROGRESS').length}  color={C.blue}/>
        <KPI label="Done"   value={tasks.filter(c=>c.status==='COMPLETED').length}    color={C.green}/>
      </div>
      {active.length===0
        ? <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:36,textAlign:'center',color:C.text3}}>🎉 All tasks completed for today!</div>
        : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
            {active.map(c=>(
              <ComplaintCard key={c.id} complaint={c} onClick={()=>onSelect(c)} actions={<>
                {c.status==='NEW'&&<Btn onClick={e=>{e.stopPropagation();onAction(c.id,'ACCEPTED');}} color={C.blue} Icon={CheckCircle2} sm>Accept</Btn>}
                {c.status==='ACCEPTED'&&!c.assignedTo&&<Btn onClick={e=>{e.stopPropagation();onAssignCleaner(c);}} color={C.purple} Icon={UserCheck} sm>Assign Cleaner</Btn>}
                {c.status==='ACCEPTED'&&c.assignedTo&&<Btn onClick={e=>{e.stopPropagation();onAction(c.id,'IN_PROGRESS');}} color={C.purple} outline sm Icon={Navigation2}>Start</Btn>}
                {c.status==='IN_PROGRESS'&&<Btn onClick={e=>{e.stopPropagation();onAction(c.id,'COMPLETED');}} color={C.green} Icon={CheckCircle2} sm>Mark Done</Btn>}
                <Btn onClick={e=>{e.stopPropagation();onSelect(c);}} outline color={C.gray} sm>Details</Btn>
              </>}/>
            ))}
          </div>
      }
    </>
  );
}

/* ─── CLEANERS TAB ─── */
function CleanersTab({ tasks }) {
  const myCleaners = CLEANERS.filter(c => c.vendorId === 'v1');
  return (
    <>
      <div className="page-hd"><div className="page-title">My Cleaners</div><div className="page-sub">Staff assigned to your zones</div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
        {myCleaners.map(cl=>{
          const assigned = tasks.filter(t=>t.assignedTo===cl.name);
          const done     = assigned.filter(t=>t.cleanerStatus==='DONE');
          return (
            <div key={cl.id} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:`linear-gradient(135deg,${C.blue},${C.purple})`,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,flexShrink:0}}>
                  {cl.name.split(' ').map(w=>w[0]).join('')}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{cl.name}</div>
                  <div style={{fontSize:12,color:C.text3}}>{cl.area}</div>
                </div>
                <span style={{background:cl.active?C.greenL:C.grayL,color:cl.active?C.green:C.gray,padding:'2px 9px',borderRadius:99,fontSize:11,fontWeight:700}}>{cl.active?'Active':'Off Duty'}</span>
              </div>
              <div style={{display:'flex',gap:0,background:C.surface,borderRadius:10,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:10}}>
                {[['Assigned',assigned.length],['Done',done.length],['Pending',assigned.length-done.length]].map(([l,v],i)=>(
                  <div key={l} style={{flex:1,padding:'9px 6px',textAlign:'center',borderRight:i<2?`1px solid ${C.border}`:'none'}}>
                    <div style={{fontSize:9.5,fontWeight:700,color:C.text3,textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>{l}</div>
                    <div style={{fontWeight:800,fontSize:18}}>{v}</div>
                  </div>
                ))}
              </div>
              {/* tasks assigned to this cleaner */}
              {assigned.slice(0,2).map(t=>(
                <div key={t.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderTop:`1px solid ${C.border}`}}>
                  <div style={{width:32,height:32,borderRadius:6,overflow:'hidden',flexShrink:0,border:`1px solid ${C.border}`,background:C.surface}}>
                    {t.photoURL?<img src={t.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>📷</div>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11.5,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.area}</div>
                    <div style={{fontSize:10.5,color:C.text3}}>{timeAgo(t.reportedAt)}</div>
                  </div>
                  <span style={{background:t.cleanerStatus==='DONE'?C.greenL:C.amberL,color:t.cleanerStatus==='DONE'?C.green:C.amber,padding:'2px 7px',borderRadius:99,fontSize:10,fontWeight:700}}>
                    {t.cleanerStatus==='DONE'?'Cleaned':t.cleanerStatus==='CLEANING'?'Cleaning':'Assigned'}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ─── TASK MAP TAB ─── */
function TaskMapTab({ tasks, onSelect }) {
  const withCoords = tasks.filter(c=>c.lat&&c.lng);
  return (
    <>
      <div className="page-hd"><div className="page-title">Task Map</div><div className="page-sub">Live Nagpur complaint locations</div></div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:10}}>
        {['NEW','ACCEPTED','IN_PROGRESS','COMPLETED'].map(s=>{
          const dots={NEW:'🔴',ACCEPTED:'🔵',IN_PROGRESS:'🟣',COMPLETED:'🟢'};
          const labels={NEW:'New',ACCEPTED:'Accepted',IN_PROGRESS:'In Progress',COMPLETED:'Done'};
          return <span key={s} style={{fontSize:11.5,background:C.white,border:`1px solid ${C.border}`,padding:'3px 10px',borderRadius:99,display:'flex',gap:4,alignItems:'center'}}>{dots[s]} {labels[s]}</span>;
        })}
      </div>
      <LiveMap complaints={withCoords} center={[21.1458,79.0882]} zoom={14} height="300px" onPinClick={onSelect}/>
      <div style={{marginTop:14,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>
        {withCoords.slice(0,4).map(c=>(
          <div key={c.id} onClick={()=>onSelect(c)} style={{display:'flex',gap:10,background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:'11px 13px',cursor:'pointer',alignItems:'center'}}
            onMouseEnter={e=>e.currentTarget.style.background=C.blueL} onMouseLeave={e=>e.currentTarget.style.background=C.white}>
            <div style={{width:40,height:40,borderRadius:8,overflow:'hidden',flexShrink:0,background:C.surface,border:`1px solid ${C.border}`}}>
              {c.photoURL?<img src={c.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<MapPin size={16} color={C.text3} style={{margin:'12px auto',display:'block'}}/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontFamily:'monospace',color:C.text3}}>{c.id}</div>
              <div style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.area} — {c.gtype}</div>
              <div style={{fontSize:11,color:C.text3,display:'flex',alignItems:'center',gap:4}}><Clock size={10}/>{timeAgo(c.reportedAt)}</div>
            </div>
            <Badge status={c.status}/>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── STATS TAB ─── */
function StatsTab({ tasks }) {
  const rate = calcResolutionRate(tasks);
  const avg  = avgResolutionTime(tasks);
  const done = tasks.filter(c=>c.status==='COMPLETED').length;
  return (
    <>
      <div className="page-hd"><div className="page-title">Statistics</div><div className="page-sub">Performance overview</div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
        <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Completion Rate</div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:80,height:80,borderRadius:'50%',background:`conic-gradient(${C.green} 0% ${rate}%,#ECEFF1 ${rate}% 100%)`,position:'relative',flexShrink:0}}>
              <div style={{position:'absolute',inset:10,borderRadius:'50%',background:C.white,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16}}>{rate}%</div>
            </div>
            <div>
              <div style={{fontSize:13,color:C.text3,marginBottom:5}}>Today</div>
              <div><span style={{color:C.green,fontWeight:700}}>{done} done</span> / {tasks.length} total</div>
              <div style={{fontSize:12,color:C.text3,marginTop:4}}>Avg: <strong>{avg} min</strong></div>
            </div>
          </div>
          <ProgressBar value={rate} color={C.green} height={6}/>
        </div>
        <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Breakdown</div>
          {['NEW','ACCEPTED','IN_PROGRESS','COMPLETED','QUERIED'].map(s=>(
            <div key={s} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.border}`}}>
              <Badge status={s}/><span style={{fontWeight:700,fontSize:14}}>{tasks.filter(c=>c.status===s).length}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── MAIN VENDOR PORTAL ─── */
export default function VendorPortal() {
  const { complaints, updateComplaint } = useApp();
  const [tab,           setTab]           = useState('tasks');
  const [selected,      setSelected]      = useState(null);
  const [assigning,     setAssigning]     = useState(null); // complaint being assigned
  const [notif,         setNotif]         = useState(null);
  const [liveToast,     setLiveToast]     = useState(null);

  const myTasks = complaints.filter(c => c.vendor?.id === 'v1');

  // Listen for new complaints from user
  useEffect(() => {
    const unsub = bus.on('NEW_COMPLAINT', (c) => {
      if (c.vendor?.id !== 'v1') return;
      setLiveToast(`🔔 New complaint: ${c.id} — ${c.area}`);
      setTimeout(() => setLiveToast(null), 5000);
    });
    return unsub;
  }, []);

  const act = (id, status) => {
    updateComplaint(id, { status });
    if (selected?.id === id) setSelected(s => ({...s, status}));
    const msgs = { ACCEPTED:'Task accepted', IN_PROGRESS:'Task started', COMPLETED:'Task completed!', QUERIED:'Query raised' };
    setNotif(msgs[status] || 'Updated');
  };

  const handleAssignCleaner = (complaintId, cleaner) => {
    updateComplaint(complaintId, {
      assignedTo:    cleaner.name,
      cleanerStatus: 'ASSIGNED',
      status:        'ACCEPTED',
    });
    setAssigning(null);
    setNotif(`Assigned to ${cleaner.name}`);
  };

  const navItems = [
    { key:'tasks',    icon:'📋', label:'Tasks',    count: myTasks.filter(c=>c.status==='NEW').length },
    { key:'cleaners', icon:'👷', label:'Cleaners'  },
    { key:'map',      icon:'🗺️', label:'Task Map'  },
    { key:'stats',    icon:'📊', label:'Stats'     },
  ];

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'DM Sans,system-ui,sans-serif',overflow:'hidden'}}>
      <Sidebar title="Nagpur CleanRail" subtitle="Vendor Portal" navItems={navItems} activeTab={tab} onTabChange={setTab}
        footerUser={{initials:'RP',name:'Ramesh Patil',role:'Vendor Manager',avatarColor:C.blue}}/>

      <div style={{flex:1,overflowY:'auto',background:C.surface,display:'flex',flexDirection:'column'}}>
        {/* live toast banner */}
        {liveToast&&(
          <div style={{background:C.navy,color:'#fff',padding:'10px 18px',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8,borderBottom:`1px solid rgba(255,255,255,.1)`,flexShrink:0}}>
            <Bell size={15} color="#42A5F5"/>{liveToast}
            <button onClick={()=>setLiveToast(null)} style={{marginLeft:'auto',background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:16}}>✕</button>
          </div>
        )}
        {notif && <NotifBanner msg={notif} type="green" onDone={()=>setNotif(null)}/>}
        <div style={{padding:22,maxWidth:900,margin:'0 auto',width:'100%'}}>
          {tab==='tasks'    && <TaskInbox tasks={myTasks} onAction={act} onSelect={setSelected} onAssignCleaner={c=>setAssigning(c)}/>}
          {tab==='cleaners' && <CleanersTab tasks={myTasks}/>}
          {tab==='map'      && <TaskMapTab  tasks={myTasks} onSelect={setSelected}/>}
          {tab==='stats'    && <StatsTab    tasks={myTasks}/>}
        </div>
      </div>

      {selected   && <VendorComplaintModal complaint={selected} onClose={()=>setSelected(null)} onAction={(id,s)=>{act(id,s);setSelected(null);}}/>}
      {assigning  && <AssignCleanerModal complaint={assigning} onClose={()=>setAssigning(null)} onAssign={handleAssignCleaner}/>}

      <style>{`
        .page-hd{margin-bottom:18px}.page-title{font-size:18px;font-weight:800;color:#0D1117;margin-bottom:2px}.page-sub{font-size:12px;color:#7A8FA6}
        @keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:639px){.sidebar{display:none}}
      `}</style>
    </div>
  );
}
// VENDOREOF
// echo "Done"