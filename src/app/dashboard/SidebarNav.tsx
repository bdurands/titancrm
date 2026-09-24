'use client'

import React, { useState } from 'react';
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
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function SidebarNav() {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  return (
    <>
      {/* Botón hamburguesa - solo visible en tablet/móvil */}
      <button className="sidebar-toggle" onClick={() => setIsOpen(true)}>
        <Menu size={22} />
      </button>

      {/* Fondo oscuro cuando el sidebar está abierto */}
      {isOpen && <div className="sidebar-backdrop" onClick={close} />}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="sidebar-logo">Grupo A&S</div>
              <div className="sidebar-subtitle">CRM & ERP</div>
            </div>
            <button className="sidebar-close" onClick={close}>
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link href="/dashboard" className="nav-link" onClick={close}><Home size={17} /> Inicio</Link>
          <Link href="/dashboard/inbox" className="nav-link nav-link-leads" onClick={close}><MessageSquareText size={17} /> Bandeja (Inbox)</Link>
          <Link href="/dashboard/leads" className="nav-link" onClick={close}><ArrowRightLeft size={17} /> Leads (Kanban)</Link>
          <Link href="/dashboard/clientes" className="nav-link" onClick={close}><Users size={17} /> Clientes</Link>
          <Link href="/dashboard/vendedores" className="nav-link" onClick={close}><UserSquare2 size={17} /> Vendedores</Link>
          <Link href="/dashboard/ladrillos" className="nav-link" onClick={close}><Cuboid size={17} /> Ladrillos</Link>
          <Link href="/dashboard/almacenes" className="nav-link" onClick={close}><Warehouse size={17} /> Almacenes</Link>
          <Link href="/dashboard/flota" className="nav-link" onClick={close}><Truck size={17} /> Flota (Camiones)</Link>
          <Link href="/dashboard/conductores" className="nav-link" onClick={close}><Contact size={17} /> Conductores</Link>
          <Link href="/dashboard/pedidos" className="nav-link" onClick={close}><PackageSearch size={17} /> Pedidos</Link>
          <Link href="/dashboard/traslados" className="nav-link" onClick={close}><ArrowRightLeft size={17} /> Traslados</Link>
          <Link href="/dashboard/mantenimiento" className="nav-link" onClick={close}><Wrench size={17} /> Mantenimiento</Link>

          <div className="nav-section-divider" />
          <Link href="/dashboard/administracion" className="nav-link nav-link-admin" onClick={close}>
            <Wallet size={17} /> Administración
          </Link>
        </nav>

        <div className="sidebar-footer">
          <Link href="/login" className="nav-link nav-link-logout" onClick={close}>
            <LogOut size={17} /> Cerrar Sesión
          </Link>
        </div>
      </aside>
    </>
  );
}
