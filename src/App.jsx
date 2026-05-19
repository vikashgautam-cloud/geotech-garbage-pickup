import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UserPortal   from './pages/user/UserPortal';
import VendorPortal from './pages/vendor/VendorPortal';
import AdminPortal  from './pages/admin/AdminPortal';
import { generateComplaints, STATIONS, VENDORS } from './data/mockData';

export const AppContext = createContext(null);
export function useApp() { return useContext(AppContext); }

const initComplaints = generateComplaints(22);

export default function App() {
  const [complaints, setComplaints] = useState(initComplaints);

  const addComplaint = (report) => {
    const newC = {
      id:           `TKT-${String(Math.floor(1000 + Math.random() * 9000))}`,
      status:       'NEW',
      station:      STATIONS.find(s => s.name === report.station) || STATIONS[0],
      vendor:       VENDORS[0],
      gtype:        report.gtype,
      emoji:        report.emoji,
      area:         report.area || 'Platform Area',
      severity:     report.severity || 'medium',
      lat:          parseFloat(report.lat),
      lng:          parseFloat(report.lng),
      desc:         report.note || `${report.gtype} reported.`,
      reportedAt:   new Date(),
      reportedBy:   'Citizen (App)',
      resolvedAt:   null,
      resolutionMins: null,
    };
    setComplaints(p => [newC, ...p]);
    return newC.id;
  };

  const updateComplaint = (id, changes) => {
    setComplaints(p => p.map(c => c.id === id
      ? { ...c, ...changes,
          resolvedAt: changes.status === 'COMPLETED' ? new Date() : c.resolvedAt,
          resolutionMins: changes.status === 'COMPLETED' ? Math.floor(Math.random() * 80 + 20) : c.resolutionMins }
      : c
    ));
  };

  return (
    <AppContext.Provider value={{ complaints, addComplaint, updateComplaint }}>
      <BrowserRouter>
        <Routes>
          <Route path="/"       element={<UserPortal />} />
          <Route path="/vendor" element={<VendorPortal />} />
          <Route path="/admin"  element={<AdminPortal />} />
          <Route path="*"       element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
