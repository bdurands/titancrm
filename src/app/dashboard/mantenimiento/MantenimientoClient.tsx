'use client'

import React, { useState } from 'react';
import { createMantenimiento } from './actions';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Mantenimiento = {
  id: string;
  fecha: Date;
  tipo: string;
  detalle: string;
  costo: number;
  conductor: { id: string; nombres_apellidos: string };
  camion: { id: string; placa: string; marca: string; modelo: string };
};

export default function MantenimientoClient({ initialData, conductores, camiones }: any) {
  const [data, setData] = useState<Mantenimiento[]>(initialData);
  const [filter, setFilter] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    conductor_id: '',
    camion_id: '',
    tipo: 'Mantenimiento',
    detalle: '',
    costo: ''
  });

  const filteredData = data.filter(m => {
    const matchesText = m.conductor.nombres_apellidos?.toLowerCase().includes(filter.toLowerCase()) || 
                        m.camion.placa?.toLowerCase().includes(filter.toLowerCase()) ||
                        m.tipo.toLowerCase().includes(filter.toLowerCase()) ||
                        m.detalle.toLowerCase().includes(filter.toLowerCase());
    
    let matchesDate = true;
    const mDate = new Date(m.fecha);
    
    if (filterStartDate) {
      const [year, month, day] = filterStartDate.split('-');
      const sDate = new Date(Number(year), Number(month) - 1, Number(day));
      sDate.setHours(0,0,0,0);
      if (mDate < sDate) matchesDate = false;
    }
    if (filterEndDate) {
      const [year, month, day] = filterEndDate.split('-');
      const eDate = new Date(Number(year), Number(month) - 1, Number(day));
      eDate.setHours(23,59,59,999);
      if (mDate > eDate) matchesDate = false;
    }
    
    return matchesText && matchesDate;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const d = new FormData();
    Object.entries(formData).forEach(([k, v]) => d.append(k, v));
    
    const res = await createMantenimiento(d);
    if (res.success) {
      window.location.reload(); 
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Taller');

    sheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Chofer', key: 'chofer', width: 25 },
      { header: 'Camión (Placa)', key: 'camion', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 18 },
      { header: 'Detalle', key: 'detalle', width: 40 },
      { header: 'Costo (S/)', key: 'costo', width: 15 },
    ];

    filteredData.forEach(m => {
      sheet.addRow({
        fecha: new Date(m.fecha).toLocaleDateString(),
        chofer: m.conductor.nombres_apellidos,
        camion: `${m.camion.marca} ${m.camion.modelo} (${m.camion.placa})`,
        tipo: m.tipo,
        detalle: m.detalle,
        costo: m.costo
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
    saveAs(new Blob([buffer]), 'Taller_A&S.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Historial de Taller - Grupo A&S', 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 22);
    
    const tableData = filteredData.map(m => [
      new Date(m.fecha).toLocaleDateString(),
      m.conductor.nombres_apellidos || '',
      m.camion.placa || '',
      m.tipo,
      `S/ ${m.costo}`,
      m.detalle
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Fecha', 'Chofer', 'Placa', 'Tipo', 'Costo', 'Detalle']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] }
    });

    doc.save('Taller_A&S.pdf');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)' }}>Mantenimiento y Taller</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Registro de gastos y reparaciones de los vehículos.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportExcel} className="pro-btn-secondary" style={{ padding: '0.625rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', background: '#10b981', color: 'white', border: 'none' }}>
            Excel
          </button>
          <button onClick={exportPDF} className="pro-btn-secondary" style={{ padding: '0.625rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', background: '#ef4444', color: 'white', border: 'none' }}>
            PDF
          </button>
          <button onClick={() => setIsAdding(!isAdding)} className="pro-btn">
            + Nuevo Registro
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="pro-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Registrar Evento de Taller</h2>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'start' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Chofer</label>
              <select className="pro-input" value={formData.conductor_id} onChange={e => setFormData({...formData, conductor_id: e.target.value})} required>
                <option value="">Seleccione Chofer</option>
                {conductores.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombres_apellidos}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Camión</label>
              <select className="pro-input" value={formData.camion_id} onChange={e => setFormData({...formData, camion_id: e.target.value})} required>
                <option value="">Seleccione Camión</option>
                {camiones.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.marca} {c.modelo} - Placa: {c.placa}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Tipo</label>
              <select className="pro-input" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} required>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Reparación">Reparación</option>
                <option value="Combustible">Combustible</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Dinero Invertido (S/)</label>
              <input type="number" step="0.01" min="0" className="pro-input" placeholder="Ej. 350.00" value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} required />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Detalle (Trabajos realizados)</label>
              <textarea 
                className="pro-input" 
                rows={3} 
                placeholder="Ej. Cambio de llanta delantera derecha, parches, inflado." 
                value={formData.detalle} 
                onChange={e => setFormData({...formData, detalle: e.target.value})} 
                required 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <button type="submit" className="pro-btn" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Registro'}
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
          </div>

          <input 
            type="text" 
            className="pro-input" 
            placeholder="Buscar por placa, chofer o detalle..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <table className="pro-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Vehículo / Chofer</th>
              <th>Tipo</th>
              <th>Detalle del Trabajo</th>
              <th style={{ textAlign: 'right' }}>Costo Invertido</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay registros de taller.
                </td>
              </tr>
            ) : (
              filteredData.map(m => (
                <tr key={m.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(m.fecha).toLocaleDateString()}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{m.camion.placa}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.conductor.nombres_apellidos}</div>
                  </td>
                  <td>
                    <span style={{ 
                      background: m.tipo === 'Mantenimiento' ? '#e0f2fe' : (m.tipo === 'Reparación' ? '#fef3c7' : '#f3f4f6'), 
                      color: m.tipo === 'Mantenimiento' ? '#0369a1' : (m.tipo === 'Reparación' ? '#b45309' : '#374151'),
                      padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 
                    }}>
                      {m.tipo}
                    </span>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {m.detalle}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                    S/ {m.costo}
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
