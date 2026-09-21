'use client'

import React, { useState } from 'react';
import { createLadrillo, deleteLadrillo } from './actions';

type Producto = {
  id: string;
  tipo: string;
};

export default function LadrillosClient({ initialLadrillos }: { initialLadrillos: Producto[] }) {
  const [ladrillos, setLadrillos] = useState(initialLadrillos);
  const [filter, setFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTipo, setNewTipo] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredLadrillos = ladrillos.filter(l => 
    l.tipo.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTipo) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('tipo', newTipo);
    
    const res = await createLadrillo(formData);
    if (res.success) {
      window.location.reload(); 
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este tipo de ladrillo?')) return;
    
    const res = await deleteLadrillo(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
    }
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Tipo de Ladrillo\n" 
      + filteredLadrillos.map(e => `${e.id},${e.tipo}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ladrillos_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)' }}>Catálogo de Ladrillos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Gestiona los tipos de ladrillos disponibles en el sistema.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportCSV} className="pro-btn-secondary" style={{ padding: '0.625rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
            Exportar CSV
          </button>
          <button onClick={() => setIsAdding(!isAdding)} className="pro-btn">
            + Nuevo Tipo
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="pro-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Nombre / Tipo de Ladrillo</label>
              <input 
                type="text" 
                className="pro-input" 
                placeholder="Ej. Techo 15"
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="pro-btn" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </div>
      )}

      <div className="pro-card">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <input 
            type="text" 
            className="pro-input" 
            placeholder="Buscar ladrillos..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: '280px' }}
          />
        </div>

        <table className="pro-table">
          <thead>
            <tr>
              <th>Tipo de Ladrillo</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredLadrillos.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron resultados.
                </td>
              </tr>
            ) : (
              filteredLadrillos.map(ladrillo => (
                <tr key={ladrillo.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{ladrillo.tipo}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDelete(ladrillo.id)}
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
