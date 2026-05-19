import React from 'react';

export function Sidebar({ title, subtitle, navItems, activeTab, onTabChange, footerUser }) {
  return (
    <div style={{
      width: 220, background: '#112240', display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,.07)', flexShrink: 0, height: '100%',
    }}>
      <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{title}</div>
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11 }}>{subtitle}</div>
      </div>

      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {navItems.map(n => (
          <button key={n.key}
            onClick={() => onTabChange(n.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 9,
              color: activeTab === n.key ? '#fff' : 'rgba(255,255,255,.5)',
              background: activeTab === n.key ? 'rgba(255,255,255,.1)' : 'none',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: 'none', width: '100%', textAlign: 'left',
              marginBottom: 2, transition: 'all .15s',
            }}
            onMouseEnter={e => { if (activeTab !== n.key) e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
            onMouseLeave={e => { if (activeTab !== n.key) e.currentTarget.style.background = 'none'; }}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>{n.icon}</span>
            {n.label}
            {n.count > 0 && (
              <span style={{
                marginLeft: 'auto', background: '#B71C1C', color: '#fff',
                fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
              }}>{n.count}</span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: footerUser.avatarColor || '#1565C0',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>{footerUser.initials}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.8)' }}>{footerUser.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>{footerUser.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
