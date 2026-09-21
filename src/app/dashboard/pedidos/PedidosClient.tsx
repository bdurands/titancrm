'use client'

import React, { useState } from 'react';
import { createPedido, updateEstadoPedido } from './actions';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Rel = { id: string; nombre?: string; nombres?: string; tipo?: string; es_planta_choque?: boolean };
type Pedido = {
  id_pedido: string;
  fecha: Date;
  fecha_entrega?: Date | null;
  direccion_entrega: string;
  cantidad: number;
  unidad_medida: string;
  total_cobrar: number;
  tipo_pago: string;
  estado: string;
  tracking_uuid?: string | null;
  dispatch_uuid?: string | null;
  link_ubicacion?: string | null;
  nro_operacion?: string | null;
  fecha_operacion?: Date | null;
  foto_comprobante?: string | null;
  cobro_realizado_chofer?: boolean | null;
  pagos_chofer?: string | null;
  cliente: Rel & { celular?: string };
  producto: Rel;
  origen_almacen: Rel;
  vendedor?: Rel | null;
  conductor?: { id: string; nombres_apellidos: string } | null;
  camion?: { id: string; placa: string; marca: string } | null;
};

export default function PedidosClient({ initialPedidos, clientes, productos, almacenes, camiones, vendedores, conductores }: any) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos);
  const [filter, setFilter] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterProductoId, setFilterProductoId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);

  const [formData, setFormData] = useState({
    cliente_id: '',
    producto_id: '',
    origen_id: '',
    cantidad: '',
    total_cobrar: '',
    tipo_pago: 'Efectivo',
    fecha_entrega: '',
    direccion_entrega: '',
    vendedor_id: '',
    conductor_id: '',
    link_ubicacion: '',
    nro_operacion: '',
    fecha_operacion: '',
    foto_comprobante: null as File | null
  });

  const filteredPedidos = pedidos.filter(p => {
    const matchesText = p.cliente.nombres?.toLowerCase().includes(filter.toLowerCase()) || 
                        p.direccion_entrega.toLowerCase().includes(filter.toLowerCase()) ||
                        p.id_pedido.toString().includes(filter);
    const matchesProducto = filterProductoId === '' || p.producto.id === filterProductoId;
    
    let matchesDate = true;
    const pDate = p.fecha_entrega ? new Date(p.fecha_entrega) : new Date(p.fecha);
    
    if (filterStartDate) {
      const [year, month, day] = filterStartDate.split('-');
      const sDate = new Date(Number(year), Number(month) - 1, Number(day));
      sDate.setHours(0,0,0,0);
      if (pDate < sDate) matchesDate = false;
    }
    if (filterEndDate) {
      const [year, month, day] = filterEndDate.split('-');
      const eDate = new Date(Number(year), Number(month) - 1, Number(day));
      eDate.setHours(23,59,59,999);
      if (pDate > eDate) matchesDate = false;
    }
    
    return matchesText && matchesProducto && matchesDate;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== null) data.append(k, v as any);
    });
    
    const res = await createPedido(data);
    if (res.success) {
      // Si seleccionó conductor, generar mensaje de whatsapp al conductor con link
      if (formData.conductor_id && res.dispatch_uuid) {
        const conductor = conductores.find((c: any) => c.id === formData.conductor_id);
        if (conductor) {
          // Asumimos que podemos llamarlo, pero no tenemos telefono del conductor. 
          // Mostraremos un alert con el link para que se lo envíen o lo abriremos.
          const linkDespacho = `${window.location.origin}/dispatch/${res.dispatch_uuid}`;
          alert(`Pedido creado. Link para el chofer:\n\n${linkDespacho}\n\nPuedes copiarlo y enviárselo.`);
        }
      }
      window.location.reload(); 
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  const handleUpdateEstado = async (id: string, nuevoEstado: string, camionId?: string) => {
    if (nuevoEstado === 'entregado') {
      if (!confirm('Al marcar como Entregado, se deducirá automáticamente el stock del almacén de origen. ¿Continuar?')) return;
    }
    
    const res = await updateEstadoPedido(id, nuevoEstado, camionId);
    if ('success' in res && res.success) {
      window.location.reload();
    } else if ('error' in res) {
      alert(res.error);
    }
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Pedidos');

    sheet.columns = [
      { header: 'ID Pedido', key: 'id', width: 12 },
      { header: 'Fecha Reg.', key: 'fechaReg', width: 15 },
      { header: 'Fecha Entr.', key: 'fechaEntr', width: 20 },
      { header: 'Cliente', key: 'cliente', width: 25 },
      { header: 'Dirección', key: 'direccion', width: 25 },
      { header: 'Origen', key: 'origen', width: 15 },
      { header: 'Producto', key: 'producto', width: 20 },
      { header: 'Cant.', key: 'cantidad', width: 12 },
      { header: 'Total (S/)', key: 'total', width: 12 },
      { header: 'Pago', key: 'pago', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
    ];

    filteredPedidos.forEach(p => {
      sheet.addRow({
        id: p.id_pedido,
        fechaReg: new Date(p.fecha).toLocaleDateString(),
        fechaEntr: p.fecha_entrega ? new Date(p.fecha_entrega).toLocaleString() : 'No definida',
        cliente: p.cliente.nombres,
        direccion: p.direccion_entrega,
        origen: p.origen_almacen.nombre,
        producto: p.producto.tipo,
        cantidad: `${p.cantidad} ${p.unidad_medida}`,
        total: p.total_cobrar,
        pago: p.tipo_pago,
        estado: p.estado
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
    saveAs(new Blob([buffer]), 'Pedidos_A&S.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reporte de Pedidos - Grupo A&S', 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 22);
    
    const tableData = filteredPedidos.map(p => [
      p.id_pedido.toString(),
      p.fecha_entrega ? new Date(p.fecha_entrega).toLocaleDateString() : 'No definida',
      p.cliente.nombres || '',
      p.producto.tipo || '',
      p.cantidad.toString(),
      `S/ ${p.total_cobrar}`,
      p.estado
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['ID', 'F. Entrega', 'Cliente', 'Producto', 'Cant.', 'Total', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] }
    });

    doc.save('Pedidos_A&S.pdf');
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'creado': return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Creado</span>;
      case 'en camino': return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>En Camino</span>;
      case 'entregado': return <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Entregado</span>;
      default: return <span>{estado}</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)' }}>Gestión de Pedidos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Administra las ventas, despachos y entrega a clientes.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportExcel} className="pro-btn-secondary" style={{ padding: '0.625rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', background: '#10b981', color: 'white', border: 'none' }}>
            Excel
          </button>
          <button onClick={exportPDF} className="pro-btn-secondary" style={{ padding: '0.625rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', background: '#ef4444', color: 'white', border: 'none' }}>
            PDF
          </button>
          <button onClick={() => setIsAdding(!isAdding)} className="pro-btn">
            + Nuevo Pedido
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="pro-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Registrar Nuevo Pedido</h2>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Cliente</label>
              <select className="pro-input" value={formData.cliente_id} onChange={e => setFormData({...formData, cliente_id: e.target.value})} required>
                <option value="">Seleccione Cliente</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombres}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Fecha/Hora de Entrega (Opcional)</label>
              <input type="datetime-local" className="pro-input" value={formData.fecha_entrega} onChange={e => setFormData({...formData, fecha_entrega: e.target.value})} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Dirección de Entrega</label>
              <input type="text" className="pro-input" placeholder="Ej. Obra Las Flores 123" value={formData.direccion_entrega} onChange={e => setFormData({...formData, direccion_entrega: e.target.value})} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Link de Ubicación (Google Maps) (Opcional)</label>
              <input type="url" className="pro-input" placeholder="https://maps.app.goo.gl/..." value={formData.link_ubicacion} onChange={e => setFormData({...formData, link_ubicacion: e.target.value})} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Vendedor</label>
              <select className="pro-input" value={formData.vendedor_id} onChange={e => setFormData({...formData, vendedor_id: e.target.value})} required>
                <option value="">Seleccione Vendedor</option>
                {vendedores.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Chofer Asignado (Opcional por ahora)</label>
              <select className="pro-input" value={formData.conductor_id} onChange={e => setFormData({...formData, conductor_id: e.target.value})}>
                <option value="">No Asignado</option>
                {conductores.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombres_apellidos}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Producto (Ladrillo)</label>
              <select className="pro-input" value={formData.producto_id} onChange={e => setFormData({...formData, producto_id: e.target.value})} required>
                <option value="">Seleccione Ladrillo</option>
                {productos.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Cantidad (Unidades/Millares)</label>
              <input type="number" min="1" className="pro-input" placeholder="Ej. 10000" value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Origen (Desde dónde sale)</label>
              <select className="pro-input" value={formData.origen_id} onChange={e => setFormData({...formData, origen_id: e.target.value})} required>
                <option value="">Seleccione Origen</option>
                {almacenes.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.nombre} {a.es_planta_choque ? '(Planta)' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Total a Cobrar ($/S/.)</label>
              <input type="number" step="0.01" min="0" className="pro-input" placeholder="Ej. 1500.50" value={formData.total_cobrar} onChange={e => setFormData({...formData, total_cobrar: e.target.value})} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Tipo de Pago</label>
              <select className="pro-input" value={formData.tipo_pago} onChange={e => setFormData({...formData, tipo_pago: e.target.value})} required>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Yape">Yape</option>
                <option value="Plin">Plin</option>
                <option value="Deposito">Depósito</option>
              </select>
            </div>

            {['Transferencia', 'Yape', 'Plin', 'Deposito'].includes(formData.tipo_pago) && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Nro. Operación</label>
                  <input type="text" className="pro-input" value={formData.nro_operacion} onChange={e => setFormData({...formData, nro_operacion: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Fecha Operación</label>
                  <input type="date" className="pro-input" value={formData.fecha_operacion} onChange={e => setFormData({...formData, fecha_operacion: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Foto Comprobante</label>
                  <input type="file" className="pro-input" accept="image/*" onChange={e => setFormData({...formData, foto_comprobante: e.target.files ? e.target.files[0] : null})} />
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <button type="submit" className="pro-btn" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Pedido'}
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
            placeholder="Buscar por cliente, dirección o ID..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <table className="pro-table">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Entrega / Dirección</th>
              <th>Detalle (Prod / Cant)</th>
              <th>Cobro & Pago</th>
              <th>Origen</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPedidos.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay pedidos registrados.
                </td>
              </tr>
            ) : (
              filteredPedidos.map(p => (
                <tr key={p.id_pedido}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    #{p.id_pedido}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{p.cliente.nombres}</td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reg: {new Date(p.fecha).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px', marginBottom: '4px' }}>
                      Entr: {p.fecha_entrega ? new Date(p.fecha_entrega).toLocaleString() : 'No programada'}
                    </div>
                    <div>{p.direccion_entrega}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.producto.tipo}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.cantidad} {p.unidad_medida.toLowerCase()}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>S/ {p.total_cobrar}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.tipo_pago}</div>
                  </td>
                  <td>{p.origen_almacen.nombre}</td>
                  <td>{getEstadoBadge(p.estado)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setSelectedPedido(p)}
                        style={{ background: '#4b5563', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        Ver Detalles
                      </button>
                      <button 
                        onClick={() => {
                          const numero = (p.cliente.celular ?? '').startsWith('51') ? p.cliente.celular : `51${p.cliente.celular ?? ''}`;
                          const mensaje = `Hola ${p.cliente.nombres}, somos de Grupo A&S. Su pedido de ${p.cantidad} ladrillos ${p.producto.tipo} está en estado: ${p.estado.toUpperCase()}.`;
                          window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
                        }}
                        style={{ background: '#25D366', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                        title="Abrir WhatsApp Web"
                      >
                        WhatsApp
                      </button>

                      {p.estado === 'creado' && (
                        <button 
                          onClick={() => handleUpdateEstado(p.id_pedido.toString(), 'en camino')}
                          style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Enviar a Ruta
                        </button>
                      )}
                      {p.estado === 'en camino' && (
                        <button onClick={() => handleUpdateEstado(p.id_pedido.toString(), 'entregado')} className="pro-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          Entregar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detalles Modal */}
      {selectedPedido && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="pro-card" style={{ padding: '2rem', minWidth: '400px', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Detalle del Pedido #{selectedPedido.id_pedido}</h3>
                <div style={{ marginTop: '0.5rem' }}>{getEstadoBadge(selectedPedido.estado)}</div>
              </div>
              <button onClick={() => setSelectedPedido(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <strong>Cliente:</strong> {selectedPedido.cliente.nombres} (Cel: {selectedPedido.cliente.celular})
              </div>
              <div>
                <strong>Vendedor:</strong> {selectedPedido.vendedor ? selectedPedido.vendedor.nombre : 'No asignado'}
              </div>
              <div>
                <strong>Producto:</strong> {selectedPedido.cantidad} {selectedPedido.unidad_medida} de {selectedPedido.producto.tipo}
              </div>
              <div>
                <strong>Pago:</strong> S/ {selectedPedido.total_cobrar} ({selectedPedido.tipo_pago})
                {selectedPedido.nro_operacion && <span style={{ marginLeft: '0.5rem' }}>- Op: {selectedPedido.nro_operacion}</span>}
              </div>
              {selectedPedido.foto_comprobante && (
                <div>
                  <strong>Comprobante Cliente:</strong><br />
                  <a href={selectedPedido.foto_comprobante} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Ver Foto de Comprobante</a>
                </div>
              )}
              
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <strong>Dirección de Entrega:</strong><br/>
                {selectedPedido.direccion_entrega}
                {selectedPedido.link_ubicacion && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <a href={selectedPedido.link_ubicacion} target="_blank" rel="noreferrer" style={{ color: '#ef4444', textDecoration: 'underline', fontWeight: 500 }}>📍 Abrir en Google Maps</a>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <strong>Logística y Despacho:</strong><br/>
                Chofer: {selectedPedido.conductor ? selectedPedido.conductor.nombres_apellidos : 'No asignado'}<br/>
                {selectedPedido.dispatch_uuid && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <strong>Link del Chofer:</strong> <a href={`/dispatch/${selectedPedido.dispatch_uuid}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Abrir Web App del Chofer</a>
                  </div>
                )}
              </div>

              {selectedPedido.estado === 'entregado' && (
                <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <strong style={{ color: '#065f46' }}>Reporte del Chofer:</strong><br/>
                  Cobro en punto: {selectedPedido.cobro_realizado_chofer ? 'SÍ' : 'NO'}<br/>
                  
                  {selectedPedido.cobro_realizado_chofer && selectedPedido.pagos_chofer && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(() => {
                        try {
                          const pagosArray = typeof selectedPedido.pagos_chofer === 'string' ? JSON.parse(selectedPedido.pagos_chofer) : selectedPedido.pagos_chofer;
                          if (!Array.isArray(pagosArray) || pagosArray.length === 0) return <span>Sin detalle de pagos estructurados.</span>;
                          return pagosArray.map((p: any, i: number) => (
                            <div key={i} style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1fae5', fontSize: '0.875rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 600 }}>{p.metodo}</span>
                                <span style={{ fontWeight: 700, color: '#059669' }}>S/ {Number(p.monto).toFixed(2)}</span>
                              </div>
                              {p.nro_operacion && <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>Op: {p.nro_operacion}</div>}
                              {p.foto_comprobante && (
                                <a href={p.foto_comprobante} target="_blank" rel="noreferrer" style={{ color: '#10b981', textDecoration: 'underline', fontWeight: 500, display: 'inline-block', marginTop: '0.25rem' }}>
                                  Ver Voucher
                                </a>
                              )}
                            </div>
                          ));
                        } catch(e) {
                          return <span>Error al leer los pagos.</span>;
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
