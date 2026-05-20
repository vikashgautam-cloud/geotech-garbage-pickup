// cat > /home/claude/grwms/src/App.jsx << 'EOF'
import React, { useState, createContext, useContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UserPortal    from './pages/user/UserPortal';
import VendorPortal  from './pages/vendor/VendorPortal';
import AdminPortal   from './pages/admin/AdminPortal';
import CleanerPortal from './pages/cleaner/CleanerPortal';
import { generateComplaints, STATIONS, VENDORS } from './data/mockData';

export const AppContext = createContext(null);
export function useApp() { return useContext(AppContext); }

// Simple event bus for live cross-portal notifications
class EventBus {
  constructor() { this._l = {}; }
  on(ev, fn)  { (this._l[ev] = this._l[ev] || []).push(fn); return () => this.off(ev, fn); }
  off(ev, fn) { this._l[ev] = (this._l[ev] || []).filter(f => f !== fn); }
  emit(ev, d) { (this._l[ev] || []).forEach(fn => fn(d)); }
}
export const bus = new EventBus();

const initComplaints = generateComplaints(18);

export default function App() {
  const [complaints, setComplaints] = useState(initComplaints);

  const addComplaint = useCallback((report) => {
    const station = STATIONS.find(s => s.name === report.station) || STATIONS[0];
    const vendor  = VENDORS.find(v => v.stations.includes(station.id)) || VENDORS[0];
    const newC = {
      id:             `NGP-${String(Math.floor(1000 + Math.random() * 9000))}`,
      status:         'NEW',
      cleanerStatus:  null,   // null | 'ASSIGNED' | 'CLEANING' | 'DONE'
      assignedTo:     null,   // cleaner name
      cleanedPhotoURL: null,
      station, vendor,
      gtype:          report.gtype,
      emoji:          report.emoji || '📷',
      area:           report.area || report.station,
      severity:       report.severity || 'medium',
      lat:            parseFloat(report.lat),
      lng:            parseFloat(report.lng),
      desc:           report.note || `${report.gtype} reported near ${report.station}.`,
      photoURL:       report.photoURL || null,
      reportedAt:     new Date(),
      reportedBy:     'Citizen (App)',
      resolvedAt:     null,
      resolutionMins: null,
    };
    setComplaints(p => [newC, ...p]);
    setTimeout(() => bus.emit('NEW_COMPLAINT', newC), 80);
    return newC.id;
  }, []);

  const updateComplaint = useCallback((id, changes) => {
    setComplaints(p => p.map(c => {
      if (c.id !== id) return c;
      const updated = {
        ...c, ...changes,
        resolvedAt:     changes.status === 'COMPLETED' ? new Date() : c.resolvedAt,
        resolutionMins: changes.status === 'COMPLETED' ? Math.floor(Math.random() * 80 + 20) : c.resolutionMins,
      };
      setTimeout(() => bus.emit('COMPLAINT_UPDATED', updated), 80);
      return updated;
    }));
  }, []);

  return (
    <AppContext.Provider value={{ complaints, addComplaint, updateComplaint }}>
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<UserPortal />}    />
          <Route path="/vendor"  element={<VendorPortal />}  />
          <Route path="/admin"   element={<AdminPortal />}   />
          <Route path="/cleaner" element={<CleanerPortal />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
// EOF
// echo "Done"