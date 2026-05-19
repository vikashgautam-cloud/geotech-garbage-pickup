export function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function randomCoords(base) {
  return {
    lat: (base.lat + (Math.random() - 0.5) * 0.005).toFixed(4),
    lng: (base.lng + (Math.random() - 0.5) * 0.005).toFixed(4),
  };
}

export function getVendorForStation(vendors, stationId) {
  return vendors.find(v => v.stations.includes(stationId)) || vendors[0];
}

export function calcResolutionRate(complaints) {
  if (!complaints.length) return 0;
  const done = complaints.filter(c => c.status === 'COMPLETED').length;
  return Math.round((done / complaints.length) * 100);
}

export function avgResolutionTime(complaints) {
  const done = complaints.filter(c => c.resolutionMins);
  if (!done.length) return 0;
  return Math.round(done.reduce((s, c) => s + c.resolutionMins, 0) / done.length);
}
