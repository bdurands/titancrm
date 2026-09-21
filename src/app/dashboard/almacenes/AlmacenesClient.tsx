'use client'

import React, { useState } from 'react';
import { createAlmacen, deleteAlmacen } from './actions';

type Almacen = {
  id: string;
  nombre: string;
  direccion: string;
  es_planta_choque: boolean;
  encargado?: { nombres_apellidos: string } | null;
  stock?: { id: string, cantidad_disponible: number, producto: { tipo: string } }[];
};

export default function AlmacenesClient({ initialAlmacenes }: { initialAlmacenes: Almacen[] }) {
  const [almacenes, setAlmacenes] = useState(initialAlmacenes);
  const [filter, setFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newAlmacen, setNewAlmacen] = useState({ nombre: '', direccion: '', es_planta_choque: false });
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredAlmacenes = almacenes.filter(a => 
    a.nombre.toLowerCase().includes(filter.toLowerCase()) || 
    a.direccion.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlmacen.nombre || !newAlmacen.direccion) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('nombre', newAlmacen.nombre);
    formData.append('direccion', newAlmacen.direccion);
    if (newAlmacen.es_planta_choque) {
      formData.append('es_planta_choque', 'on');
    }
    
    const res = await createAlmacen(formData);
    if (res.success) {
      window.location.reload(); 
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este almacén?')) return;
    
    const res = await deleteAlmacen(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
    }
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Nombre,Direccion,Tipo,Encargado\n" 
      + filteredAlmacenes.map(e => `${e.id},${e.nombre},${e.direccion},${e.es_planta_choque ? 'Planta' : 'Almacen'},${e.encargado?.nombres_apellidos || 'Sin Asignar'}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "almacenes_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)' }}>Gestión de Almacenes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Administra los puntos de distribución y la Planta de Choque.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportCSV} className="pro-btn-secondary" style={{ padding: '0.625rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
            Exportar CSV
          </button>
          <button onClick={() => setIsAdding(!isAdding)} className="pro-btn">
            + Nuevo Almacén
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="pro-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Registrar Nuevo Almacén</h2>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Nombre del Almacén</label>
              <input 
                type="text" 
                className="pro-input" 
                placeholder="Ej. Almacén Central Sur"
                value={newAlmacen.nombre}
                onChange={(e) => setNewAlmacen({...newAlmacen, nombre: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Dirección</label>
              <input 
                type="text" 
                className="pro-input" 
                placeholder="Ej. Av. Principal 123"
                value={newAlmacen.direccion}
                onChange={(e) => setNewAlmacen({...newAlmacen, direccion: e.target.value})}
                required
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.625rem' }}>
              <input 
                type="checkbox" 
                id="isPlanta"
                checked={newAlmacen.es_planta_choque}
                onChange={(e) => setNewAlmacen({...newAlmacen, es_planta_choque: e.target.checked})}
              />
              <label htmlFor="isPlanta" style={{ fontSize: '0.875rem', color: 'var(--text-dark)' }}>¿Es Planta de Choque? (Stock infinito)</label>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="pro-btn" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Almacén'}
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
            placeholder="Buscar por nombre o dirección..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <table className="pro-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Tipo</th>
              <th>Encargado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlmacenes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron resultados.
                </td>
              </tr>
            ) : (
              filteredAlmacenes.map(almacen => (
                <React.Fragment key={almacen.id}>
                  <tr style={{ background: expandedId === almacen.id ? '#f8fafc' : 'white' }}>
                    <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>
                      <button 
                        onClick={() => setExpandedId(expandedId === almacen.id ? null : almacen.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.5rem', fontWeight: 600, color: 'var(--primary)' }}
                      >
                        {expandedId === almacen.id ? '▼' : '▶'}
                      </button>
                      {almacen.nombre}
                    </td>
                    <td>{almacen.direccion}</td>
                    <td>
                      {almacen.es_planta_choque ? (
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>Planta</span>
                      ) : (
                        <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>Almacén</span>
                      )}
                    </td>
                    <td>{almacen.encargado?.nombres_apellidos || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin asignar</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(almacen.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                  
                  {expandedId === almacen.id && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0, background: '#f8fafc' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', borderTop: '1px dashed var(--border-color)' }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem' }}>Stock Actual de Ladrillos</h4>
                          {almacen.es_planta_choque ? (
                            <p style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 500 }}>
                              Este es un almacén de Planta (Choque), por lo que actúa como origen de stock infinito para los demás almacenes.
                            </p>
                          ) : (
                            almacen.stock && almacen.stock.length > 0 ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {almacen.stock.map(s => (
                                  <div key={s.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{s.producto.tipo}</span>
                                    <span style={{ fontWeight: 700, fontSize: '1.125rem', color: s.cantidad_disponible < 500 ? 'var(--danger)' : 'var(--primary)' }}>
                                      {s.cantidad_disponible}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Este almacén no tiene stock registrado actualmente.</p>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
