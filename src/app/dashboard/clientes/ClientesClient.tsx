'use client'

import React, { useState } from 'react';
import { createCliente, deleteCliente } from './actions';

type Cliente = {
  id: string;
  nombres: string;
  celular: string | null;
};

export default function ClientesClient({ initialClientes }: { initialClientes: Cliente[] }) {
  const [clientes, setClientes] = useState(initialClientes);
  const [filter, setFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCliente, setNewCliente] = useState({ nombres: '', celular: '' });
  const [loading, setLoading] = useState(false);

  const filteredClientes = clientes.filter(c => 
    c.nombres.toLowerCase().includes(filter.toLowerCase()) || 
    (c.celular && c.celular.includes(filter))
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCliente.nombres) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('nombres', newCliente.nombres);
    if (newCliente.celular) formData.append('celular', newCliente.celular);
    
    const res = await createCliente(formData);
    if (res.success) {
      window.location.reload(); 
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar a este cliente?')) return;
    
    const res = await deleteCliente(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
    }
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Nombres,Celular\n" 
      + filteredClientes.map(e => `${e.id},${e.nombres},${e.celular || 'Ninguno'}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clientes_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)' }}>Gestión de Clientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Administra la cartera de clientes de Grupo A&S.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportCSV} className="pro-btn-secondary" style={{ padding: '0.625rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
            Exportar CSV
          </button>
          <button onClick={() => setIsAdding(!isAdding)} className="pro-btn">
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="pro-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Registrar Nuevo Cliente</h2>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Nombres</label>
              <input 
                type="text" 
                className="pro-input" 
                placeholder="Ej. Constructora ABC"
                value={newCliente.nombres}
                onChange={(e) => setNewCliente({...newCliente, nombres: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Celular (Opcional)</label>
              <input 
                type="text" 
                className="pro-input" 
                placeholder="Ej. 999888777"
                value={newCliente.celular}
                onChange={(e) => setNewCliente({...newCliente, celular: e.target.value})}
              />
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
            placeholder="Buscar por nombre o celular..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <table className="pro-table">
          <thead>
            <tr>
              <th>Nombre o Razón Social</th>
              <th>Celular</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClientes.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron clientes.
                </td>
              </tr>
            ) : (
              filteredClientes.map(cliente => (
                <tr key={cliente.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{cliente.nombres}</td>
                  <td>{cliente.celular || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDelete(cliente.id)}
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
