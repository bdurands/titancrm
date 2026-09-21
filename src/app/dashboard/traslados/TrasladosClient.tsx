'use client'

import React, { useState } from 'react';
import { createTraslado, recibirTraslado } from './actions';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Rel = { id: string; nombre?: string; nombres_apellidos?: string; tipo?: string; es_planta_choque?: boolean };
type Traslado = {
  id_traslado: string;
  fecha: Date;
  cantidad: number;
  estado: string;
  origen: Rel;
  destino: Rel;
  producto: Rel;
  conductor: Rel;
};

export default function TrasladosClient({ initialTraslados, almacenes, productos, conductores }: any) {
  const [traslados, setTraslados] = useState<Traslado[]>(initialTraslados);
  const [filter, setFilter] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterProductoId, setFilterProductoId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    origen_id: '',
    destino_id: '',
    producto_id: '',
    cantidad: '',
    conductor_id: ''
  });

  const filteredTraslados = traslados.filter(t => {
    const matchesText = t.origen.nombre?.toLowerCase().includes(filter.toLowerCase()) || 
                        t.destino.nombre?.toLowerCase().includes(filter.toLowerCase()) ||
                        t.conductor.nombres_apellidos?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesProducto = filterProductoId === '' || t.producto.id === filterProductoId;
    
    let matchesDate = true;
    const tDate = new Date(t.fecha);
    
    if (filterStartDate) {
      const [year, month, day] = filterStartDate.split('-');
      const sDate = new Date(Number(year), Number(month) - 1, Number(day));
      sDate.setHours(0,0,0,0);
      if (tDate < sDate) matchesDate = false;
    }
    if (filterEndDate) {
      const [year, month, day] = filterEndDate.split('-');
      const eDate = new Date(Number(year), Number(month) - 1, Number(day));
      eDate.setHours(23,59,59,999);
      if (tDate > eDate) matchesDate = false;
    }
    
    return matchesText && matchesProducto && matchesDate;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    
    const res = await createTraslado(data);
    if ('success' in res && res.success) {
      window.location.reload(); 
    } else if ('error' in res) {
      alert(res.error);
      setLoading(false);
    }
  };

  const handleRecibir = async (id: string) => {
    if (!confirm('¿Confirmas que el traslado llegó al almacén de destino? El stock será actualizado automáticamente.')) return;
    
    const res = await recibirTraslado(id);
    if ('success' in res && res.success) {
      window.location.reload();
    } else if ('error' in res) {
      alert(res.error);
    }
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Traslados');

    sheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Origen', key: 'origen', width: 25 },
      { header: 'Destino', key: 'destino', width: 25 },
      { header: 'Producto', key: 'producto', width: 20 },
      { header: 'Cant.', key: 'cantidad', width: 12 },
      { header: 'Conductor', key: 'conductor', width: 25 },
      { header: 'Estado', key: 'estado', width: 15 },
    ];

    filteredTraslados.forEach(t => {
      sheet.addRow({
        fecha: new Date(t.fecha).toLocaleDateString(),
        origen: t.origen.nombre,
        destino: t.destino.nombre,
        producto: t.producto.tipo,
        cantidad: t.cantidad,
        conductor: t.conductor.nombres_apellidos,
        estado: t.estado
      });
    });

    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell(cell => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const { saveAs } = (await import('file-saver')).default;
    saveAs(new Blob([buffer]), 'Traslados_A&S.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Historial de Traslados - Grupo A&S', 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 22);
    
    const tableData = filteredTraslados.map(t => [
      new Date(t.fecha).toLocaleDateString(),
      t.origen.nombre || '',
      t.destino.nombre || '',
      t.producto.tipo || '',
      t.cantidad.toString(),
      t.conductor.nombres_apellidos || '',
      t.estado
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Fecha', 'Origen', 'Destino', 'Producto', 'Cant.', 'Conductor', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] }
    });

    doc.save('Traslados_A&S.pdf');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)' }}>Traslados Internos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Mueve inventario desde Planta de Choque a los almacenes.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportExcel} className="pro-btn-secondary" style={{ padding: '0.625rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', background: '#10b981', color: 'white', border: 'none' }}>
            Excel
          </button>
          <button onClick={exportPDF} className="pro-btn-secondary" style={{ padding: '0.625rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', background: '#ef4444', color: 'white', border: 'none' }}>
            PDF
          </button>
          <button onClick={() => setIsAdding(!isAdding)} className="pro-btn">
            + Nuevo Traslado
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="pro-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Registrar Nuevo Traslado</h2>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Origen</label>
              <select className="pro-input" value={formData.origen_id} onChange={e => setFormData({...formData, origen_id: e.target.value})} required>
                <option value="">Seleccione Origen</option>
                {almacenes.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.nombre} {a.es_planta_choque ? '(Planta)' : ''}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Destino</label>
              <select className="pro-input" value={formData.destino_id} onChange={e => setFormData({...formData, destino_id: e.target.value})} required>
                <option value="">Seleccione Destino</option>
                {almacenes.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Producto</label>
              <select className="pro-input" value={formData.producto_id} onChange={e => setFormData({...formData, producto_id: e.target.value})} required>
                <option value="">Seleccione Ladrillo</option>
                {productos.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Cantidad (Unidades)</label>
              <input type="number" min="1" className="pro-input" placeholder="Ej. 5000" value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Conductor Encargado</label>
              <select className="pro-input" value={formData.conductor_id} onChange={e => setFormData({...formData, conductor_id: e.target.value})} required>
                <option value="">Seleccione Conductor</option>
                {conductores.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombres_apellidos}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <button type="submit" className="pro-btn" disabled={loading}>
                {loading ? 'Procesando...' : 'Iniciar Traslado'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="pro-card">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Desde</label>
              <input type="date" className="pro-input" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Hasta</label>
              <input type="date" className="pro-input" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Tipo Ladrillo</label>
              <select className="pro-input" value={filterProductoId} onChange={e => setFilterProductoId(e.target.value)}>
                <option value="">Todos</option>
                {productos.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.tipo}</option>
                ))}
              </select>
            </div>
          </div>

          <input 
            type="text" 
            className="pro-input" 
            placeholder="Buscar por almacén o conductor..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <table className="pro-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Origen → Destino</th>
              <th>Ladrillo (Cant.)</th>
              <th>Conductor</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredTraslados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay traslados registrados.
                </td>
              </tr>
            ) : (
              filteredTraslados.map(t => (
                <tr key={t.id_traslado}>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(t.fecha).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>
                    {t.origen.nombre} <span style={{ color: 'var(--text-muted)', margin: '0 0.5rem' }}>→</span> {t.destino.nombre}
                  </td>
                  <td>{t.producto.tipo} <span style={{ fontWeight: 600 }}>({t.cantidad})</span></td>
                  <td>{t.conductor.nombres_apellidos}</td>
                  <td>
                    {t.estado === 'En tránsito' ? (
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>En tránsito</span>
                    ) : (
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>Recibido</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {t.estado === 'En tránsito' && (
                      <button 
                        onClick={() => handleRecibir(t.id_traslado)}
                        style={{ background: 'var(--primary)', border: 'none', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, fontSize: '0.75rem' }}
                      >
                        Marcar Recibido
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
