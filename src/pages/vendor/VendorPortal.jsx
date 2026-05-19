import React, { useState } from 'react';
import { CheckCircle2, Navigation2, MapPin, Clock, BarChart2, List, Map } from 'lucide-react';
import { useApp } from '../../App';
import { Sidebar } from '../../components/Sidebar';
import { Badge } from '../../components/ComplaintCard';
import { ComplaintCard, VendorComplaintModal } from '../../components/ComplaintCard';
import { KPI, ProgressBar, NotifBanner } from '../../components/UI';
import LiveMap from '../../components/LiveMap';
import { timeAgo, calcResolutionRate, avgResolutionTime } from '../../utils/helpers';

const BTN = ({ children, onClick, color='#1565C0', outline=false, small=false }) => (
  <button onClick={onClick} style={{
    padding: small?'6px 12px':'8px 15px', borderRadius:9, fontSize:small?12:13, fontWeight:600, cursor:'pointer',
    background: outline?'#fff':color, color:outline?color:'#fff',
    border: outline?`1px solid ${color}`:'none', transition:'all .15s',
    display:'inline-flex', alignItems:'center', gap:5,
  }}>{children}</button>
);

function TaskInbox({ tasks, onAction, onSelect }) {
  const active = tasks.filter(c => !['COMPLETED','REJECTED'].includes(c.status));
  return (
    <>
      <div className="page-hd">
        <div className="page-title">My Tasks</div>
        <div className="page-sub">New Delhi & Mumbai · {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:10,marginBottom:16}}>
        <KPI label="Total"  value={tasks.length} />
        <KPI label="New"    value={tasks.filter(c=>c.status==='NEW').length}         color="#E65100" />
        <KPI label="Active" value={tasks.filter(c=>c.status==='IN_PROGRESS').length} color="#1565C0" />
        <KPI label="Done"   value={tasks.filter(c=>c.status==='COMPLETED').length}   color="#2E7D32" />
      </div>
      {active.length===0
        ? <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:14,padding:36,textAlign:'center',color:'#7A8FA6'}}>🎉 All tasks done for today!</div>
        : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
            {active.map(c => (
              <ComplaintCard key={c.id} complaint={c} onClick={() => onSelect(c)} actions={<>
                {c.status==='NEW'         && <BTN onClick={e=>{e.stopPropagation();onAction(c.id,'ACCEPTED')}}  color="#1565C0">Accept</BTN>}
                {c.status==='ACCEPTED'    && <BTN onClick={e=>{e.stopPropagation();onAction(c.id,'IN_PROGRESS')}} color="#4527A0" outline>▶ Start</BTN>}
                {c.status==='IN_PROGRESS' && <BTN onClick={e=>{e.stopPropagation();onAction(c.id,'COMPLETED')}} color="#2E7D32">✓ Done</BTN>}
                <BTN onClick={e=>{e.stopPropagation();onSelect(c)}} outline color="#546E7A" small>Details →</BTN>
              </>}/>
            ))}
          </div>
      }
    </>
  );
}

function TaskMap({ tasks, onSelect }) {
  const active = tasks.filter(c => c.lat && c.lng);
  return (
    <>
      <div className="page-hd"><div className="page-title">Task Map</div><div className="page-sub">Your assigned complaints — live locations</div></div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:10}}>
        {['NEW','ACCEPTED','IN_PROGRESS','COMPLETED'].map(s => {
          const m={NEW:{dot:'🔴',label:'New'},ACCEPTED:{dot:'🔵',label:'Accepted'},IN_PROGRESS:{dot:'🟣',label:'In Progress'},COMPLETED:{dot:'🟢',label:'Done'}}[s];
          return <span key={s} style={{fontSize:11.5,background:'#fff',border:'1px solid #DDE3E9',padding:'3px 10px',borderRadius:99,display:'flex',gap:4,alignItems:'center'}}>{m.dot} {m.label}</span>;
        })}
      </div>
      <LiveMap complaints={active} height="300px" onPinClick={onSelect} />
      <div style={{marginTop:14,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>
        {active.slice(0,4).map(c=>(
          <div key={c.id} onClick={()=>onSelect(c)} style={{display:'flex',gap:10,background:'#fff',border:'1px solid #DDE3E9',borderRadius:12,padding:'11px 13px',cursor:'pointer',alignItems:'center'}}
            onMouseEnter={e=>e.currentTarget.style.background='#F0F7FF'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
            <span style={{fontSize:24,flexShrink:0}}>{c.emoji}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontFamily:'monospace',color:'#7A8FA6'}}>{c.id}</div>
              <div style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.area} — {c.gtype}</div>
              <div style={{fontSize:11,color:'#7A8FA6'}}>📍 {c.station?.name?.split(' ')[0]} · {timeAgo(c.reportedAt)}</div>
            </div>
            <Badge status={c.status}/>
          </div>
        ))}
      </div>
    </>
  );
}

