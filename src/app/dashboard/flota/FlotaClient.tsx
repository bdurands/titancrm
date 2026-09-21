'use client'

import React, { useState } from 'react';
import { createCamion, deleteCamion } from './actions';

type Camion = {
  id: string;
  marca: string;
  modelo: string;
  placa: string;
  sinotrack_device_id?: string | null;
  conductores?: { nombres_apellidos: string }[];
};

export default function FlotaClient({ initialCamiones }: { initialCamiones: Camion[] }) {
  const [camiones, setCamiones] = useState(initialCamiones);
  const [filter, setFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCamion, setNewCamion] = useState({ marca: '', modelo: '', placa: '', sinotrack_device_id: '', sinotrack_password: '' });
  const [loading, setLoading] = useState(false);

  const filteredCamiones = camiones.filter(c => 
    c.placa.toLowerCase().includes(filter.toLowerCase()) || 
    c.marca.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamion.marca || !newCamion.modelo || !newCamion.placa) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('marca', newCamion.marca);
    formData.append('modelo', newCamion.modelo);
    formData.append('placa', newCamion.placa);
    if (newCamion.sinotrack_device_id) formData.append('sinotrack_device_id', newCamion.sinotrack_device_id);
    if (newCamion.sinotrack_password) formData.append('sinotrack_password', newCamion.sinotrack_password);
    
    const res = await createCamion(formData);
    if (res.success) {
      window.location.reload(); 
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este camión?')) return;
    
    const res = await deleteCamion(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
    }
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Marca,Modelo,Placa,Conductores Asignados\n" 
      + filteredCamiones.map(e => `${e.id},${e.marca},${e.modelo},${e.placa},${e.conductores ? e.conductores.map(c => c.nombres_apellidos).join(' | ') : 'Ninguno'}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "flota_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)' }}>Gestión de Flota</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Administra los camiones y sus placas vehiculares.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportCSV} className="pro-btn-secondary" style={{ padding: '0.625rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
            Exportar CSV
          </button>
          <button onClick={() => setIsAdding(!isAdding)} className="pro-btn">
            + Nuevo Camión
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="pro-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Registrar Nuevo Vehículo</h2>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Marca</label>
              <input 
                type="text" 
                className="pro-input" 
                placeholder="Ej. Volvo"
                value={newCamion.marca}
                onChange={(e) => setNewCamion({...newCamion, marca: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Modelo</label>
              <input 
                type="text" 
                className="pro-input" 
                placeholder="Ej. FMX 440"
                value={newCamion.modelo}
                onChange={(e) => setNewCamion({...newCamion, modelo: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Placa</label>
              <input 
                type="text" 
                className="pro-input" 
                placeholder="Ej. A1B-234"
                value={newCamion.placa}
                onChange={(e) => setNewCamion({...newCamion, placa: e.target.value.toUpperCase()})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>ID GPS SinoTrack (Opcional)</label>
              <input 
                type="text" 
                className="pro-input" 
                placeholder="Ej. 9170293382"
                value={newCamion.sinotrack_device_id}
                onChange={(e) => setNewCamion({...newCamion, sinotrack_device_id: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Password GPS (Opcional)</label>
              <input 
                type="text" 
                className="pro-input" 
                placeholder="Ej. 123456"
                value={newCamion.sinotrack_password}
                onChange={(e) => setNewCamion({...newCamion, sinotrack_password: e.target.value})}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="pro-btn" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Camión'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="pro-card">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <input 
            type="text" 
            className="pro-input" 
            placeholder="Buscar por placa o marca..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <table className="pro-table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>ID SinoTrack</th>
              <th>Conductores Asignados</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCamiones.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron vehículos.
                </td>
              </tr>
            ) : (
              filteredCamiones.map(camion => (
                <tr key={camion.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{camion.placa}</td>
                  <td>{camion.marca}</td>
                  <td>{camion.modelo}</td>
                  <td>
                    {camion.sinotrack_device_id ? (
                      <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>🟢 {camion.sinotrack_device_id}</span>
                    ) : (
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sin GPS</span>
                    )}
                  </td>
                  <td>
                    {camion.conductores && camion.conductores.length > 0 ? (
                      camion.conductores.map(c => c.nombres_apellidos).join(', ')
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin asignar</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDelete(camion.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}
                    >
                      Eliminar
                    </button>
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
