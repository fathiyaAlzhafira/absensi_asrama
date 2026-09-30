import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useSidebar } from '../../context/SidebarContext';

export default function MainLayout() {
  const { isOpen } = useSidebar();

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        marginLeft: isOpen ? '240px' : '72px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: isOpen ? 'calc(100% - 240px)' : 'calc(100% - 72px)'
      }}>
        <Topbar />
        <main className="main-content" style={{ marginLeft: 0, padding: '32px', flex: 1, maxWidth: '1600px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
