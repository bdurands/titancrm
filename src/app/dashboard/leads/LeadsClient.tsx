'use client'

import React, { useState } from 'react';
import { createConversacionManual, updateEstadoLead, sendMensajeToLead, convertToClient } from './actions';

type Mensaje = { id: string; cuerpo: string; es_entrante: boolean; fecha: Date };
type Conversacion = {
  id: string; origen: string; contacto_id: string; nombre_prospecto: string; estado: string; 
  mensajes: Mensaje[]; ultima_actividad: Date;
};

const COLUMNAS = ['Nuevos', 'Negociando', 'Convertidos'];

export default function LeadsClient({ initialConversaciones }: { initialConversaciones: Conversacion[] }) {
  const [conversaciones, setConversaciones] = useState(initialConversaciones);
  const [isAdding, setIsAdding] = useState(false);
  const [activeChat, setActiveChat] = useState<Conversacion | null>(null);
  const [mensajeText, setMensajeText] = useState('');
  
  const [nuevoLead, setNuevoLead] = useState({ origen: 'whatsapp', contacto_id: '', nombre_prospecto: '' });

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('origen', nuevoLead.origen);
    formData.append('contacto_id', nuevoLead.contacto_id);
    formData.append('nombre_prospecto', nuevoLead.nombre_prospecto);
    
    const res = await createConversacionManual(formData);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
    }
  };

  const handleMove = async (id: string, nuevoEstado: string) => {
    const res = await updateEstadoLead(id, nuevoEstado);
    if (res.success) {
      setConversaciones(conversaciones.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
      if (activeChat?.id === id) {
        setActiveChat({ ...activeChat, estado: nuevoEstado });
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !mensajeText.trim()) return;
    
    const text = mensajeText;
    setMensajeText('');
    
    // Optimistic UI
    const tempMsg = { id: Date.now().toString(), cuerpo: text, es_entrante: false, fecha: new Date() };
    setActiveChat({ ...activeChat, mensajes: [...activeChat.mensajes, tempMsg] });
    
    const res = await sendMensajeToLead(activeChat.id, text);
    if (res.success) {
      // Idealmente recargamos o dejamos el optimistic
    } else {
      alert(res.error);
    }
  };

  const handleConvert = async () => {
    if (!activeChat) return;
    if (!confirm(`¿Convertir a ${activeChat.nombre_prospecto} en Cliente Oficial?`)) return;
    
    const formData = new FormData();
    formData.append('conversacion_id', activeChat.id);
    
    const res = await convertToClient(formData);
    if (res.success) {
      alert('¡Cliente creado exitosamente en tu agenda!');
      window.location.reload();
    } else {
      alert(res.error);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)' }}>Leads & Inbox Multicanal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Todos tus chats de WhatsApp y Facebook en un solo lugar.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="pro-btn">
          + Lead Manual
        </button>
      </div>

      {isAdding && (
        <div className="pro-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', flexShrink: 0 }}>
          <form onSubmit={handleAddManual} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Origen</label>
              <select className="pro-input" value={nuevoLead.origen} onChange={e => setNuevoLead({...nuevoLead, origen: e.target.value})}>
                <option value="whatsapp">WhatsApp</option>
                <option value="facebook">Facebook Messenger</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Teléfono / ID</label>
              <input required type="text" className="pro-input" placeholder="Ej. 999888777" value={nuevoLead.contacto_id} onChange={e => setNuevoLead({...nuevoLead, contacto_id: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Nombre</label>
              <input required type="text" className="pro-input" placeholder="Nombre del prospecto" value={nuevoLead.nombre_prospecto} onChange={e => setNuevoLead({...nuevoLead, nombre_prospecto: e.target.value})} />
            </div>
            <button type="submit" className="pro-btn">Guardar</button>
          </form>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', gap: '1.5rem', overflow: 'hidden' }}>
        
        {/* KANBAN BOARD */}
        <div style={{ flex: activeChat ? '1' : '1', display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {COLUMNAS.map(col => (
            <div key={col} style={{ flex: '1', minWidth: '300px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1rem', borderBottom: '2px solid var(--border-color)', fontWeight: 600, color: 'var(--text-dark)' }}>
                {col} <span style={{ background: 'var(--border-color)', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{conversaciones.filter(c => c.estado === col).length}</span>
              </div>
              <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {conversaciones.filter(c => c.estado === col).map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setActiveChat(c)}
                    style={{ background: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid', borderColor: activeChat?.id === c.id ? 'var(--primary)' : 'var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.nombre_prospecto}</span>
                      <span style={{ fontSize: '1rem' }}>{c.origen === 'whatsapp' ? '🟢' : '🔵'}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.mensajes.length > 0 ? c.mensajes[c.mensajes.length - 1].cuerpo : 'Sin mensajes aún...'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{new Date(c.ultima_actividad).toLocaleTimeString()}</span>
                      
                      <select 
                        value={c.estado} 
                        onChange={(e) => { e.stopPropagation(); handleMove(c.id, e.target.value); }}
                        style={{ fontSize: '0.7rem', padding: '0.1rem', borderRadius: '4px', border: '1px solid #ddd' }}
                      >
                        {COLUMNAS.map(op => <option key={op} value={op}>{op}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CHAT SIDEBAR */}
        {activeChat && (
          <div style={{ width: '400px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-dark)' }}>{activeChat.nombre_prospecto}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeChat.origen === 'whatsapp' ? 'WhatsApp' : 'Facebook'} • {activeChat.contacto_id}</span>
              </div>
              <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            {/* Convertir Botón */}
            {activeChat.estado !== 'Convertidos' && (
              <div style={{ padding: '0.5rem 1rem', background: '#ecfdf5', borderBottom: '1px solid #d1fae5', textAlign: 'center' }}>
                <button onClick={handleConvert} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  ⭐ Convertir a Cliente Oficial
                </button>
              </div>
            )}

            {/* Messages Body */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', background: '#efeae2', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activeChat.mensajes.map((m, i) => (
                <div key={i} style={{ alignSelf: m.es_entrante ? 'flex-start' : 'flex-end', maxWidth: '80%' }}>
                  <div style={{ background: m.es_entrante ? 'white' : '#dcf8c6', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.875rem', color: '#111', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                    {m.cuerpo}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#667781', textAlign: m.es_entrante ? 'left' : 'right', marginTop: '0.25rem' }}>
                    {new Date(m.fecha).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {activeChat.mensajes.length === 0 && (
                <div style={{ textAlign: 'center', color: '#667781', fontSize: '0.875rem', marginTop: '2rem' }}>
                  No hay mensajes todavía. Envía el primero.
                </div>
              )}
            </div>

            {/* Input area */}
            <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', background: '#f0f2f5' }}>
              <input 
                type="text" 
                value={mensajeText}
                onChange={e => setMensajeText(e.target.value)}
                placeholder="Escribe un mensaje..."
                style={{ flex: 1, padding: '0.75rem', borderRadius: '20px', border: 'none', outline: 'none' }}
              />
              <button type="submit" style={{ background: '#00a884', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                ➤
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
