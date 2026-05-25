import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../App';
import { STATIONS, GARBAGE_TYPES, AREAS } from '../../data/mockData';
import LiveMap from '../../components/LiveMap';
import {
  Camera, MapPin, Send, ChevronLeft, CheckCircle2, AlertTriangle,
  Trash2, Recycle, Package, FlaskConical, Droplets, Clock,
  Navigation, Image, X, RotateCcw, ZoomIn, Bell, Shield
} from 'lucide-react';

const C = {
  navy: '#0A1628', blue: '#1565C0', blue2: '#1976D2', blueL: '#E3F2FD',
  green: '#2E7D32', greenL: '#E8F5E9', red: '#B71C1C', redL: '#FFEBEE',
  amber: '#E65100', amberL: '#FFF3E0', gray: '#546E7A', grayL: '#ECEFF1',
  text: '#0D1117', text2: '#3D4F61', text3: '#7A8FA6',
  white: '#fff', surface: '#F7F9FC', border: '#DDE3E9',
};

const GTYPE_ICONS = {
  'Plastic Waste': Trash2, 'Food Waste': Package, 'Abandoned Item': Package,
  'Chemical Spill': FlaskConical, 'Recyclable Waste': Recycle, 'Sewage / Water': Droplets,
};

const StatusBadge = ({ status }) => {
  const map = {
    NEW: { bg: C.amberL, c: C.amber, l: 'Pending' },
    ACCEPTED: { bg: C.blueL, c: C.blue, l: 'Accepted' },
    IN_PROGRESS: { bg: '#EDE7F6', c: '#4527A0', l: 'In Progress' },
    COMPLETED: { bg: C.greenL, c: C.green, l: 'Done' },
    QUERIED: { bg: '#FFF8E1', c: '#F57F17', l: 'Queried' },
    ESCALATED: { bg: C.redL, c: C.red, l: 'Escalated' }
  };
  const m = map[status] || map.NEW;
  return <span style={{ background: m.bg, color: m.c, padding: '3px 9px', borderRadius: 99, fontSize: 10.5, fontWeight: 700 }}>{m.l}</span>;
};

