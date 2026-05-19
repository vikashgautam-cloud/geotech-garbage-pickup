import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../App';
import { STATIONS, GARBAGE_TYPES } from '../../data/mockData';
import LiveMap from '../../components/LiveMap';
import { timeAgo } from '../../utils/helpers';
import {
  Camera, MapPin, Send, ChevronLeft, CheckCircle2, AlertTriangle,
  Trash2, Recycle, Package, FlaskConical, Droplets, Zap,
  Clock, Navigation, Image, X, RotateCcw, ZoomIn
} from 'lucide-react';

/* ── design tokens ── */
const C = {
  navy: '#0A1628', blue: '#1565C0', blue2: '#1976D2', blueL: '#E3F2FD',
  green: '#2E7D32', greenL: '#E8F5E9', red: '#B71C1C', redL: '#FFEBEE',
  amber: '#E65100', amberL: '#FFF3E0', gray: '#546E7A', grayL: '#ECEFF1',
  text: '#0D1117', text2: '#3D4F61', text3: '#7A8FA6',
  white: '#fff', surface: '#F7F9FC', border: '#DDE3E9',
};

const GTYPE_ICONS = { 'Plastic Waste': Trash2, 'Food Waste': Package, 'Abandoned Item': Package, 'Chemical Spill': FlaskConical, 'Recyclable': Recycle, 'Sewage / Water': Droplets };

/* ── reusable ── */
const TopBar = ({ title, onBack, right }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderBottom:`1px solid ${C.border}`, background:C.white, flexShrink:0 }}>
    {onBack && (
      <button onClick={onBack} style={{ width:34, height:34, borderRadius:'50%', background:C.surface, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
        <ChevronLeft size={18} color={C.text2}/>
      </button>
    )}
    <span style={{ fontSize:15, fontWeight:700, flex:1, color:C.text }}>{title}</span>
    {right}
  </div>
);

const PrimaryBtn = ({ children, onClick, disabled, icon: Icon, color=C.blue }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width:'100%', background:disabled?C.grayL:color, color:disabled?C.gray:C.white,
    padding:'14px', borderRadius:12, fontSize:15, fontWeight:700,
    border:'none', cursor:disabled?'not-allowed':'pointer',
    display:'flex', alignItems:'center', justifyContent:'center', gap:9,
    transition:'all .15s', boxShadow:disabled?'none':`0 2px 12px ${color}55`,
  }}>
    {Icon && <Icon size={18}/>}
    {children}
  </button>
);

const StatusBadge = ({ status }) => {
  const map = {
    NEW:{ bg:C.amberL, color:C.amber, label:'Pending' },
    ACCEPTED:{ bg:C.blueL, color:C.blue, label:'Accepted' },
    IN_PROGRESS:{ bg:'#EDE7F6', color:'#4527A0', label:'In Progress' },
    COMPLETED:{ bg:C.greenL, color:C.green, label:'Done' },
    QUERIED:{ bg:'#FFF8E1', color:'#F57F17', label:'Queried' },
    ESCALATED:{ bg:C.redL, color:C.red, label:'Escalated' },
  };
  const m = map[status] || map.NEW;
  return <span style={{ background:m.bg, color:m.color, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700 }}>{m.label}</span>;
};