function VendorStats({ tasks }) {
  const rate = calcResolutionRate(tasks);
  const avg  = avgResolutionTime(tasks);
  const done = tasks.filter(c=>c.status==='COMPLETED').length;
  return (
    <>
      <div className="page-hd"><div className="page-title">Statistics</div><div className="page-sub">Performance overview</div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
        <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:14,padding:18}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Completion Rate</div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:80,height:80,borderRadius:'50%',background:`conic-gradient(#2E7D32 0% ${rate}%,#ECEFF1 ${rate}% 100%)`,position:'relative',flexShrink:0}}>
              <div style={{position:'absolute',inset:10,borderRadius:'50%',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16}}>{rate}%</div>
            </div>
            <div>
              <div style={{fontSize:13,color:'#7A8FA6',marginBottom:5}}>Today's tasks</div>
              <div><span style={{color:'#2E7D32',fontWeight:700}}>{done} done</span> / <span style={{color:'#7A8FA6'}}>{tasks.length} total</span></div>
              <div style={{fontSize:12,color:'#7A8FA6',marginTop:4}}>Avg: <strong>{avg} min</strong></div>
            </div>
          </div>
          <ProgressBar value={rate} color="#2E7D32" height={6} />
        </div>
        <div style={{background:'#fff',border:'1px solid #DDE3E9',borderRadius:14,padding:18}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Breakdown</div>
          {['NEW','ACCEPTED','IN_PROGRESS','COMPLETED','QUERIED'].map(s=>(
            <div key={s} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #DDE3E9'}}>
              <Badge status={s}/><span style={{fontWeight:700,fontSize:14}}>{tasks.filter(c=>c.status===s).length}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function VendorPortal() {
  const { complaints, updateComplaint } = useApp();
  const [tab,      setTab]     = useState('tasks');
  const [selected, setSelected] = useState(null);
  const [notif,    setNotif]   = useState(null);

  const myTasks = complaints.filter(c => c.vendor?.id === 'v1');

  const act = (id, status) => {
    updateComplaint(id, { status });
    if (selected?.id === id) setSelected(s => ({...s, status}));
    const msgs = { ACCEPTED:'Task accepted — navigate to location', IN_PROGRESS:'Task in progress', COMPLETED:'Task marked complete!', QUERIED:'Query raised to admin' };
    setNotif(msgs[status] || 'Updated');
  };

  const navItems = [
    { key:'tasks', icon:'📋', label:'Tasks',    count: myTasks.filter(c=>c.status==='NEW').length },
    { key:'map',   icon:'🗺️', label:'Task Map' },
    { key:'done',  icon:'✅', label:'Completed' },
    { key:'stats', icon:'📊', label:'Stats'    },
  ];

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'DM Sans,system-ui,sans-serif',overflow:'hidden'}}>
      <Sidebar title="CleanRail Pvt Ltd" subtitle="Vendor Portal" navItems={navItems} activeTab={tab} onTabChange={setTab}
        footerUser={{initials:'RK',name:'Rajesh Kumar',role:'Vendor Manager',avatarColor:'#1565C0'}}/>
      <div style={{flex:1,overflowY:'auto',background:'#F7F9FC'}}>
        {notif && <NotifBanner msg={notif} type="green" onDone={()=>setNotif(null)}/>}
        <div style={{padding:22,maxWidth:900,margin:'0 auto'}}>
          {tab==='tasks' && <TaskInbox tasks={myTasks} onAction={act} onSelect={setSelected}/>}
          {tab==='map'   && <TaskMap   tasks={myTasks} onSelect={setSelected}/>}
          {tab==='done'  && <>
            <div className="page-hd"><div className="page-title">Completed</div><div className="page-sub">{myTasks.filter(c=>c.status==='COMPLETED').length} tasks done</div></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
              {myTasks.filter(c=>c.status==='COMPLETED').map(c=><ComplaintCard key={c.id} complaint={c} onClick={()=>setSelected(c)}/>)}
            </div>
          </>}
          {tab==='stats' && <VendorStats tasks={myTasks}/>}
        </div>
      </div>
      {selected && <VendorComplaintModal complaint={selected} onClose={()=>setSelected(null)} onAction={(id,s)=>{act(id,s);setSelected(null);}}/>}
      <style>{`
        .page-hd{margin-bottom:18px}.page-title{font-size:18px;font-weight:800;color:#0D1117;margin-bottom:2px}.page-sub{font-size:12px;color:#7A8FA6}
        @keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:639px){.sidebar{display:none}}
      `}</style>
    </div>
  );
}