const TopBar = ({ title, onBack, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: `1px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
    {onBack && <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: '50%', background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={18} color={C.text2}/></button>}
    <span style={{ fontSize: 15, fontWeight: 700, flex: 1, color: C.text }}>{title}</span>
    {right}
  </div>
);

function LiveToast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: C.navy, color: '#fff', padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,.3)', whiteSpace: 'nowrap', animation: 'slideUp .3s ease' }}>
      <Bell size={15} color="#42A5F5"/>{msg}
    </div>
  );
}

/* ─── SCREEN 1: MAP HOME ─── */
function MapHome({ onReport, myReports, liveToast }) {
  const { complaints } = useApp();
  
  // FIX: Map load hote hi world view na dikhaye, isliye default state me hi Nagpur Railway Station ke exact coordinates set kar diye hain
  const [userLocation, setUserLocation] = useState({ lat: 21.15230, lng: 79.08820 });
  const mapComplaints = complaints ? complaints.filter(c => c.lat && c.lng) : [];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => {
          // Agar user location mil jaye toh setup karega, varna Nagpur continuous focused rahega
          setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude });
        },
        err => {
          console.error("Using Nagpur Station target coordinates:", err);
          setUserLocation({ lat: 21.15230, lng: 79.08820 });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ background: `linear-gradient(135deg,${C.navy} 0%,${C.blue} 100%)`, padding: '12px 18px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 20, height: 14, borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ flex: 1, background: '#FF9933' }}/><div style={{ flex: 1, background: '#fff' }}/><div style={{ flex: 1, background: '#138808' }}/>
          </div>
          <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Indian Railways · Nagpur Division</span>
        </div>
        <div style={{ color: '#fff', fontSize: 17, fontWeight: 800, marginBottom: 1 }}>Swachh Rail — Nagpur</div>
        <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 11 }}>Report garbage near you · No login needed</div>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 200 }}>
        {userLocation ? (
          // FIX: Zoom level ko 15 se badhakar 16 kiya taaki seedhe station yards aur platforms monitor ho skein
          <LiveMap complaints={mapComplaints} center={[userLocation.lat, userLocation.lng]} zoom={16} height="100%"/>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.surface, color: C.text3, fontSize: 13, fontWeight: 600 }}>
            Synchronizing live satellite positions...
          </div>
        )}
        
        <button onClick={onReport} style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: C.blue, color: C.white, padding: '13px 26px', borderRadius: 99, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: `0 4px 20px ${C.blue}66`, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', zIndex: 500 }}>
          <Camera size={18}/> Report Garbage
        </button>

        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(10,22,40,.85)', color: '#fff', padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, zIndex: 400, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Shield size={12} color="#42A5F5"/>{mapComplaints.length} active reports
        </div>
      </div>

      <div style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: '10px 14px', maxHeight: 185, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Your Reports ({myReports.length})</div>
        {myReports.length === 0 && (
          <div style={{ fontSize: 12, color: C.text3, textAlign: 'center', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <MapPin size={13} color={C.text3}/> Tap the button above to make your first report
          </div>
        )}
        {myReports.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: `1px solid ${C.border}`, background: C.surface }}>
              {r.photoURL ? <img src={r.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Image size={14} color={C.text3}/></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.text3 }}>{String(r.id)}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.gtype} — {r.area}</div>
              <div style={{ fontSize: 11, color: C.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={10}/>
                Just now
                <MapPin size={10} style={{ marginLeft: 4 }}/>Nagpur
              </div>
            </div>
            <StatusBadge status={r.status}/>
          </div>
        ))}
      </div>

      <div style={{ background: C.white, borderTop: `1px solid ${C.border}`, display: 'flex', flexShrink: 0 }}>
        {[{ Icon: MapPin, l: 'Map', on: true }, { Icon: Image, l: 'Reports' }, { Icon: Navigation, l: 'Help' }].map(b => (
          <button key={b.l} style={{ flex: 1, padding: '9px 4px', textAlign: 'center', cursor: 'pointer', border: 'none', background: 'none' }}>
            <b.Icon size={19} color={b.on ? C.blue : C.text3} style={{ display: 'block', margin: '0 auto 2px' }}/>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: b.on ? C.blue : C.text3 }}>{b.l}</span>
          </button>
        ))}
      </div>

      {liveToast && <LiveToast msg={liveToast} onDone={() => {}}/>}
      <style>{`@keyframes slideUp{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </div>
  );
}

/* ─── SCREEN 2: CAMERA ─── */
function CameraScreen({ onCapture, onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const activeRequestRef = useRef(null);
  
  const [gps, setGps] = useState(null);
  const [camReady, setCamReady] = useState(false);
  const [camErr, setCamErr] = useState(null);
  const [facing, setFacing] = useState(
    window.location.hostname === "localhost" ? "user" : "environment"
  );
  const [flash, setFlash] = useState(false);

  const startCamera = useCallback(async (facingMode) => {
    if (activeRequestRef.current === facingMode && streamRef.current) return;
    activeRequestRef.current = facingMode;

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      
      let constraints;
      if (window.location.hostname === "localhost") {
        constraints = {
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        };
      } else {
        constraints = {
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (activeRequestRef.current !== facingMode) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      
      if (videoRef.current) { 
        videoRef.current.srcObject = stream; 
        videoRef.current.setAttribute('playsinline', true);
        
        await videoRef.current.play().catch(err => {
          if (err.name !== 'AbortError') throw err;
          console.log("Safely bypassed DOM render exception stream.");
        });
        
        setCamReady(true); 
        setCamErr(null); 
      }
    } catch(e) {
      console.error("Camera access failed:", e);
      if (facingMode === 'environment') {
        setFacing('user');
      } else {
        setCamErr('Camera hardware not responding or strictly locked by another application process.');
      }
    }
  }, []);

  useEffect(() => {
    startCamera(facing);
    
    return () => { 
      activeRequestRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [facing, startCamera]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => {
          setGps({ lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) });
        },
        err => {
          setGps({ lat: "21.15230", lng: "79.08820" });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGps({ lat: "21.15230", lng: "79.08820" });
    }
  }, []);

  const flipCamera = () => {
    if (!camReady) return;
    const next = facing === 'environment' ? 'user' : 'environment';
    setCamReady(false);
    setFacing(next);
  };

  const shoot = () => {
    if (!camReady || !canvasRef.current || !videoRef.current || !gps) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth || 640; 
    c.height = v.videoHeight || 480;
    
    const ctx = c.getContext('2d');
    if (facing === 'user') { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const dataURL = c.toDataURL('image/jpeg', 0.85);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    onCapture(dataURL, gps);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#000', overflow: 'hidden', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }}/>
      
      <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', padding: '12px 16px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, background: 'linear-gradient(to bottom,rgba(0,0,0,.65),transparent)' }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,.45)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} color="#fff"/></button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: gps ? 'rgba(46,125,50,.85)' : 'rgba(211,47,47,.85)', padding: '5px 12px', borderRadius: 99 }}>
          <MapPin size={12} color="#fff"/>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>
            {gps ? `${gps.lat}°N, ${gps.lng}°E` : 'Syncing Live Location...'}
          </span>
        </div>
       
        <button onClick={flipCamera} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,.45)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <RotateCcw size={16} color="#fff"/>
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {flash && <div style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 20, opacity: .85 }} />}
        {camErr ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
            <AlertTriangle size={40} color="#E65100"/>
            <div style={{ color: '#fff', textAlign: 'center', fontSize: 13, lineHeight: 1.6 }}>{camErr}</div>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}/>
            {[{ t: 18, l: 18, bw: '3px 0 0 3px', br: '4px 0 0 0' }, { t: 18, r: 18, bw: '3px 3px 0 0', br: '0 4px 0 0' }, { b: 18, l: 18, bw: '0 0 3px 3px', br: '0 0 0 4px' }, { b: 18, r: 18, bw: '0 3px 3px 0', br: '0 0 4px 0' }].map((g, i) => (
              <div key={i} style={{ position: 'absolute', width: 44, height: 44, borderColor: 'rgba(255,255,255,.75)', borderStyle: 'solid', borderWidth: g.bw, borderRadius: g.br, top: g.t, left: g.l, right: g.r, bottom: g.b }}/>
            ))}
          </>
        )}
      </div>

      <div style={{ background: '#111', padding: '18px 24px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ width: 36 }}/>
        <button onClick={shoot} disabled={!camReady || !gps}
          style={{ width: 72, height: 72, borderRadius: '50%', background: camReady && gps ? C.white : '#555', border: '4px solid rgba(255,255,255,.3)', cursor: camReady && gps ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: camReady && gps ? C.white : '#444', border: `3px solid ${C.border}` }}/>
        </button>
        <button onClick={flipCamera} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <RotateCcw size={17} color="rgba(255,255,255,.7)"/>
        </button>
      </div>
    </div>
  );
}

