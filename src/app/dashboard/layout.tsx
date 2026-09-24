import React from 'react';
import SidebarNav from './SidebarNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <SidebarNav />

      {/* ── Main ── */}
      <main className="dashboard-main">
        <div style={{ width: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
