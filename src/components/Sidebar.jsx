import React from 'react';

export function Sidebar({ title, subtitle, navItems = [], activeTab, onTabChange, footerUser, t }) {
  const theme = t || {
    accent: '#1565C0',
    accentLight: '#EEF2FF',
    text: '#111827',
    text3: '#6B7280',
    surface: '#FFFFFF',
    surface2: '#F7F8FA',
    border: '#D4D8E2',
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: theme.surface,
      color: theme.text,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      boxSizing: 'border-box',
    }}>
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: theme.text }}>{title}</h3>
        <p style={{ margin: '2px 0 0 0', fontSize: 11, color: theme.text3 }}>{subtitle}</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              borderRadius: 8,
              background: activeTab === item.key ? theme.accent : 'transparent',
              color: activeTab === item.key ? '#fff' : theme.text3,
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'IBM Plex Sans, sans-serif',
            }}
          >
            <span style={{ marginRight: 8 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.count > 0 && (
              <span style={{
                fontSize: 10,
                background: '#FF1744',
                color: '#fff',
                padding: '1px 6px',
                borderRadius: 10,
              }}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {footerUser && (
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: footerUser.avatarColor || theme.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 12,
            color: '#fff',
          }}>
            {footerUser.initials}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{footerUser.name}</div>
            <div style={{ fontSize: 10, color: theme.text3 }}>{footerUser.role}</div>
          </div>
        </div>
      )}
    </div>
  );
}