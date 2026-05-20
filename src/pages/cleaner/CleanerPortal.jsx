// mkdir -p /home/claude/grwms/src/pages/cleaner
// cat > /home/claude/grwms/src/pages/cleaner/CleanerPortal.jsx << 'CLEANEREOF'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp, bus } from '../../App';
import LiveMap from '../../components/LiveMap';
import { timeAgo } from '../../utils/helpers';
import {
  Camera, MapPin, CheckCircle2, Clock, Navigation2,
  X, RotateCcw, ZoomIn, Bell, Trash2, Recycle,
  Package, FlaskConical, Droplets, Image, AlertTriangle, ChevronLeft
} from 'lucide-react';

const C = {
  navy:'#0A1628',blue:'#1565C0',blueL:'#E3F2FD',green:'#2E7D32',greenL:'#E8F5E9',
  red:'#B71C1C',redL:'#FFEBEE',amber:'#E65100',amberL:'#FFF3E0',purple:'#4527A0',purpleL:'#EDE7F6',
  gray:'#546E7A',grayL:'#ECEFF1',text:'#0D1117',text2:'#3D4F61',text3:'#7A8FA6',
  white:'#fff',surface:'#F7F9FC',border:'#DDE3E9',
};

const GTYPE_ICONS = {
  'Plastic Waste':Trash2,'Food Waste':Package,'Abandoned Item':Package,
  'Chemical Spill':FlaskConical,'Recyclable Waste':Recycle,'Sewage / Water':Droplets,
};

// Simulated cleaner login — in production this would be OTP
const CLEANER_ME = { id:'c1', name:'Dinesh Rao', vendorId:'v1', area:'Platform 1–3' };

