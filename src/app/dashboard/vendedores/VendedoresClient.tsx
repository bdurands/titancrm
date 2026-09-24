'use client'

import React, { useState } from 'react';
import { createVendedor, deleteVendedor, updateVendedor } from './actions';

type Vendedor = {
  id: string;
  nombre: string;
};

export default function VendedoresClient({ initialVendedores }: { initialVendedores: Vendedor[] }) {
  const [vendedores, setVendedores] = useState(initialVendedores);
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.append('nombre', nombre);
    
    const res = await createVendedor(fd);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este vendedor?')) return;
    const res = await deleteVendedor(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editNombre.trim()) return;
    const fd = new FormData();
    fd.append('nombre', editNombre);
    const res = await updateVendedor(id, fd);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)' }}>Vendedores</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Administra el personal de ventas</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="pro-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Nuevo Vendedor</h2>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Nombre Completo</label>
              <input type="text" className="pro-input" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej. Juan Pérez" />
            </div>
            <button type="submit" className="pro-btn" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Vendedor'}
            </button>
          </form>
        </div>

        <div className="pro-card">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vendedores.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay vendedores registrados.</td>
                </tr>
              ) : (
                vendedores.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>
                      {editingId === v.id ? (
                        <input type="text" className="pro-input" value={editNombre} onChange={e => setEditNombre(e.target.value)} style={{ padding: '0.25rem 0.5rem' }} />
                      ) : (
                        v.nombre
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {editingId === v.id ? (
                          <>
                            <button onClick={() => setEditingId(null)} style={{ background: '#6b7280', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Cancelar</button>
                            <button onClick={() => handleEditSave(v.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Guardar</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingId(v.id); setEditNombre(v.nombre); }} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Editar</button>
                            <button onClick={() => handleDelete(v.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Eliminar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
