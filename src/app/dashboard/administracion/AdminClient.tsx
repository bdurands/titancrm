'use client'

import React, { useState, useMemo } from 'react';

type PedidoMini = {
  id_pedido: number;
  fecha_entrega: Date | null;
  fecha: Date;
  total_cobrar: number;
  tipo_pago: string;
}

export default function AdminClient({ pedidos }: { pedidos: PedidoMini[] }) {
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const { dataPorDia, totales } = useMemo(() => {
    const mapaDias: Record<string, any> = {};
    const totales = { total: 0, efectivo: 0, transferencia: 0, yape: 0, plin: 0 };

    pedidos.forEach(p => {
      const pDate = p.fecha_entrega ? new Date(p.fecha_entrega) : new Date(p.fecha);
      
      let incluir = true;
      if (filterStartDate) {
        const [y, m, d] = filterStartDate.split('-');
        const sDate = new Date(Number(y), Number(m)-1, Number(d));
        sDate.setHours(0,0,0,0);
        if (pDate < sDate) incluir = false;
      }
      if (filterEndDate) {
        const [y, m, d] = filterEndDate.split('-');
        const eDate = new Date(Number(y), Number(m)-1, Number(d));
        eDate.setHours(23,59,59,999);
        if (pDate > eDate) incluir = false;
      }

      if (!incluir) return;

      const fechaStr = pDate.toLocaleDateString();
      if (!mapaDias[fechaStr]) {
        mapaDias[fechaStr] = {
          fechaStr,
          fechaObj: pDate,
          total: 0,
          efectivo: 0,
          transferencia: 0,
          yape: 0,
          plin: 0,
          pedidos: 0
        };
      }

      const m = mapaDias[fechaStr];
      const monto = p.total_cobrar;
      m.total += monto;
      m.pedidos += 1;
      
      totales.total += monto;

      if (p.tipo_pago === 'Efectivo') { m.efectivo += monto; totales.efectivo += monto; }
      else if (p.tipo_pago === 'Transferencia') { m.transferencia += monto; totales.transferencia += monto; }
      else if (p.tipo_pago === 'Yape') { m.yape += monto; totales.yape += monto; }
      else if (p.tipo_pago === 'Plin') { m.plin += monto; totales.plin += monto; }
    });

    const listaDias = Object.values(mapaDias).sort((a, b) => b.fechaObj.getTime() - a.fechaObj.getTime());

    return { dataPorDia: listaDias, totales };
  }, [pedidos, filterStartDate, filterEndDate]);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)' }}>Administración Financiera</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Análisis de ingresos por medios de pago (Solo pedidos Entregados).</p>
      </div>

      <div className="pro-card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Desde</label>
          <input type="date" className="pro-input" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Hasta</label>
          <input type="date" className="pro-input" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="pro-btn-secondary" onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem' }}>Limpiar Filtros</button>
        </div>
      </div>

      {/* Global Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="pro-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Ingreso Total</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0.5rem 0' }}>S/ {totales.total.toFixed(2)}</p>
        </div>
        <div className="pro-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Efectivo (Sobres)</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0.5rem 0' }}>S/ {totales.efectivo.toFixed(2)}</p>
        </div>
        <div className="pro-card" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Transferencia</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0.5rem 0' }}>S/ {totales.transferencia.toFixed(2)}</p>
        </div>
        <div className="pro-card" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Billeteras (Yape/Plin)</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0.5rem 0' }}>S/ {(totales.yape + totales.plin).toFixed(2)}</p>
        </div>
      </div>

      <div className="pro-card">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)' }}>Desglose por Día</h2>
        </div>
        <table className="pro-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Total Recaudado</th>
              <th>Efectivo</th>
              <th>Transferencia</th>
              <th>Yape</th>
              <th>Plin</th>
              <th>N° Pedidos</th>
            </tr>
          </thead>
          <tbody>
            {dataPorDia.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay datos financieros para este rango de fechas.
                </td>
              </tr>
            ) : (
              dataPorDia.map((dia: any) => (
                <tr key={dia.fechaStr}>
                  <td style={{ fontWeight: 600 }}>{dia.fechaStr}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>S/ {dia.total.toFixed(2)}</td>
                  <td style={{ color: '#10b981', fontWeight: 500 }}>S/ {dia.efectivo.toFixed(2)}</td>
                  <td style={{ color: '#3b82f6', fontWeight: 500 }}>S/ {dia.transferencia.toFixed(2)}</td>
                  <td style={{ color: '#8b5cf6', fontWeight: 500 }}>S/ {dia.yape.toFixed(2)}</td>
                  <td style={{ color: '#ec4899', fontWeight: 500 }}>S/ {dia.plin.toFixed(2)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{dia.pedidos}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