/* ═══ SCREEN 1: MAP HOME ═══ */
function MapHome({ onReport, myReports }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* header */}
      <div style={{ background:`linear-gradient(135deg,${C.navy} 0%,${C.blue} 100%)`, padding:'14px 18px 12px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <div style={{ width:22, height:15, borderRadius:2, overflow:'hidden', display:'flex', flexDirection:'column', flexShrink:0 }}>
            <div style={{ flex:1, background:'#FF9933' }}/><div style={{ flex:1, background:'#fff' }}/><div style={{ flex:1, background:'#138808' }}/>
          </div>
          <span style={{ color:'rgba(255,255,255,.65)', fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>Indian Railways · Swachh Rail</span>
        </div>
        <div style={{ color:'#fff', fontSize:18, fontWeight:800, marginBottom:2 }}>Spot garbage? Report instantly.</div>
        <div style={{ color:'rgba(255,255,255,.55)', fontSize:11.5 }}>No login needed · GPS auto-captured</div>
      </div>

      {/* live map */}
      <div style={{ flex:1, position:'relative', minHeight:200 }}>
        <LiveMap complaints={myReports} center={[28.6139,77.2090]} zoom={12} height="100%"/>
        <button onClick={onReport} style={{
          position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)',
          background:C.blue, color:C.white, padding:'13px 28px',
          borderRadius:99, fontWeight:800, fontSize:15, border:'none',
          cursor:'pointer', boxShadow:`0 4px 20px ${C.blue}66`,
          display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap', zIndex:500,
        }}>
          <Camera size={20}/> Report Garbage
        </button>
      </div>

      {/* recent strip */}
      <div style={{ background:C.white, borderTop:`1px solid ${C.border}`, padding:'12px 16px', maxHeight:190, overflowY:'auto', flexShrink:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:8 }}>
          Your Reports ({myReports.length})
        </div>
        {myReports.length===0 && (
          <div style={{ fontSize:12, color:C.text3, textAlign:'center', padding:'10px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <MapPin size={14} color={C.text3}/> Tap the button to make your first report
          </div>
        )}
        {myReports.map(r=>(
          <div key={r.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
            {/* thumbnail */}
            <div style={{ width:42, height:42, borderRadius:8, overflow:'hidden', flexShrink:0, border:`1px solid ${C.border}`, background:C.surface }}>
              {r.photoURL
                ? <img src={r.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Image size={16} color={C.text3}/></div>
              }
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:10, fontFamily:'monospace', color:C.text3 }}>{r.id}</div>
              <div style={{ fontSize:12.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.gtype} — {r.area}</div>
              <div style={{ fontSize:11, color:C.text3, display:'flex', alignItems:'center', gap:4 }}>
                <Clock size={10}/> {timeAgo(r.reportedAt)}
                <MapPin size={10} style={{marginLeft:4}}/> {r.station?.name?.split(' ')[0]}
              </div>
            </div>
            <StatusBadge status={r.status}/>
          </div>
        ))}
      </div>

      {/* bottom nav */}
      <div style={{ background:C.white, borderTop:`1px solid ${C.border}`, display:'flex', flexShrink:0 }}>
        {[{Icon:MapPin,l:'Map',on:true},{Icon:Image,l:'Reports'},{Icon:Navigation,l:'Help'}].map(b=>(
          <button key={b.l} style={{ flex:1, padding:'9px 4px', textAlign:'center', cursor:'pointer', border:'none', background:'none' }}>
            <b.Icon size={20} color={b.on?C.blue:C.text3} style={{ display:'block', margin:'0 auto 2px' }}/>
            <span style={{ fontSize:9.5, fontWeight:700, color:b.on?C.blue:C.text3 }}>{b.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══ SCREEN 2: CAMERA ═══ */
function CameraScreen({ onCapture, onBack }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const [gps,      setGps]      = useState(null);
  const [camReady, setCamReady] = useState(false);
  const [camErr,   setCamErr]   = useState(null);
  const [facing,   setFacing]   = useState('environment'); // rear camera default
  const [flash,    setFlash]    = useState(false);

  // Start camera
  const startCamera = useCallback(async (facingMode) => {
    try {
      if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width:{ ideal:1920 }, height:{ ideal:1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCamReady(true);
        setCamErr(null);
      }
    } catch(e) {
      setCamErr(e.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : 'Camera not available on this device or browser.');
    }
  }, []);

  useEffect(() => {
    startCamera(facing);
    // GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setGps({ lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) }),
        () => setGps({ lat:'28.63150', lng:'77.21670' }), // demo fallback
        { timeout:6000 }
      );
    } else {
      setGps({ lat:'28.63150', lng:'77.21670' });
    }
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop()); };
  }, []);

  const flipCamera = async () => {
    const next = facing==='environment'?'user':'environment';
    setFacing(next);
    await startCamera(next);
  };

  const shoot = () => {
    if (!camReady || !canvasRef.current || !videoRef.current) return;
    setFlash(true);
    setTimeout(()=>setFlash(false), 180);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    // Mirror if selfie
    if (facing==='user') { ctx.translate(canvas.width,0); ctx.scale(-1,1); }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL('image/jpeg', 0.88);
    // Stop camera
    if (streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
    onCapture(dataURL, gps);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, background:'#000', overflow:'hidden' }}>
      <canvas ref={canvasRef} style={{ display:'none' }}/>

      {/* top controls */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', position:'absolute', top:0, left:0, right:0, zIndex:10, background:'linear-gradient(to bottom,rgba(0,0,0,.6),transparent)' }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,.4)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <X size={18} color="#fff"/>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:gps?'rgba(46,125,50,.8)':'rgba(21,101,192,.8)', padding:'5px 12px', borderRadius:99 }}>
          <MapPin size={13} color="#fff"/>
          <span style={{ fontSize:11, fontWeight:600, color:'#fff' }}>{gps ? `${gps.lat}°N` : 'Getting GPS…'}</span>
        </div>
        <button onClick={flipCamera} style={{ width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,.4)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <RotateCcw size={16} color="#fff"/>
        </button>
      </div>

      {/* viewfinder */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        {/* flash overlay */}
        {flash && <div style={{ position:'absolute', inset:0, background:'#fff', zIndex:20, opacity:.8, transition:'opacity .15s' }}/>}

        {camErr ? (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:12 }}>
            <AlertTriangle size={40} color="#E65100"/>
            <div style={{ color:'#fff', textAlign:'center', fontSize:14, lineHeight:1.6 }}>{camErr}</div>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', transform: facing==='user'?'scaleX(-1)':'none' }}/>
            {/* corner guides */}
            {[{t:16,l:16,bt:'3px 0 0 3px',br:'4px 0 0 0'},{t:16,r:16,bt:'3px 3px 0 0',br:'0 4px 0 0'},{b:16,l:16,bt:'0 0 3px 3px',br:'0 0 0 4px'},{b:16,r:16,bt:'0 3px 3px 0',br:'0 0 4px 0'}].map((g,i)=>(
              <div key={i} style={{ position:'absolute', width:44, height:44, borderColor:'rgba(255,255,255,.75)', borderStyle:'solid', borderWidth:g.bt, borderRadius:g.br, top:g.t, left:g.l, right:g.r, bottom:g.b }}/>
            ))}
          </>
        )}

        {/* mini GPS map preview bottom-left */}
        {gps && (
          <div style={{ position:'absolute', bottom:12, left:12, width:110, height:80, borderRadius:8, overflow:'hidden', border:'2px solid rgba(255,255,255,.4)', zIndex:5 }}>
            <LiveMap singlePin singleCoords={gps} height="80px" zoom={15}/>
          </div>
        )}
      </div>

      {/* shutter bar */}
      <div style={{ background:'#111', padding:'20px 24px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ width:36 }}/>
        {/* shutter */}
        <button onClick={shoot} disabled={!camReady || !!camErr}
          style={{ width:72, height:72, borderRadius:'50%', background:C.white, border:`4px solid rgba(255,255,255,.35)`, cursor:camReady?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform .1s', padding:0 }}
          onMouseDown={e=>e.currentTarget.style.transform='scale(.9)'}
          onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
        >
          <div style={{ width:56, height:56, borderRadius:'50%', background:camReady?C.white:'#555', border:`3px solid ${C.border}` }}/>
        </button>
        <button onClick={flipCamera} style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,.1)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <RotateCcw size={18} color="rgba(255,255,255,.7)"/>
        </button>
      </div>
    </div>
  );
}

/* ═══ SCREEN 3: TYPE PICKER ═══ */
function PickerScreen({ photoURL, onSelect, onBack }) {
  const [sel, setSel] = useState(null);
  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <TopBar title="What did you photograph?" onBack={onBack}/>

      {/* captured photo strip */}
      <div style={{ height:120, background:'#000', flexShrink:0, position:'relative', overflow:'hidden' }}>
        <img src={photoURL} alt="captured" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:.6 }}/>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'rgba(0,0,0,.6)', color:'#fff', padding:'5px 12px', borderRadius:99, fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
            <Image size={13}/> Photo captured — now classify it
          </div>
        </div>
      </div>

      <div style={{ padding:'10px 14px 6px', color:C.text3, fontSize:12.5, flexShrink:0 }}>Select the closest match:</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, padding:14, overflowY:'auto', flex:1 }}>
        {GARBAGE_TYPES.map(g => {
          const Icon = GTYPE_ICONS[g.label] || Trash2;
          return (
            <div key={g.id} onClick={()=>setSel(g.id)}
              style={{ background:sel===g.id?C.blueL:C.surface, border:`2px solid ${sel===g.id?C.blue:C.border}`, borderRadius:14, padding:'14px 8px', textAlign:'center', cursor:'pointer', transition:'all .15s' }}>
              <Icon size={28} color={sel===g.id?C.blue:C.gray} style={{ margin:'0 auto 8px', display:'block' }}/>
              <div style={{ fontSize:11, fontWeight:700, color:sel===g.id?C.blue:C.text2 }}>{g.label}</div>
              {g.severity==='critical'&&<div style={{ fontSize:9, color:C.red, fontWeight:700, marginTop:2 }}>URGENT</div>}
            </div>
          );
        })}
      </div>

      <div style={{ padding:'0 14px 16px', flexShrink:0 }}>
        <PrimaryBtn disabled={!sel} onClick={()=>onSelect(GARBAGE_TYPES.find(g=>g.id===sel))} icon={ChevronLeft} color={C.blue}>
          Continue
        </PrimaryBtn>
      </div>
    </div>
  );
}

/* ═══ SCREEN 4: CONFIRM ═══ */
function ConfirmScreen({ photoURL, gtype, gps, onSend, onBack }) {
  const [station, setStation] = useState(STATIONS[0].name);
  const [note,    setNote]    = useState('');
  const [zoom,    setZoom]    = useState(false);
  const Icon = GTYPE_ICONS[gtype.label] || Trash2;

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <TopBar title="Confirm & Send" onBack={onBack}/>

      <div style={{ flex:1, overflowY:'auto' }}>
        {/* Full captured photo */}
        <div style={{ position:'relative', background:'#000' }}>
          <img src={photoURL} alt="garbage" style={{ width:'100%', maxHeight:220, objectFit:'cover', display:'block' }}/>
          <button onClick={()=>setZoom(true)} style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,.5)', border:'none', borderRadius:8, padding:'5px 9px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, color:'#fff', fontSize:11, fontWeight:600 }}>
            <ZoomIn size={13}/> View full
          </button>
          {/* type badge on photo */}
          <div style={{ position:'absolute', top:8, left:8, background:'rgba(0,0,0,.65)', color:'#fff', padding:'5px 11px', borderRadius:99, fontSize:11.5, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
            <Icon size={13}/> {gtype.label}
          </div>
        </div>

        <div style={{ padding:'14px 16px' }}>
          {/* GPS card */}
          <div style={{ background:C.greenL, border:`1px solid #C8E6C9`, borderRadius:10, padding:'9px 12px', display:'flex', alignItems:'center', gap:9, marginBottom:12 }}>
            <MapPin size={16} color={C.green}/>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:C.green }}>Location captured</div>
              <div style={{ fontSize:11, color:C.green, fontFamily:'monospace' }}>{gps?.lat}°N, {gps?.lng}°E</div>
            </div>
          </div>

          {/* mini map */}
          <div style={{ borderRadius:10, overflow:'hidden', marginBottom:12, border:`1px solid ${C.border}` }}>
            <LiveMap singlePin singleCoords={gps} height="130px" zoom={15}/>
          </div>

          {/* station */}
          <div style={{ marginBottom:10 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:.5, marginBottom:5 }}>
              Nearest Station
            </label>
            <select value={station} onChange={e=>setStation(e.target.value)}
              style={{ width:'100%', padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:9, fontSize:13, fontFamily:'inherit', background:C.white }}>
              {STATIONS.map(s=><option key={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* note */}
          <div style={{ marginBottom:10 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:.5, marginBottom:5 }}>
              Note <span style={{ textTransform:'none', fontWeight:400 }}>(optional)</span>
            </label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={200} placeholder="e.g. Near platform 3, left side…"
              style={{ width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:9, fontSize:13, minHeight:60, resize:'none', fontFamily:'inherit' }}/>
          </div>

          {gtype.severity==='critical'&&(
            <div style={{ background:C.redL, border:`1px solid #FFCDD2`, borderRadius:8, padding:'9px 12px', fontSize:12, color:C.red, fontWeight:600, display:'flex', gap:8, alignItems:'flex-start', marginBottom:10 }}>
              <AlertTriangle size={15} style={{ flexShrink:0, marginTop:1 }}/> Critical issue — will be escalated to admin immediately.
            </div>
          )}
        </div>
      </div>

      <div style={{ padding:'12px 14px 16px', borderTop:`1px solid ${C.border}`, display:'flex', gap:10, flexShrink:0, background:C.white }}>
        <button onClick={onBack} style={{ background:C.surface, color:C.text2, padding:'12px 14px', borderRadius:11, fontSize:13, fontWeight:600, border:`1px solid ${C.border}`, cursor:'pointer' }}>Back</button>
        <PrimaryBtn onClick={()=>onSend({gtype,station,note,lat:gps?.lat,lng:gps?.lng,photoURL})} icon={Send} style={{ flex:1 }}>Send Report</PrimaryBtn>
      </div>

      {/* Zoom modal */}
      {zoom && (
        <div onClick={()=>setZoom(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <img src={photoURL} alt="fullscreen" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:8 }}/>
          <button onClick={()=>setZoom(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,.15)', border:'none', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <X size={18} color="#fff"/>
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══ SCREEN 5: SUCCESS ═══ */
function SuccessScreen({ ticket, photoURL, gps, gtype, onDone }) {
  const Icon = GTYPE_ICONS[gtype?.label] || Trash2;
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* photo hero */}
      <div style={{ position:'relative', flexShrink:0 }}>
        <img src={photoURL} alt="reported" style={{ width:'100%', height:180, objectFit:'cover', display:'block', filter:'brightness(.7)' }}/>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
          <CheckCircle2 size={52} color="#4CAF50" strokeWidth={1.5}/>
          <div style={{ color:'#fff', fontSize:20, fontWeight:800 }}>Report Sent!</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 18px 0' }}>
        {/* ticket */}
        <div style={{ background:C.navy, color:'#fff', borderRadius:14, padding:'14px 20px', marginBottom:14 }}>
          <div style={{ fontSize:10, opacity:.55, fontWeight:700, letterSpacing:.5, textTransform:'uppercase', marginBottom:3 }}>Ticket Number</div>
          <div style={{ fontSize:22, fontWeight:800, fontFamily:'monospace', letterSpacing:2 }}>{ticket}</div>
          <div style={{ fontSize:11, opacity:.5, marginTop:4 }}>Screenshot this to track your complaint</div>
        </div>

        {/* details */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
            <Icon size={15} color={C.text3}/><span style={{ fontSize:13, color:C.text2 }}>Type</span>
            <span style={{ marginLeft:'auto', fontWeight:600, fontSize:13 }}>{gtype?.label}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
            <MapPin size={15} color={C.text3}/><span style={{ fontSize:13, color:C.text2 }}>Location</span>
            <span style={{ marginLeft:'auto', fontWeight:600, fontSize:11, fontFamily:'monospace' }}>{gps?.lat}°N</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0' }}>
            <Clock size={15} color={C.text3}/><span style={{ fontSize:13, color:C.text2 }}>Reported</span>
            <span style={{ marginLeft:'auto', fontWeight:600, fontSize:13 }}>Just now</span>
          </div>
        </div>

        {/* map showing where report was */}
        <div style={{ borderRadius:12, overflow:'hidden', marginBottom:12, border:`1px solid ${C.border}` }}>
          <LiveMap singlePin singleCoords={gps} height="140px" zoom={15}/>
        </div>

        <div style={{ background:C.greenL, border:`1px solid #C8E6C9`, borderRadius:12, padding:'11px 14px', marginBottom:18, fontSize:13, color:C.green, fontWeight:500, display:'flex', gap:8, alignItems:'flex-start' }}>
          <CheckCircle2 size={16} style={{ flexShrink:0, marginTop:1 }}/> You will be notified when the vendor accepts and when cleaning is complete.
        </div>
      </div>

      <div style={{ padding:'12px 18px 20px', borderTop:`1px solid ${C.border}`, flexShrink:0, background:C.white }}>
        <PrimaryBtn onClick={onDone} icon={MapPin}>Back to Map</PrimaryBtn>
      </div>
    </div>
  );
}

/* ═══ MAIN USER PORTAL ═══ */
export default function UserPortal() {
  const { addComplaint } = useApp();
  const [screen,     setScreen]     = useState('map');
  const [photoURL,   setPhotoURL]   = useState(null);
  const [gps,        setGps]        = useState(null);
  const [gtype,      setGtype]      = useState(null);
  const [ticket,     setTicket]     = useState(null);
  const [myReports,  setMyReports]  = useState([]);

  const handleCapture = (dataURL, coords) => { setPhotoURL(dataURL); setGps(coords); setScreen('picker'); };
  const handleSelect  = (g) => { setGtype(g); setScreen('confirm'); };
  const handleSend    = (data) => {
    const id = addComplaint({ ...data, gtype:data.gtype.label, emoji:'📷', severity:data.gtype.severity });
    setTicket(id);
    setMyReports(p => [{
      id, gtype:data.gtype.label, area:data.station, photoURL:data.photoURL,
      station:{ name:data.station }, status:'NEW', reportedAt:new Date(),
      lat:parseFloat(data.lat), lng:parseFloat(data.lng),
    }, ...p]);
    setScreen('success');
  };

  return (
    <div style={{ width:'100%', maxWidth:430, margin:'0 auto', background:C.white, display:'flex', flexDirection:'column', height:'100vh', fontFamily:'DM Sans,system-ui,sans-serif', overflow:'hidden' }}>
      {/* status bar */}
      <div style={{ background:'#000', padding:'7px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <span style={{ color:'#fff', fontSize:12, fontWeight:600 }}>9:41</span>
        <div style={{ color:'rgba(255,255,255,.7)', fontSize:11, display:'flex', gap:5 }}><span>●●●</span><span>WiFi</span><span>🔋</span></div>
      </div>

      {screen==='map'     && <MapHome     onReport={()=>setScreen('camera')} myReports={myReports}/>}
      {screen==='camera'  && <CameraScreen onCapture={handleCapture} onBack={()=>setScreen('map')}/>}
      {screen==='picker'  && <PickerScreen photoURL={photoURL} onSelect={handleSelect} onBack={()=>setScreen('camera')}/>}
      {screen==='confirm' && gtype && <ConfirmScreen photoURL={photoURL} gtype={gtype} gps={gps} onSend={handleSend} onBack={()=>setScreen('picker')}/>}
      {screen==='success' && ticket && <SuccessScreen ticket={ticket} photoURL={photoURL} gps={gps} gtype={gtype} onDone={()=>setScreen('map')}/>}
    </div>
  );
}
