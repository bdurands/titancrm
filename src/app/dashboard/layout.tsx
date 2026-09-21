import React from 'react';
import Link from 'next/link';
import {
  Home,
  MessageSquareText,
  Users,
  UserSquare2,
  Cuboid,
  Warehouse,
  Truck,
  Contact,
  PackageSearch,
  ArrowRightLeft,
  Wrench,
  Wallet,
  LogOut
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">Grupo A&S</div>
          <div className="sidebar-subtitle">CRM & ERP</div>
        </div>

        <nav className="sidebar-nav">
          <Link href="/dashboard" className="nav-link"><Home size={17} /> Inicio</Link>
          <Link href="/dashboard/inbox" className="nav-link nav-link-leads"><MessageSquareText size={17} /> Bandeja (Inbox)</Link>
          <Link href="/dashboard/leads" className="nav-link"><ArrowRightLeft size={17} /> Leads (Kanban)</Link>
          <Link href="/dashboard/clientes" className="nav-link"><Users size={17} /> Clientes</Link>
          <Link href="/dashboard/vendedores" className="nav-link"><UserSquare2 size={17} /> Vendedores</Link>
          <Link href="/dashboard/ladrillos" className="nav-link"><Cuboid size={17} /> Ladrillos</Link>
          <Link href="/dashboard/almacenes" className="nav-link"><Warehouse size={17} /> Almacenes</Link>
          <Link href="/dashboard/flota" className="nav-link"><Truck size={17} /> Flota (Camiones)</Link>
          <Link href="/dashboard/conductores" className="nav-link"><Contact size={17} /> Conductores</Link>
          <Link href="/dashboard/pedidos" className="nav-link"><PackageSearch size={17} /> Pedidos</Link>
          <Link href="/dashboard/traslados" className="nav-link"><ArrowRightLeft size={17} /> Traslados</Link>
          <Link href="/dashboard/mantenimiento" className="nav-link"><Wrench size={17} /> Mantenimiento</Link>

          <div className="nav-section-divider" />
          <Link href="/dashboard/administracion" className="nav-link nav-link-admin">
            <Wallet size={17} /> Administración
          </Link>
        </nav>

        <div className="sidebar-footer">
          <Link href="/login" className="nav-link nav-link-logout">
            <LogOut size={17} /> Cerrar Sesión
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{
        flex: 1,
        backgroundColor: '#f1f5f9',
        padding: '2.5rem 2.5rem',
        overflowY: 'auto',
        minHeight: '100vh',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
