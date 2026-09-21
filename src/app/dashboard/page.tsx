import React from 'react';
import { PrismaClient } from '@prisma/client';
import { Banknote, PackageCheck, Building2, Truck } from 'lucide-react';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function DashboardHome() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const totalPedidosHoy = await prisma.pedido.count({
    where: { fecha: { gte: startOfDay } }
  });

  const pedidosEntregadosHoy = await prisma.pedido.findMany({
    where: {
      fecha: { gte: startOfDay },
      estado: 'entregado'
    },
    include: { producto: true }
  });

  let totalDineroHoy = 0;
  const ladrillosPorTipo: Record<string, number> = {};

  pedidosEntregadosHoy.forEach(p => {
    totalDineroHoy += Number(p.total_cobrar);
    const tipo = p.producto.tipo;
    if (!ladrillosPorTipo[tipo]) ladrillosPorTipo[tipo] = 0;
    ladrillosPorTipo[tipo] += p.cantidad;
  });

  const totalAlmacenes = await prisma.almacen.count();
  const totalCamiones  = await prisma.camion.count();

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.375rem' }}>
          {today}
        </p>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Panel de Control
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.375rem', fontSize: '0.9rem' }}>
          Resumen en tiempo real · Grupo A&S
        </p>
      </div>

      {/* ── Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>

        {/* Caja del Día */}
        <div className="metric-card metric-card-green">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="metric-label">Caja del Día</div>
              <div className="metric-value" style={{ color: '#059669' }}>
                S/ {totalDineroHoy.toFixed(2)}
              </div>
            </div>
            <div className="metric-icon metric-icon-green">
              <Banknote size={22} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <span className="metric-badge metric-badge-green">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Pedidos entregados
            </span>
          </div>
        </div>

        {/* Total Pedidos */}
        <div className="metric-card metric-card-indigo">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="metric-label">Total Pedidos Hoy</div>
              <div className="metric-value">{totalPedidosHoy}</div>
            </div>
            <div className="metric-icon metric-icon-indigo">
              <PackageCheck size={22} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <span className="metric-badge metric-badge-indigo">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6d28d9', display: 'inline-block' }}></span>
              {pedidosEntregadosHoy.length} entregados
            </span>
          </div>
        </div>

        {/* Infraestructura */}
        <div className="metric-card metric-card-sky">
          <div className="metric-label" style={{ marginBottom: '1rem' }}>Infraestructura</div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="metric-icon metric-icon-sky" style={{ width: 40, height: 40 }}>
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalAlmacenes}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Almacenes</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="metric-icon metric-icon-sky" style={{ width: 40, height: 40 }}>
                <Truck size={18} />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalCamiones}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Camiones</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Ladrillos por Tipo ── */}
      <div className="pro-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a' }}>Ladrillos Entregados Hoy</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.125rem' }}>Desglose por tipo de producto</p>
          </div>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            background: '#f1f5f9', color: '#64748b', padding: '0.3rem 0.75rem', borderRadius: '100px',
            border: '1px solid #e2e8f0'
          }}>
            Hoy
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#f1f5f9', marginBottom: '1.25rem' }} />

        {Object.keys(ladrillosPorTipo).length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem 1rem',
            background: '#f8fafc', borderRadius: '12px',
            border: '1.5px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
            <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.875rem' }}>Aún no se han entregado pedidos hoy.</p>
            <p style={{ color: '#cbd5e1', fontSize: '0.8rem', marginTop: '0.25rem' }}>Los datos se actualizan en tiempo real</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.875rem' }}>
            {Object.entries(ladrillosPorTipo).map(([tipo, cantidad]) => (
              <div key={tipo} style={{
                background: '#f8fafc',
                border: '1.5px solid #eaeff6',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                transition: 'all 0.2s',
                cursor: 'default',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#c7d2fe';
                  (e.currentTarget as HTMLDivElement).style.background = '#eef2ff';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#eaeff6';
                  (e.currentTarget as HTMLDivElement).style.background = '#f8fafc';
                }}
              >
                <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tipo}</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {cantidad}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginLeft: '0.375rem' }}>unds.</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
