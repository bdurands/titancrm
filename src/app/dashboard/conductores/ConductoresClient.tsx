'use client'

import React, { useState } from 'react';
import { createConductor, deleteConductor, updateConductor } from './actions';

type Camion = { id: string; placa: string };
type Conductor = {
  id: string;
  nombres_apellidos: string;
  dni: string;
  camion_asignado?: Camion | null;
};

export default function ConductoresClient({ initialConductores, camionesDisponibles }: { initialConductores: Conductor[], camionesDisponibles: Camion[] }) {
  const [conductores, setConductores] = useState(initialConductores);
  const [filter, setFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newConductor, setNewConductor] = useState({ nombres_apellidos: '', dni: '', camion_asignado_id: '' });
  const [loading, setLoading] = useState(false);

  const [editingConductor, setEditingConductor] = useState<Conductor | null>(null);
  const [editForm, setEditForm] = useState({ nombres_apellidos: '', dni: '', camion_asignado_id: '' });

  const filteredConductores = conductores.filter(c => 
    c.nombres_apellidos.toLowerCase().includes(filter.toLowerCase()) || 
    c.dni.includes(filter)
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConductor.nombres_apellidos || !newConductor.dni) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('nombres_apellidos', newConductor.nombres_apellidos);
    formData.append('dni', newConductor.dni);
    if (newConductor.camion_asignado_id) {
      formData.append('camion_asignado_id', newConductor.camion_asignado_id);
    }
    
    const res = await createConductor(formData);
    if (res.success) {
      window.location.reload(); 
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar a este conductor?')) return;
    
    const res = await deleteConductor(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
    }
  };

  const handleEditClick = (conductor: Conductor) => {
    setEditForm({
      nombres_apellidos: conductor.nombres_apellidos,
      dni: conductor.dni,
      camion_asignado_id: conductor.camion_asignado?.id || ''
    });
    setEditingConductor(conductor);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConductor) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('nombres_apellidos', editForm.nombres_apellidos);
    formData.append('dni', editForm.dni);
    if (editForm.camion_asignado_id) {
      formData.append('camion_asignado_id', editForm.camion_asignado_id);
    }
    
    const res = await updateConductor(editingConductor.id, formData);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Nombres,DNI,Camion Asignado\n" 
      + filteredConductores.map(e => `${e.id},${e.nombres_apellidos},${e.dni},${e.camion_asignado?.placa || 'Ninguno'}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "conductores_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)' }}>Gestión de Conductores</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Administra los transportistas y asigna vehículos.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportCSV} className="pro-btn-secondary" style={{ padding: '0.625rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
            Exportar CSV
          </button>
          <button onClick={() => setIsAdding(!isAdding)} className="pro-btn">
            + Nuevo Conductor
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="pro-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Registrar Nuevo Conductor</h2>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Nombres y Apellidos</label>
              <input 
                type="text" 
                className="pro-input" 
                placeholder="Ej. Juan Pérez"
                value={newConductor.nombres_apellidos}
                onChange={(e) => setNewConductor({...newConductor, nombres_apellidos: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>DNI</label>
              <input 
                type="text" 
                className="pro-input" 
                placeholder="Ej. 12345678"
                value={newConductor.dni}
                onChange={(e) => setNewConductor({...newConductor, dni: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Camión Asignado (Opcional)</label>
              <select 
                className="pro-input" 
                value={newConductor.camion_asignado_id}
                onChange={(e) => setNewConductor({...newConductor, camion_asignado_id: e.target.value})}
              >
                <option value="">-- Sin Asignar --</option>
                {camionesDisponibles.map(c => (
                  <option key={c.id} value={c.id}>{c.placa}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="pro-btn" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
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
            placeholder="Buscar por nombre o DNI..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <table className="pro-table">
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombres y Apellidos</th>
              <th>Camión Asignado (Placa)</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredConductores.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron conductores.
                </td>
              </tr>
            ) : (
              filteredConductores.map(conductor => (
                <tr key={conductor.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{conductor.dni}</td>
                  <td>{conductor.nombres_apellidos}</td>
                  <td>
                    {conductor.camion_asignado ? (
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{conductor.camion_asignado.placa}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin asignar</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleEditClick(conductor)}
                        style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(conductor.id)}
                        style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingConductor && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="pro-card" style={{ padding: '2rem', width: '100%', maxWidth: '500px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Editar Conductor</h2>
              <button onClick={() => setEditingConductor(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Nombres y Apellidos</label>
                <input 
                  type="text" 
                  className="pro-input" 
                  value={editForm.nombres_apellidos}
                  onChange={(e) => setEditForm({...editForm, nombres_apellidos: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>DNI</label>
                <input 
                  type="text" 
                  className="pro-input" 
                  value={editForm.dni}
                  onChange={(e) => setEditForm({...editForm, dni: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Camión Asignado</label>
                <select 
                  className="pro-input" 
                  value={editForm.camion_asignado_id}
                  onChange={(e) => setEditForm({...editForm, camion_asignado_id: e.target.value})}
                >
                  <option value="">-- Sin Asignar --</option>
                  {camionesDisponibles.map(c => (
                    <option key={c.id} value={c.id}>{c.placa}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '0.5rem' }}>
                <button type="button" onClick={() => setEditingConductor(null)} className="pro-btn-secondary">Cancelar</button>
                <button type="submit" className="pro-btn" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
