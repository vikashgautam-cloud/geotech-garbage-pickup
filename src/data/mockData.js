// ─── MOCK DATA ───────────────────────────────────────────────────────────────

export const STATIONS = [
  { id: 's1', name: 'New Delhi Railway Station', code: 'NDLS', zone: 'Northern Railway', lat: 28.6419, lng: 77.2194 },
  { id: 's2', name: 'Mumbai CST', code: 'CSMT', zone: 'Central Railway', lat: 18.9398, lng: 72.8354 },
  { id: 's3', name: 'Chennai Central', code: 'MAS', zone: 'Southern Railway', lat: 13.0827, lng: 80.2707 },
  { id: 's4', name: 'Howrah Station', code: 'HWH', zone: 'Eastern Railway', lat: 22.5839, lng: 88.3422 },
  { id: 's5', name: 'Bangalore City Junction', code: 'SBC', zone: 'South Western Railway', lat: 12.9784, lng: 77.5724 },
];

export const VENDORS = [
  { id: 'v1', name: 'CleanRail Pvt Ltd', contact: 'Rajesh Kumar', phone: '98123-45670', email: 'rajesh@cleanrail.in', stations: ['s1', 's2'], active: true, rating: 4.2, tasksCompleted: 1284 },
  { id: 'v2', name: 'Swachh Bharat Services', contact: 'Priya Sharma', phone: '98234-56781', email: 'priya@swachhbharat.in', stations: ['s3'], active: true, rating: 4.7, tasksCompleted: 892 },
  { id: 'v3', name: 'GreenTrack Solutions', contact: 'Amit Patel', phone: '98345-67892', email: 'amit@greentrack.in', stations: ['s4', 's5'], active: true, rating: 3.9, tasksCompleted: 673 },
];

export const GARBAGE_TYPES = [
  { id: 'g1', emoji: '🗑️', label: 'Plastic Waste', severity: 'medium' },
  { id: 'g2', emoji: '🍱', label: 'Food Waste', severity: 'high' },
  { id: 'g3', emoji: '📦', label: 'Abandoned Item', severity: 'low' },
  { id: 'g4', emoji: '🧴', label: 'Chemical Spill', severity: 'critical' },
  { id: 'g5', emoji: '♻️', label: 'Recyclable', severity: 'low' },
  { id: 'g6', emoji: '💧', label: 'Sewage / Water', severity: 'critical' },
];

export const AREAS = ['Platform 1', 'Platform 3', 'Platform 5', 'Waiting Area', 'Parking Lot', 'Footbridge', 'Ticket Counter', 'Track Area', 'Food Court', 'Toilet Block', 'Entry Gate', 'Exit Gate'];

export const STATUS_META = {
  NEW:         { dot: '🔴', color: '#E65100', bg: '#FFF3E0', label: 'New' },
  ACCEPTED:    { dot: '🔵', color: '#1565C0', bg: '#E3F2FD', label: 'Accepted' },
  IN_PROGRESS: { dot: '🟣', color: '#4527A0', bg: '#EDE7F6', label: 'In Progress' },
  COMPLETED:   { dot: '🟢', color: '#2E7D32', bg: '#E8F5E9', label: 'Completed' },
  QUERIED:     { dot: '🟡', color: '#F57F17', bg: '#FFF8E1', label: 'Queried' },
  ESCALATED:   { dot: '🔴', color: '#B71C1C', bg: '#FFEBEE', label: 'Escalated ⚠️' },
  REJECTED:    { dot: '⚫', color: '#546E7A', bg: '#ECEFF1', label: 'Rejected' },
};

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function generateComplaints(count = 22) {
  const statuses = ['NEW', 'NEW', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'ESCALATED', 'QUERIED'];
  return Array.from({ length: count }, (_, i) => {
    const station = STATIONS[i % STATIONS.length];
    const vendor  = VENDORS[i % VENDORS.length];
    const status  = rand(statuses);
    const gtype   = rand(GARBAGE_TYPES);
    const hrs     = Math.floor(Math.random() * 40);
    return {
      id: `TKT-${String(i + 1).padStart(4, '0')}`,
      station, vendor, status,
      area:       rand(AREAS),
      gtype:      gtype.label,
      emoji:      gtype.emoji,
      severity:   gtype.severity,
      lat:        (station.lat + (Math.random() - 0.5) * 0.01).toFixed(4),
      lng:        (station.lng + (Math.random() - 0.5) * 0.01).toFixed(4),
      desc:       `${gtype.label} spotted near ${rand(AREAS)}. Needs immediate attention.`,
      reportedAt: new Date(Date.now() - hrs * 3_600_000),
      reportedBy: ['Rahul S.', 'Meena D.', 'Arun K.', 'Sunita P.', 'Vikram R.'][i % 5],
      resolvedAt: status === 'COMPLETED' ? new Date(Date.now() - Math.floor(Math.random() * 2 + 0.5) * 3_600_000) : null,
      resolutionMins: status === 'COMPLETED' ? Math.floor(Math.random() * 90 + 20) : null,
    };
  });
}
// cat >> /home/claude/grwms/src/data/mockData.js << 'EOF'

// ─── CLEANERS (assigned under vendors) ────────────────────────────────────
export const CLEANERS = [
  { id: 'c1', name: 'Dinesh Rao',    phone: '94501-11223', vendorId: 'v1', area: 'Platform 1–3',   active: true  },
  { id: 'c2', name: 'Anjali Meshram',phone: '94502-22334', vendorId: 'v1', area: 'Waiting Hall',   active: true  },
  { id: 'c3', name: 'Santosh Nagre', phone: '94503-33445', vendorId: 'v2', area: 'Platform 4–5',   active: true  },
  { id: 'c4', name: 'Rekha Borde',   phone: '94504-44556', vendorId: 'v2', area: 'Food Court Area', active: false },
  { id: 'c5', name: 'Vikram Kamble', phone: '94505-55667', vendorId: 'v3', area: 'Wardha Zone',    active: true  },
];
// EOF
