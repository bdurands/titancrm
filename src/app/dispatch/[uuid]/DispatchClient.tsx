'use client'

import React, { useState } from 'react';
import { marcarComoEntregado } from './actions';

type PagoForm = {
  id: number;
  monto: string;
  metodo: string;
  nro_operacion: string;
  file: File | null;
};

export default function DispatchClient({ pedido }: { pedido: any }) {
  const [cobroRealizado, setCobroRealizado] = useState(false);
  const [pagos, setPagos] = useState<PagoForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(pedido.estado === 'entregado');

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Viaje Terminado</h2>
          <p style={{ color: '#6b7280' }}>Has marcado este pedido como entregado con éxito. ¡Buen trabajo!</p>
        </div>
      </div>
    );
  }

  const addPago = () => {
    setPagos([...pagos, { id: Date.now(), monto: '', metodo: 'Efectivo', nro_operacion: '', file: null }]);
  };

  const removePago = (id: number) => {
    setPagos(pagos.filter(p => p.id !== id));
  };

  const updatePago = (id: number, field: keyof PagoForm, value: any) => {
    setPagos(pagos.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const totalPagado = pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
  const saldoFaltante = Number(pedido.total_cobrar) - totalPagado;

  const handleEntregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('¿Estás seguro de marcar este pedido como ENTREGADO? Esta acción no se puede deshacer.')) return;
    
    setLoading(true);
    const fd = new FormData();
    fd.append('dispatch_uuid', pedido.dispatch_uuid);
    fd.append('cobro_realizado', cobroRealizado.toString());
    
    if (cobroRealizado) {
      fd.append('pagos_count', pagos.length.toString());
      pagos.forEach((p, index) => {
        fd.append(`pago_${index}_monto`, p.monto);
        fd.append(`pago_${index}_metodo`, p.metodo);
        fd.append(`pago_${index}_nro_operacion`, p.nro_operacion);
        if (p.file) {
          fd.append(`pago_${index}_file`, p.file);
        }
      });
    }

    const res = await marcarComoEntregado(fd);
    if ('success' in res && res.success) {
      setSuccess(true);
    } else if ('error' in res) {
      alert(res.error);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'sans-serif', paddingBottom: '2rem' }}>
      <div style={{ background: '#111827', color: 'white', padding: '1.5rem 1rem', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Despacho de Entrega</h1>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>Pedido #{pedido.id_pedido}</p>
      </div>

      <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Info del Cliente */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Datos del Cliente</h2>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem', display: 'block' }}>Nombre</span>
            <span style={{ fontWeight: 500, fontSize: '1.125rem' }}>{pedido.cliente.nombres}</span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem', display: 'block' }}>Celular</span>
            <span style={{ fontWeight: 500, fontSize: '1.125rem' }}>{pedido.cliente.celular}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <a href={`tel:${pedido.cliente.celular}`} style={{ display: 'block', textAlign: 'center', background: '#3b82f6', color: 'white', padding: '0.75rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              📞 Llamar
            </a>
            <a href={`https://wa.me/51${pedido.cliente.celular.replace(/^51/,'')}`} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: '#25D366', color: 'white', padding: '0.75rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              💬 WhatsApp
            </a>
          </div>
        </div>

        {/* Info del Pedido */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Detalle de Carga</h2>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem', display: 'block' }}>Producto a entregar</span>
            <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827' }}>{pedido.cantidad} {pedido.unidad_medida} de {pedido.producto.tipo}</span>
          </div>
          <div>
            <span style={{ color: '#6b7280', fontSize: '0.875rem', display: 'block' }}>Monto a Cobrar (Total Pedido)</span>
            <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#059669' }}>S/ {Number(pedido.total_cobrar).toFixed(2)}</span>
            {pedido.tipo_pago !== 'Efectivo' && (
              <span style={{ display: 'inline-block', marginLeft: '0.5rem', background: '#fef3c7', color: '#d97706', fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                El cliente acordó pagar por {pedido.tipo_pago}
              </span>
            )}
          </div>
        </div>

        {/* Info de Ubicación */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Destino</h2>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem', display: 'block' }}>Dirección</span>
            <span style={{ fontWeight: 500 }}>{pedido.direccion_entrega}</span>
          </div>
          {pedido.link_ubicacion && (
            <a href={pedido.link_ubicacion} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: '#ef4444', color: 'white', padding: '0.75rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              📍 Abrir en Google Maps
            </a>
          )}
        </div>

        {/* Formulario de Cierre Múltiple */}
        <form onSubmit={handleEntregar} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #3b82f6' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1d4ed8', marginBottom: '1rem' }}>Finalizar Entrega</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '1rem', background: cobroRealizado ? '#eff6ff' : '#f9fafb', border: cobroRealizado ? '1px solid #bfdbfe' : '1px solid #e5e7eb', borderRadius: '8px' }}>
              <input 
                type="checkbox" 
                checked={cobroRealizado} 
                onChange={e => {
                  setCobroRealizado(e.target.checked);
                  if (e.target.checked && pagos.length === 0) addPago();
                }} 
                style={{ width: '1.5rem', height: '1.5rem', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>Realicé un cobro al cliente en el punto de entrega</span>
            </label>
          </div>

          {cobroRealizado && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>Desglose de Pagos Recibidos</h3>
              
              {pagos.map((pago, idx) => (
                <div key={pago.id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e5e7eb', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <button type="button" onClick={() => removePago(pago.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1.25rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Monto Cobrado (S/)</label>
                      <input 
                        type="number" step="0.01" min="0" required
                        value={pago.monto} 
                        onChange={e => updatePago(pago.id, 'monto', e.target.value)} 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Método de Pago</label>
                      <select 
                        value={pago.metodo} 
                        onChange={e => updatePago(pago.id, 'metodo', e.target.value)} 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Yape">Yape</option>
                        <option value="Plin">Plin</option>
                      </select>
                    </div>
                  </div>

                  {['Transferencia', 'Yape', 'Plin'].includes(pago.metodo) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nro. Operación (Opcional)</label>
                        <input 
                          type="text"
                          value={pago.nro_operacion} 
                          onChange={e => updatePago(pago.id, 'nro_operacion', e.target.value)} 
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Subir Foto del Voucher</label>
                        <input 
                          type="file" accept="image/*"
                          onChange={e => updatePago(pago.id, 'file', e.target.files ? e.target.files[0] : null)}
                          style={{ width: '100%', padding: '0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button 
                type="button" 
                onClick={addPago}
                style={{ width: '100%', padding: '0.75rem', border: '2px dashed #d1d5db', borderRadius: '8px', background: 'transparent', color: '#4b5563', fontWeight: 600, cursor: 'pointer', marginBottom: '1rem' }}
              >
                + Añadir otro pago / método
              </button>

              <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>Total Cobrado por Chofer:</span>
                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: saldoFaltante > 0 ? '#d97706' : '#059669' }}>
                  S/ {totalPagado.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              background: loading ? '#9ca3af' : '#10b981', 
              color: 'white', 
              padding: '1rem', 
              borderRadius: '8px', 
              border: 'none', 
              fontSize: '1.125rem', 
              fontWeight: 700, 
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
            }}
          >
            {loading ? 'Procesando...' : 'FINALIZAR Y MARCAR ENTREGADO'}
          </button>
        </form>

      </div>
    </div>
  );
}