/* ─── TOP BAR ─── */
const TopBar = ({title,onBack,right}) => (
  <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderBottom:`1px solid ${C.border}`,background:C.white,flexShrink:0}}>
    {onBack&&<button onClick={onBack} style={{width:34,height:34,borderRadius:'50%',background:C.surface,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><ChevronLeft size={18} color={C.text2}/></button>}
    <span style={{fontSize:15,fontWeight:700,flex:1,color:C.text}}>{title}</span>
    {right}
  </div>
);

/* ─── STATUS CHIP ─── */
const CleanerStatusChip = ({ status }) => {
  const m = {
    ASSIGNED:{ bg:C.amberL,  color:C.amber,  label:'Assigned'  },
    CLEANING:{ bg:C.purpleL, color:C.purple, label:'Cleaning'  },
    DONE:    { bg:C.greenL,  color:C.green,  label:'Cleaned ✓' },
  }[status] || { bg:C.grayL, color:C.gray, label:'Pending' };
  return <span style={{background:m.bg,color:m.color,padding:'3px 9px',borderRadius:99,fontSize:10.5,fontWeight:700}}>{m.label}</span>;
};

/* ─── CAMERA FOR CLEANED PHOTO ─── */
function CleanedCamera({ onCapture, onBack }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready,  setReady]  = useState(false);
  const [err,    setErr]    = useState(null);
  const [facing, setFacing] = useState('environment');
  const [flash,  setFlash]  = useState(false);

  const startCam = useCallback(async (f) => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
      const s = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:f, width:{ideal:1920}, height:{ideal:1080} }, audio:false });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject=s; await videoRef.current.play(); setReady(true); setErr(null); }
    } catch(e) {
      setErr(e.name==='NotAllowedError'?'Camera permission denied.':'Camera not available.');
    }
  },[]);

  useEffect(()=>{ startCam(facing); return()=>{ if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop()); }; },[]);

  const shoot = () => {
    if(!ready||!canvasRef.current||!videoRef.current) return;
    setFlash(true); setTimeout(()=>setFlash(false),180);
    const v=videoRef.current,c=canvasRef.current;
    c.width=v.videoWidth||1280; c.height=v.videoHeight||720;
    const ctx=c.getContext('2d');
    if(facing==='user'){ctx.translate(c.width,0);ctx.scale(-1,1);}
    ctx.drawImage(v,0,0,c.width,c.height);
    const url=c.toDataURL('image/jpeg',0.88);
    if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
    onCapture(url);
  };

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,background:'#000',overflow:'hidden'}}>
      <canvas ref={canvasRef} style={{display:'none'}}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',position:'absolute',top:0,left:0,right:0,zIndex:10,background:'linear-gradient(to bottom,rgba(0,0,0,.65),transparent)'}}>
        <button onClick={onBack} style={{width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.5)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><X size={18} color="#fff"/></button>
        <div style={{background:'rgba(46,125,50,.85)',padding:'5px 13px',borderRadius:99,fontSize:11,fontWeight:600,color:'#fff',display:'flex',alignItems:'center',gap:5}}>
          <Camera size={12}/> Take "After Cleaning" photo
        </div>
        <button onClick={()=>{const n=facing==='environment'?'user':'environment';setFacing(n);setReady(false);startCam(n);}} style={{width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.5)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <RotateCcw size={16} color="#fff"/>
        </button>
      </div>

      <div style={{flex:1,position:'relative',overflow:'hidden',minHeight:280}}>
        {flash&&<div style={{position:'absolute',inset:0,background:'#fff',zIndex:20,opacity:.85}}/>}
        {err?(
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:24}}>
            <AlertTriangle size={38} color={C.amber}/>
            <div style={{color:'#fff',textAlign:'center',fontSize:13}}>{err}</div>
          </div>
        ):(
          <video ref={videoRef} playsInline muted style={{width:'100%',height:'100%',objectFit:'cover',transform:facing==='user'?'scaleX(-1)':'none'}}/>
        )}
        {/* Green overlay hint */}
        <div style={{position:'absolute',bottom:12,left:'50%',transform:'translateX(-50%)',background:'rgba(46,125,50,.85)',color:'#fff',padding:'5px 14px',borderRadius:99,fontSize:11,fontWeight:600,whiteSpace:'nowrap',display:'flex',gap:6,alignItems:'center'}}>
          <CheckCircle2 size={12}/> Photograph the cleaned area
        </div>
      </div>

      <div style={{background:'#111',padding:'18px 24px 26px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{width:36}}/>
        <button onClick={shoot} disabled={!ready||!!err}
          style={{width:72,height:72,borderRadius:'50%',background:ready?C.white:'#555',border:'4px solid rgba(255,255,255,.3)',cursor:ready?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}
          onMouseDown={e=>e.currentTarget.style.transform='scale(.9)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
          <div style={{width:56,height:56,borderRadius:'50%',background:ready?C.green:C.gray,border:'3px solid rgba(255,255,255,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <CheckCircle2 size={26} color="#fff" strokeWidth={2.5}/>
          </div>
        </button>
        <button onClick={()=>{const n=facing==='environment'?'user':'environment';setFacing(n);setReady(false);startCam(n);}} style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.1)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <RotateCcw size={16} color="rgba(255,255,255,.7)"/>
        </button>
      </div>
    </div>
  );
}

/* ─── CONFIRM CLEANED PHOTO ─── */
function ConfirmCleaned({ complaint, cleanedPhoto, onConfirm, onRetake }) {
  const [zoom, setZoom] = useState(false);
  const TypeIcon = GTYPE_ICONS[complaint.gtype] || Trash2;
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
      <TopBar title="Confirm Completion" onBack={onRetake}/>
      <div style={{flex:1,overflowY:'auto'}}>
        {/* before / after split */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',height:160,gap:2,flexShrink:0}}>
          <div style={{position:'relative',background:'#111'}}>
            {complaint.photoURL
              ?<img src={complaint.photoURL} alt="before" style={{width:'100%',height:'100%',objectFit:'cover',opacity:.8}}/>
              :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#1a2744'}}><TypeIcon size={28} color="rgba(255,255,255,.25)"/></div>
            }
            <div style={{position:'absolute',bottom:6,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,.7)',color:'#fff',padding:'3px 9px',borderRadius:99,fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>BEFORE</div>
          </div>
          <div style={{position:'relative',background:'#111'}}>
            <img src={cleanedPhoto} alt="after" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            <div style={{position:'absolute',bottom:6,left:'50%',transform:'translateX(-50%)',background:'rgba(46,125,50,.9)',color:'#fff',padding:'3px 9px',borderRadius:99,fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>AFTER</div>
            <button onClick={()=>setZoom(true)} style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,.5)',border:'none',borderRadius:6,padding:'3px 7px',cursor:'pointer',display:'flex',alignItems:'center',gap:3,color:'#fff',fontSize:10}}><ZoomIn size={11}/></button>
          </div>
        </div>

        <div style={{padding:'14px 16px'}}>
          <div style={{background:C.greenL,border:'1px solid #C8E6C9',borderRadius:10,padding:'9px 12px',display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <CheckCircle2 size={16} color={C.green}/>
            <div>
              <div style={{fontSize:12.5,fontWeight:700,color:C.green}}>Before & After photos captured</div>
              <div style={{fontSize:11,color:C.green}}>These will be sent to the vendor and admin.</div>
            </div>
          </div>

          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'10px 13px',marginBottom:12}}>
            {[
              ['Ticket',   complaint.id],
              ['Location', complaint.area],
              ['Station',  complaint.station?.name],
              ['Type',     complaint.gtype],
            ].map(([k,v],i,a)=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
                <span style={{fontSize:12.5,color:C.text2}}>{k}</span>
                <span style={{fontSize:12.5,fontWeight:700,color:C.text}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{padding:'11px 16px 15px',borderTop:`1px solid ${C.border}`,display:'flex',gap:9,flexShrink:0,background:C.white}}>
        <button onClick={onRetake} style={{background:C.surface,color:C.text2,padding:'11px 13px',borderRadius:11,fontSize:13,fontWeight:600,border:`1px solid ${C.border}`,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
          <RotateCcw size={14}/> Retake
        </button>
        <button onClick={()=>onConfirm(cleanedPhoto)} style={{flex:1,background:C.green,color:C.white,padding:'12px',borderRadius:11,fontSize:14,fontWeight:800,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:`0 2px 12px ${C.green}55`}}>
          <CheckCircle2 size={16}/> Mark as Cleaned
        </button>
      </div>

      {zoom&&(
        <div onClick={()=>setZoom(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.93)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <img src={cleanedPhoto} alt="" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',borderRadius:8}}/>
          <button onClick={()=>setZoom(false)} style={{position:'absolute',top:16,right:16,background:'rgba(255,255,255,.15)',border:'none',borderRadius:'50%',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><X size={18} color="#fff"/></button>
        </div>
      )}
    </div>
  );
}

/* ─── TASK DONE SCREEN ─── */
function TaskDoneScreen({ complaint, cleanedPhoto, onBack }) {
  const TypeIcon = GTYPE_ICONS[complaint.gtype] || Trash2;
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{position:'relative',flexShrink:0}}>
        <img src={cleanedPhoto} alt="cleaned" style={{width:'100%',height:160,objectFit:'cover',display:'block',filter:'brightness(.65)'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
          <CheckCircle2 size={48} color="#4CAF50" strokeWidth={1.5}/>
          <div style={{color:'#fff',fontSize:20,fontWeight:800}}>Area Cleaned!</div>
          <div style={{color:'rgba(255,255,255,.7)',fontSize:12}}>Vendor & Admin notified</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
        <div style={{background:C.navy,color:'#fff',borderRadius:14,padding:'13px 18px',marginBottom:13}}>
          <div style={{fontSize:9.5,opacity:.5,textTransform:'uppercase',letterSpacing:.5,fontWeight:700,marginBottom:2}}>Completed Task</div>
          <div style={{fontSize:21,fontWeight:800,fontFamily:'monospace',letterSpacing:2}}>{complaint.id}</div>
          <div style={{fontSize:10.5,opacity:.5,marginTop:3}}>Well done! Task marked as cleaned.</div>
        </div>

        {/* before/after */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:13}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:C.text3,textTransform:'uppercase',letterSpacing:.5,marginBottom:5}}>Before</div>
            <div style={{borderRadius:9,overflow:'hidden',height:100,background:C.surface,border:`1px solid ${C.border}`}}>
              {complaint.photoURL
                ?<img src={complaint.photoURL} alt="before" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><TypeIcon size={24} color={C.text3}/></div>
              }
            </div>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:C.green,textTransform:'uppercase',letterSpacing:.5,marginBottom:5}}>After ✓</div>
            <div style={{borderRadius:9,overflow:'hidden',height:100,border:`2px solid ${C.green}`}}>
              <img src={cleanedPhoto} alt="after" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
          </div>
        </div>

        <div style={{background:C.greenL,border:'1px solid #C8E6C9',borderRadius:12,padding:'10px 13px',marginBottom:14,fontSize:12.5,color:C.green,fontWeight:500,display:'flex',gap:7,alignItems:'flex-start'}}>
          <Bell size={14} style={{flexShrink:0,marginTop:1}}/> Your supervisor has been notified. Great job keeping Nagpur railways clean!
        </div>
      </div>
      <div style={{padding:'11px 16px 16px',borderTop:`1px solid ${C.border}`,flexShrink:0,background:C.white}}>
        <button onClick={onBack} style={{width:'100%',background:C.blue,color:C.white,padding:'13px',borderRadius:12,fontSize:14,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
          Back to My Tasks
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN CLEANER PORTAL ─── */
export default function CleanerPortal() {
  const { complaints, updateComplaint } = useApp();
  const [activeTask,    setActiveTask]    = useState(null); // task being cleaned
  const [screen,        setScreen]        = useState('tasks'); // tasks | camera | confirm | done
  const [cleanedPhoto,  setCleanedPhoto]  = useState(null);
  const [liveToast,     setLiveToast]     = useState(null);
  const [completedTask, setCompletedTask] = useState(null);

  // My assigned tasks
  const myTasks = complaints.filter(c =>
    c.assignedTo === CLEANER_ME.name &&
    ['ASSIGNED','CLEANING'].includes(c.cleanerStatus)
  );
  const doneTasks = complaints.filter(c =>
    c.assignedTo === CLEANER_ME.name && c.cleanerStatus === 'DONE'
  );

  // Listen for newly assigned tasks
  useEffect(() => {
    const unsub = bus.on('COMPLAINT_UPDATED', (c) => {
      if (c.assignedTo === CLEANER_ME.name && c.cleanerStatus === 'ASSIGNED') {
        setLiveToast(`New task assigned: ${c.id} — ${c.area}`);
        setTimeout(() => setLiveToast(null), 5000);
      }
    });
    return unsub;
  }, []);

  const startCleaning = (task) => {
    setActiveTask(task);
    updateComplaint(task.id, { cleanerStatus:'CLEANING', status:'IN_PROGRESS' });
    setScreen('camera');
  };

  const handleCaptured = (photoURL) => {
    setCleanedPhoto(photoURL);
    setScreen('confirm');
  };

  const handleConfirm = (photoURL) => {
    updateComplaint(activeTask.id, {
      cleanerStatus:   'DONE',
      cleanedPhotoURL: photoURL,
      status:          'COMPLETED',
    });
    setCompletedTask(activeTask);
    setScreen('done');
  };

  // ── TASK LIST ──
  if (screen === 'tasks' || (!activeTask && screen !== 'done')) {
    return (
      <div style={{minHeight:'100vh',background:C.surface,fontFamily:'DM Sans,system-ui,sans-serif'}}>
        {/* header */}
        <div style={{background:`linear-gradient(135deg,${C.navy},#1a3a6e)`,padding:'16px 18px 14px'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:2}}>
            <div style={{width:38,height:38,borderRadius:'50%',background:`linear-gradient(135deg,${C.blue},${C.purple})`,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0}}>
              {CLEANER_ME.name.split(' ').map(w=>w[0]).join('')}
            </div>
            <div>
              <div style={{color:'#fff',fontWeight:800,fontSize:16}}>{CLEANER_ME.name}</div>
              <div style={{color:'rgba(255,255,255,.55)',fontSize:11}}>Cleaner · {CLEANER_ME.area}</div>
            </div>
            <div style={{marginLeft:'auto',background:'rgba(255,255,255,.1)',padding:'4px 12px',borderRadius:8,color:'rgba(255,255,255,.7)',fontSize:11,fontWeight:600}}>
              NGP Station
            </div>
          </div>
        </div>

        {liveToast&&(
          <div style={{background:C.navy,color:'#fff',padding:'10px 16px',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8}}>
            <Bell size={14} color="#42A5F5"/>{liveToast}
            <button onClick={()=>setLiveToast(null)} style={{marginLeft:'auto',background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer'}}>✕</button>
          </div>
        )}

        <div style={{padding:'16px',maxWidth:500,margin:'0 auto'}}>
          {/* KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
            {[['Pending',myTasks.length,C.amber],['Done Today',doneTasks.length,C.green],['Total',myTasks.length+doneTasks.length,'']].map(([l,v,c])=>(
              <div key={l} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:'11px 13px'}}>
                <div style={{fontSize:10,fontWeight:700,color:C.text3,textTransform:'uppercase',letterSpacing:.5,marginBottom:4}}>{l}</div>
                <div style={{fontSize:22,fontWeight:800,color:c||C.text}}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>Assigned Tasks ({myTasks.length})</div>

          {myTasks.length===0&&(
            <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:36,textAlign:'center'}}>
              <CheckCircle2 size={36} color={C.green} style={{display:'block',margin:'0 auto 10px'}}/>
              <div style={{fontWeight:700,color:C.text,marginBottom:4}}>All clear!</div>
              <div style={{fontSize:13,color:C.text3}}>No tasks assigned yet. Your supervisor will assign tasks here.</div>
            </div>
          )}

          {myTasks.map(task=>{
            const TypeIcon = GTYPE_ICONS[task.gtype] || Trash2;
            return (
              <div key={task.id} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden',marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
                {/* photo */}
                <div style={{height:120,background:'#111',position:'relative'}}>
                  {task.photoURL
                    ?<img src={task.photoURL} alt="garbage" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#1a2744,#1565C0)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
                      <TypeIcon size={30} color="rgba(255,255,255,.25)"/>
                      <span style={{color:'rgba(255,255,255,.3)',fontSize:11}}>No photo</span>
                    </div>
                  }
                  <div style={{position:'absolute',top:8,right:8}}>
                    <CleanerStatusChip status={task.cleanerStatus||'ASSIGNED'}/>
                  </div>
                </div>
                <div style={{padding:'12px 14px'}}>
                  <div style={{fontSize:10,fontFamily:'monospace',color:C.text3,marginBottom:2}}>{task.id}</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:5,display:'flex',alignItems:'center',gap:6}}>
                    <TypeIcon size={14} color={C.blue}/> {task.area} — {task.gtype}
                  </div>
                  <div style={{fontSize:11.5,color:C.text3,marginBottom:10,display:'flex',gap:10,flexWrap:'wrap'}}>
                    <span style={{display:'flex',alignItems:'center',gap:3}}><MapPin size={11}/>{task.station?.name?.split(' ')[0]}</span>
                    <span style={{display:'flex',alignItems:'center',gap:3}}><Clock size={11}/>{timeAgo(task.reportedAt)}</span>
                  </div>
                  {/* instructions */}
                  {task.desc&&<div style={{background:C.amberL,border:'1px solid #FFE0B2',borderRadius:8,padding:'7px 10px',fontSize:12,color:C.amber,marginBottom:10}}>📋 {task.desc}</div>}
                  {/* action */}
                  <button onClick={()=>startCleaning(task)} style={{width:'100%',background:C.blue,color:C.white,padding:'11px',borderRadius:10,fontSize:14,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:`0 2px 10px ${C.blue}44`}}>
                    <Camera size={16}/> Start Cleaning & Take Photo
                  </button>
                </div>
              </div>
            );
          })}

          {/* Done tasks */}
          {doneTasks.length>0&&(
            <>
              <div style={{fontSize:13,fontWeight:700,color:C.text,margin:'20px 0 10px'}}>Completed Today ({doneTasks.length})</div>
              {doneTasks.map(task=>(
                <div key={task.id} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden',marginBottom:10,opacity:.85}}>
                  <div style={{height:80,position:'relative'}}>
                    {task.cleanedPhotoURL&&<img src={task.cleanedPhotoURL} alt="cleaned" style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(.8)'}}/>}
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <div style={{background:'rgba(46,125,50,.85)',color:'#fff',padding:'5px 14px',borderRadius:99,fontSize:11.5,fontWeight:700,display:'flex',gap:5,alignItems:'center'}}>
                        <CheckCircle2 size={13}/> Cleaned
                      </div>
                    </div>
                  </div>
                  <div style={{padding:'9px 13px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontSize:10,fontFamily:'monospace',color:C.text3}}>{task.id}</div>
                      <div style={{fontSize:13,fontWeight:600}}>{task.area}</div>
                    </div>
                    <CleanerStatusChip status="DONE"/>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── CAMERA SCREEN ──
  if (screen === 'camera' && activeTask) {
    return (
      <div style={{height:'100vh',display:'flex',flexDirection:'column',fontFamily:'DM Sans,system-ui,sans-serif',overflow:'hidden'}}>
        <CleanedCamera
          onCapture={handleCaptured}
          onBack={()=>{ setScreen('tasks'); setActiveTask(null); }}
        />
      </div>
    );
  }

  // ── CONFIRM SCREEN ──
  if (screen === 'confirm' && activeTask && cleanedPhoto) {
    return (
      <div style={{height:'100vh',display:'flex',flexDirection:'column',fontFamily:'DM Sans,system-ui,sans-serif',overflow:'hidden'}}>
        <ConfirmCleaned
          complaint={activeTask}
          cleanedPhoto={cleanedPhoto}
          onConfirm={handleConfirm}
          onRetake={()=>setScreen('camera')}
        />
      </div>
    );
  }

  // ── DONE SCREEN ──
  if (screen === 'done' && completedTask && cleanedPhoto) {
    return (
      <div style={{height:'100vh',display:'flex',flexDirection:'column',fontFamily:'DM Sans,system-ui,sans-serif',overflow:'hidden'}}>
        <TaskDoneScreen
          complaint={completedTask}
          cleanedPhoto={cleanedPhoto}
          onBack={()=>{ setScreen('tasks'); setActiveTask(null); setCleanedPhoto(null); setCompletedTask(null); }}
        />
      </div>
    );
  }

  return null;
}
// CLEANEREOF
// echo "Done"