//* ─── SCREEN 3: TYPE PICKER ─── */
function PickerScreen({ photoURL, onSelect, onBack }) {
  const [sel, setSel] = useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar title="What did you photograph?" onBack={onBack}/>
      
      <div style={{ height: 110, background: '#000', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <img src={photoURL} alt="captured" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .55 }}/>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifycontent: 'center' }}>
          <div style={{ background: 'rgba(0,0,0,.6)', color: '#fff', padding: '5px 13px', borderRadius: 99, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Image size={13}/> Classify your photo
          </div>
        </div>
      </div>
      
      <div style={{ padding: '12px 16px 4px', color: C.text3, fontSize: 12, flexShrink: 0, fontWeight: 600 }}>
        Select the closest match:
      </div>
      
      {/* FIXED: Grid ko single column list me badal diya hai gap kam karke */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 16px', overflowY: 'auto', flex: 1 }}>
        {GARBAGE_TYPES.map(g => {
          const Icon = GTYPE_ICONS[g.label] || Trash2;
          const isSelected = sel === g.id;
          return (
            <div 
              key={g.id} 
              onClick={() => setSel(g.id)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isSelected ? C.blueL : C.surface, 
                border: `1.5px solid ${isSelected ? C.blue : C.border}`, 
                borderRadius: 12, 
                padding: '10px 14px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Left Side: Icon + Label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  background: isSelected ? C.white : C.grayL, 
                  padding: 6, 
                  borderRadius: 8, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Icon size={18} color={isSelected ? C.blue : C.gray}/>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? C.blue : C.text2 }}>
                  {g.label}
                </div>
              </div>

              {/* Right Side: Urgent Tag or Dot indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {g.severity === 'critical' && (
                  <span style={{ fontSize: 9, color: C.red, fontWeight: 800, background: C.redL, padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5 }}>
                    URGENT
                  </span>
                )}
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? C.blue : C.gray}`,
                  background: isSelected ? C.blue : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.white }} />}
                </div>
              </div>

            </div>
          );
        })}
      </div>
      
      <div style={{ padding: '12px 16px 16px', flexShrink: 0, background: C.white, borderTop: `1px solid ${C.border}` }}>
        <button 
          disabled={!sel} 
          onClick={() => onSelect(GARBAGE_TYPES.find(g => g.id === sel))}
          style={{ 
            width: '100%', 
            background: sel ? C.blue : C.grayL, 
            color: sel ? C.white : C.gray, 
            padding: '13px', 
            borderRadius: 12, 
            fontSize: 14.5, 
            fontWeight: 800, 
            border: 'none', 
            cursor: sel ? 'pointer' : 'not-allowed', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 8 
          }}
        >
          Continue <ChevronLeft size={18} style={{ transform: 'rotate(180deg)' }}/>
        </button>
      </div>
    </div>
  );
}
/* ─── SCREEN 4: CONFIRM ─── */
function ConfirmScreen({ photoURL, gtype, gps, onSend, onBack, isSubmitting }) {
  // FIX: Default hardcoded Delhi ki jagah hum humesha first default mock station array element ko capture karenge
  const [station, setStation] = useState(STATIONS[0]?.name || "Nagpur Railway Station");
  const [area, setArea] = useState(AREAS[0]);
  const [note, setNote] = useState('');
  const [zoom, setZoom] = useState(false);
  const Icon = GTYPE_ICONS[gtype.label] || Trash2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TopBar title="Confirm & Send" onBack={onBack}/>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ position: 'relative', background: '#000' }}>
          <img src={photoURL} alt="garbage" style={{ width: '100%', maxHeight: 210, objectFit: 'cover', display: 'block' }}/>
          <button onClick={() => setZoom(true)} style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: 8, padding: '4px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 11, fontWeight: 600 }}>
            <ZoomIn size={12}/> View full
          </button>
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,.65)', color: '#fff', padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon size={12}/> {gtype.label}
          </div>
        </div>
        <div style={{ padding: '13px 15px' }}>
          <div style={{ background: C.greenL, border: '1px solid #C8E6C9', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
            <MapPin size={15} color={C.green}/>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.green }}>Location captured — Nagpur</div>
              <div style={{ fontSize: 10.5, color: C.green, fontFamily: 'monospace' }}>{gps?.lat}°N, {gps?.lng}°E</div>
            </div>
          </div>
          <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 11, border: `1px solid ${C.border}` }}>
            <LiveMap singlePin singleCoords={gps} height="120px" zoom={16}/>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Nearest Station</label>
            {/* FIX: Dropdown select handles exact binding cleanly now */}
            <select value={station} onChange={e => setStation(e.target.value)} style={{ width: '100%', padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: 'inherit', background: C.white }}>
              {STATIONS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Exact Area</label>
            <select value={area} onChange={e => setArea(e.target.value)} style={{ width: '100%', padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: 'inherit', background: C.white }}>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>Note <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
            <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={200} placeholder="Describe what you see…"
              style={{ width: '100%', padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, minHeight: 56, resize: 'none', fontFamily: 'inherit' }}/>
          </div>
        </div>
      </div>
      <div style={{ padding: '11px 14px 15px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 9, flexShrink: 0, background: C.white }}>
        <button onClick={onBack} disabled={isSubmitting} style={{ background: C.surface, color: C.text2, padding: '11px 13px', borderRadius: 11, fontSize: 13, fontWeight: 600, border: `1px solid ${C.border}`, cursor: 'pointer' }}>Back</button>
        <button onClick={() => onSend({ gtype, station, area, note, lat: gps?.lat, lng: gps?.lng, photoURL })} disabled={isSubmitting}
          style={{ flex: 1, background: isSubmitting ? C.gray : C.blue, color: C.white, padding: '12px', borderRadius: 11, fontSize: 14, fontWeight: 800, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: `0 2px 12px ${C.blue}55` }}>
          <Send size={16}/> {isSubmitting ? 'Sending...' : 'Send Report'}
        </button>
      </div>
      {zoom && (
        <div onClick={() => setZoom(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.93)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={photoURL} alt="fullscreen" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}/>
          <button onClick={() => setZoom(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} color="#fff"/></button>
        </div>
      )}
    </div>
  );
}

/* ─── SCREEN 5: SUCCESS ─── */
function SuccessScreen({ ticket, photoURL, gps, gtype, station, onDone }) {
  const Icon = GTYPE_ICONS[gtype?.label] || Trash2;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img src={photoURL} alt="reported" style={{ width: '100%', height: 170, objectFit: 'cover', display: 'block', filter: 'brightness(.6)' }}/>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <CheckCircle2 size={48} color="#4CAF50" strokeWidth={1.5}/>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Report Sent!</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Vendor notified instantly</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
        <div style={{ background: C.navy, color: '#fff', borderRadius: 14, padding: '13px 18px', marginBottom: 13 }}>
          <div style={{ fontSize: 9.5, opacity: .5, fontWeight: 700, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 2 }}>Ticket Number</div>
          <div style={{ fontSize: 21, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2 }}>{String(ticket)}</div>
          <div style={{ fontSize: 10.5, opacity: .5, marginTop: 3 }}>Screenshot to track your complaint</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 13px', marginBottom: 11 }}>
          {[
            ['Type', <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={13}/>{gtype?.label}</span>],
            ['Station', station],
            ['GPS', `${gps?.lat}°N, ${gps?.lng}°E`],
            ['Reported', 'Just now']
          ].map(([k, v], i, a) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < a.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <span style={{ fontSize: 12.5, color: C.text2 }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text, maxWidth: 180, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 11, border: `1px solid ${C.border}` }}>
          <LiveMap singlePin singleCoords={gps} height="130px" zoom={16}/>
        </div>
      </div>
      <div style={{ padding: '11px 16px 18px', borderTop: `1px solid ${C.border}`, flexShrink: 0, background: C.white }}>
        <button onClick={onDone} style={{ width: '100%', background: C.blue, color: C.white, padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <MapPin size={16}/> Back to Map
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN USER PORTAL ─── */
export default function UserPortal() {
  const { addComplaint } = useApp();
  const [screen, setScreen] = useState('map');
  const [photoURL, setPhotoURL] = useState(null);
  const [gps, setGps] = useState(null);
  const [gtype, setGtype] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [sentData, setSentData] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async (data) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      
      const result = await addComplaint({
        gtype: data.gtype.label,
        severity: data.gtype.severity,
        station: data.station,
        area: data.area,
        note: data.note,
        lat: data.lat,
        lng: data.lng,
        photoURL: data.photoURL,
      });

      const finalTicketId = (result && typeof result !== 'object') 
        ? String(result) 
        : `SR-${Math.floor(100000 + Math.random() * 900000)}`;

      setTicket(finalTicketId);
      setSentData(data);
      
      setMyReports(p => [{
        id: finalTicketId, 
        gtype: data.gtype.label, 
        emoji: '📷',
        area: data.area, 
        photoURL: data.photoURL,
        station: { name: data.station }, 
        status: 'NEW', 
        reportedAt: new Date(),
        lat: parseFloat(data.lat), 
        lng: parseFloat(data.lng),
      }, ...p]);

      setScreen('success');
    } catch (error) {
      console.error("Critical error inside portal submit stream:", error);
      alert("Database dispatch error. Please check your network/credentials configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: C.white, display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'DM Sans,system-ui,sans-serif', overflow: 'hidden' }}>
      {screen === 'map' && <MapHome onReport={() => setScreen('camera')} myReports={myReports}/>}
      {screen === 'camera' && <CameraScreen onCapture={(url, g) => { setPhotoURL(url); setGps(g); setScreen('picker'); }} onBack={() => setScreen('map')}/>}
      {screen === 'picker' && <PickerScreen photoURL={photoURL} onSelect={g => { setGtype(g); setScreen('confirm'); }} onBack={() => setScreen('camera')}/>}
      {screen === 'confirm' && gtype && (
        <ConfirmScreen 
          photoURL={photoURL} 
          gtype={gtype} 
          gps={gps} 
          onSend={handleSend} 
          onBack={() => setScreen('picker')}
          isSubmitting={isSubmitting}
        />
      )}
      {screen === 'success' && ticket && sentData && (
        <SuccessScreen 
          ticket={ticket} 
          photoURL={photoURL} 
          gps={gps} 
          gtype={gtype} 
          station={sentData.station} 
          onDone={() => setScreen('map')}
        />
      )}
    </div>
  );
}