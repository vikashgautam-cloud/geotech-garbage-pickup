import React, { useEffect, useRef } from 'react';

// Dynamically load Leaflet CSS once
let leafletLoaded = false;
function ensureLeaflet() {
  if (leafletLoaded) return;
  leafletLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

const STATUS_COLORS = {
  NEW:         '#E65100',
  ACCEPTED:    '#1565C0',
  IN_PROGRESS: '#4527A0',
  COMPLETED:   '#2E7D32',
  QUERIED:     '#F57F17',
  ESCALATED:   '#B71C1C',
  REJECTED:    '#546E7A',
};

/**
 * LiveMap — renders a Leaflet map with complaint pins.
 * Props:
 *   complaints   – array of complaint objects (need .lat .lng .status .id .gtype .station)
 *   center       – [lat, lng] default center
 *   zoom         – default zoom
 *   height       – CSS height string
 *   onPinClick   – (complaint) => void
 *   highlightId  – id of complaint to emphasize
 *   singlePin    – if true, renders only a single animated "you are here" pin at center
 *   singleCoords – { lat, lng } for single pin mode
 */
export default function LiveMap({
  complaints = [],
  center = [22.5937, 78.9629],
  zoom = 5,
  height = '320px',
  onPinClick,
  highlightId,
  singlePin = false,
  singleCoords,
}) {
  const mapRef   = useRef(null);
  const leafRef  = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    ensureLeaflet();
    let L;
    let attempts = 0;
    const tryInit = () => {
      L = window.L;
      if (!L) {
        if (attempts++ < 30) setTimeout(tryInit, 200);
        return;
      }
      if (!mapRef.current || leafRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      leafRef.current = map;

      // Attribution small
      L.control.attribution({ prefix: '© OpenStreetMap' }).addTo(map);

      addMarkers(L, map);
    };

    // Load Leaflet JS if not present
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = tryInit;
      document.head.appendChild(script);
    } else {
      tryInit();
    }

    return () => {
      if (leafRef.current) { leafRef.current.remove(); leafRef.current = null; }
    };
  }, []);

  // Update markers when complaints change
  useEffect(() => {
    const L = window.L;
    const map = leafRef.current;
    if (!L || !map) return;
    // Clear old
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    addMarkers(L, map);
  }, [complaints, highlightId, singlePin, singleCoords]);

  function addMarkers(L, map) {
    if (singlePin && singleCoords) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:20px;height:20px;border-radius:50%;
          background:#1565C0;border:3px solid #fff;
          box-shadow:0 0 0 4px rgba(21,101,192,.35);
          animation:pulse-map 1.5s infinite;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const m = L.marker([singleCoords.lat, singleCoords.lng], { icon }).addTo(map);
      markersRef.current.push(m);
      map.setView([singleCoords.lat, singleCoords.lng], 16);
      return;
    }

    complaints.forEach(c => {
      if (!c.lat || !c.lng) return;
      const isHL = c.id === highlightId;
      const color = STATUS_COLORS[c.status] || '#546E7A';
      const size = isHL ? 18 : 13;
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};border:2.5px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,.3);
          ${isHL ? 'animation:pulse-map 1.2s infinite;' : ''}
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const m = L.marker([parseFloat(c.lat), parseFloat(c.lng)], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:DM Sans,sans-serif;min-width:170px">
            <div style="font-size:11px;font-family:monospace;color:#888;margin-bottom:3px">${c.id}</div>
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">${c.emoji} ${c.gtype}</div>
            <div style="font-size:12px;color:#555;margin-bottom:6px">📍 ${c.station?.name || ''}</div>
            <div style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;background:${color}22;color:${color}">
              ${c.status}
            </div>
          </div>
        `, { maxWidth: 220 });

      if (onPinClick) m.on('click', () => onPinClick(c));
      markersRef.current.push(m);
    });

    // Fit bounds to all markers
    if (complaints.length > 0 && !singlePin) {
      const validPts = complaints.filter(c => c.lat && c.lng);
      if (validPts.length > 1) {
        try {
          map.fitBounds(validPts.map(c => [parseFloat(c.lat), parseFloat(c.lng)]), { padding: [30, 30] });
        } catch(e) {}
      } else if (validPts.length === 1) {
        map.setView([parseFloat(validPts[0].lat), parseFloat(validPts[0].lng)], 14);
      }
    }
  }

  return (
    <>
      <style>{`
        @keyframes pulse-map {
          0%   { box-shadow: 0 0 0 0 rgba(21,101,192,.6); }
          70%  { box-shadow: 0 0 0 10px rgba(21,101,192,0); }
          100% { box-shadow: 0 0 0 0 rgba(21,101,192,0); }
        }
        .leaflet-popup-content-wrapper { border-radius: 10px !important; box-shadow: 0 4px 16px rgba(0,0,0,.15) !important; }
        .leaflet-popup-tip { background: #fff !important; }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden', border: '1px solid #DDE3E9', zIndex: 0 }} />
    </>
  );
}
