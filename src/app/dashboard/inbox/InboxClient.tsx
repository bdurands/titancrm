'use client'

import React, { useState, useEffect, useRef } from 'react';
import { updateEstadoLead, sendMensajeToLead, convertToClient, getConversaciones } from '../leads/actions';

type Mensaje = { id: string; cuerpo: string; es_entrante: boolean; fecha: Date };
type Conversacion = {
  id: string; origen: string; contacto_id: string; nombre_prospecto: string; estado: string; 
  mensajes: Mensaje[]; ultima_actividad: Date;
};

const ESTADOS = ['Nuevos', 'Negociando', 'Convertidos'];

export default function InboxClient({ initialConversaciones }: { initialConversaciones: Conversacion[] }) {
  const [conversaciones, setConversaciones] = useState(initialConversaciones);
  const [activeChat, setActiveChat] = useState<Conversacion | null>(null);
  const [mensajeText, setMensajeText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-refresh (Polling)
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await getConversaciones();
      if (data) {
        setConversaciones(data);
        setActiveChat(prev => {
          if (!prev) return null;
          const updated = data.find(c => c.id === prev.id);
          return updated || prev;
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat?.mensajes]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !mensajeText.trim()) return;
    
    const text = mensajeText;
    setMensajeText('');
    
    // Optimistic UI
    const tempMsg = { id: Date.now().toString(), cuerpo: text, es_entrante: false, fecha: new Date() };
    setActiveChat({ ...activeChat, mensajes: [...activeChat.mensajes, tempMsg] });
    
    const res = await sendMensajeToLead(activeChat.id, text);
    if (!res.success) {
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
      alert('¡Cliente creado exitosamente!');
      window.location.reload();
    } else {
      alert(res.error);
    }
  };

  const handleStateChange = async (nuevoEstado: string) => {
    if (!activeChat) return;
    const res = await updateEstadoLead(activeChat.id, nuevoEstado);
    if (res.success) {
      setConversaciones(conversaciones.map(c => c.id === activeChat.id ? { ...c, estado: nuevoEstado } : c));
      setActiveChat({ ...activeChat, estado: nuevoEstado });
    }
  };

  // Filtrado
  const filteredChats = conversaciones.filter(c => {
    const matchesSearch = c.nombre_prospecto.toLowerCase().includes(searchTerm.toLowerCase()) || c.contacto_id.includes(searchTerm);
    const matchesEstado = filterEstado === 'Todos' || c.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  return (
    <div style={{ 
      height: 'calc(100vh - 120px)', 
      display: 'flex', 
      background: '#fff', 
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      border: '1px solid var(--border-color)'
    }}>
      
      {/* PANEL 1: LISTA DE CHATS */}
      <div style={{ width: '320px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: '#fff' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Bandeja de Entrada</h2>
          <input 
            type="text" 
            placeholder="Buscar contacto..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pro-input"
            style={{ padding: '0.5rem', fontSize: '0.875rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {['Todos', ...ESTADOS].map(estado => (
              <button 
                key={estado}
                onClick={() => setFilterEstado(estado)}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: filterEstado === estado ? 'var(--primary)' : '#e2e8f0',
                  color: filterEstado === estado ? '#fff' : '#64748b',
                  whiteSpace: 'nowrap'
                }}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredChats.map(c => (
            <div 
              key={c.id} 
              onClick={() => setActiveChat(c)}
              style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                background: activeChat?.id === c.id ? '#eef2ff' : '#fff',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: activeChat?.id === c.id ? 'var(--primary)' : '#0f172a' }}>
                  {c.nombre_prospecto}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {new Date(c.ultima_actividad).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>{c.origen === 'whatsapp' ? '🟢' : '🔵'}</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.mensajes.length > 0 ? c.mensajes[c.mensajes.length - 1].cuerpo : 'Sin mensajes'}
                </span>
              </div>
            </div>
          ))}
          {filteredChats.length === 0 && (
             <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
               No se encontraron chats.
             </div>
          )}
        </div>
      </div>

      {/* PANEL 2: CHAT ACTIVO */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#efeae2' }}>
        {activeChat ? (
          <>
            {/* Header del Chat */}
            <div style={{ padding: '1rem 1.5rem', background: '#fff', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{activeChat.nombre_prospecto}</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{activeChat.contacto_id}</span>
              </div>
            </div>

            {/* Mensajes */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeChat.mensajes.map((m, i) => (
                <div key={i} style={{ alignSelf: m.es_entrante ? 'flex-start' : 'flex-end', maxWidth: '75%' }}>
                  <div style={{ 
                    background: m.es_entrante ? '#fff' : '#dcf8c6', 
                    padding: '0.75rem 1rem', 
                    borderRadius: m.es_entrante ? '0 12px 12px 12px' : '12px 0 12px 12px',
                    fontSize: '0.9rem', 
                    color: '#111', 
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    lineHeight: '1.4'
                  }}>
                    {m.cuerpo}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: m.es_entrante ? 'left' : 'right', marginTop: '0.25rem' }}>
                    {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '1rem 1.5rem', background: '#f0f2f5' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  value={mensajeText}
                  onChange={e => setMensajeText(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  style={{ flex: 1, padding: '1rem', borderRadius: '24px', border: 'none', outline: 'none', fontSize: '0.9rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                />
                <button type="submit" style={{ background: '#00a884', color: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  ➤
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <h2>Selecciona un chat para empezar</h2>
          </div>
        )}
      </div>

      {/* PANEL 3: INFO DEL CONTACTO */}
      {activeChat && (
        <div style={{ width: '280px', borderLeft: '1px solid var(--border-color)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
             <div style={{ width: '64px', height: '64px', background: 'var(--primary)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600, margin: '0 auto 1rem' }}>
               {activeChat.nombre_prospecto.charAt(0).toUpperCase()}
             </div>
             <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{activeChat.nombre_prospecto}</h3>
             <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{activeChat.origen === 'whatsapp' ? 'WhatsApp Business' : 'Facebook Messenger'}</p>
          </div>
          
          <div style={{ padding: '1.5rem', flex: 1 }}>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '0.75rem' }}>Detalles</h4>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Teléfono / ID</label>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{activeChat.contacto_id}</div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Estado del Lead</label>
              <select 
                value={activeChat.estado} 
                onChange={(e) => handleStateChange(e.target.value)}
                className="pro-input"
                style={{ padding: '0.5rem', fontSize: '0.85rem' }}
              >
                {ESTADOS.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

            {activeChat.estado !== 'Convertidos' && (
              <button 
                onClick={handleConvert} 
                className="pro-btn" 
                style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '0.85rem' }}
              >
                ⭐ Convertir a Cliente
              </button>
            )}
            
            {activeChat.estado === 'Convertidos' && (
              <div style={{ textAlign: 'center', padding: '0.75rem', background: '#ecfdf5', color: '#059669', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                ✓ Cliente Oficial
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
