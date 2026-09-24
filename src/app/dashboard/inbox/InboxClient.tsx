'use client'

import React, { useState, useEffect, useRef } from 'react';
import { updateEstadoLead, sendMensajeToLead, convertToClient, getConversaciones, updateNombreLead, updateNotasLead, updateEtiquetasLead } from '../leads/actions';

type Mensaje = { id: string; cuerpo: string; es_entrante: boolean; fecha: Date };
type Conversacion = {
  id: string; origen: string; contacto_id: string; nombre_prospecto: string; estado: string; 
  etiquetas?: string | null; notas?: string | null; foto_perfil?: string | null;
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
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [notasText, setNotasText] = useState('');
  const [tagInput, setTagInput] = useState('');
  
  const [respuestasRapidas, setRespuestasRapidas] = useState<string[]>([]);
  const [isConfiguringRespuestas, setIsConfiguringRespuestas] = useState(false);
  const [newRespuesta, setNewRespuesta] = useState('');
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Cargar respuestas rápidas guardadas
  useEffect(() => {
    const saved = localStorage.getItem('respuestasRapidas');
    if (saved) {
      try {
        setRespuestasRapidas(JSON.parse(saved));
      } catch (e) { }
    } else {
      setRespuestasRapidas([
        "¡Hola! 👋 ¿En qué te podemos ayudar?",
        "Sí, tenemos stock disponible. 🧱",
        "Nuestra cuenta BCP es 191-XXXXXXXX-X-XX",
        "El pedido llegará hoy por la tarde. 🚚",
        "¿Me podrías enviar la dirección exacta?"
      ]);
    }
  }, []);

  // Sincronizar datos al cambiar de chat
  useEffect(() => {
    if (activeChat) {
      setTempName(activeChat.nombre_prospecto);
      setNotasText(activeChat.notas || '');
      setIsEditingName(false);
    }
  }, [activeChat?.id]);

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
    const confirmacion = window.confirm(`¿Convertir a ${activeChat.nombre_prospecto} en Cliente Oficial?`);
    if (!confirmacion) return;
    
    try {
      const formData = new FormData();
      formData.append('conversacion_id', activeChat.id);
      
      const res = await convertToClient(formData);
      if (res.success) {
        alert('¡Cliente creado exitosamente!');
        window.location.reload();
      } else {
        alert('Error: ' + res.error);
      }
    } catch (error: any) {
      alert('Error en la petición: ' + error.message);
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

  const handleSaveName = async () => {
    if (!activeChat || !tempName.trim()) return;
    const res = await updateNombreLead(activeChat.id, tempName.trim());
    if (res.success) {
      setConversaciones(conversaciones.map(c => c.id === activeChat.id ? { ...c, nombre_prospecto: tempName.trim() } : c));
      setActiveChat({ ...activeChat, nombre_prospecto: tempName.trim() });
      setIsEditingName(false);
    }
  };

  const handleSaveNotas = async () => {
    if (!activeChat) return;
    const res = await updateNotasLead(activeChat.id, notasText);
    if (res.success) {
      setConversaciones(conversaciones.map(c => c.id === activeChat.id ? { ...c, notas: notasText } : c));
      setActiveChat({ ...activeChat, notas: notasText });
      alert('Notas guardadas');
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !tagInput.trim()) return;
    
    const tagsArray = activeChat.etiquetas ? activeChat.etiquetas.split(',').map(t => t.trim()) : [];
    if (tagsArray.includes(tagInput.trim())) return; // Ya existe
    
    tagsArray.push(tagInput.trim());
    const newTags = tagsArray.join(',');
    
    const res = await updateEtiquetasLead(activeChat.id, newTags);
    if (res.success) {
      setConversaciones(conversaciones.map(c => c.id === activeChat.id ? { ...c, etiquetas: newTags } : c));
      setActiveChat({ ...activeChat, etiquetas: newTags });
      setTagInput('');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!activeChat || !activeChat.etiquetas) return;
    
    let tagsArray = activeChat.etiquetas.split(',').map(t => t.trim());
    tagsArray = tagsArray.filter(t => t !== tagToRemove);
    const newTags = tagsArray.join(',');
    
    const res = await updateEtiquetasLead(activeChat.id, newTags);
    if (res.success) {
      setConversaciones(conversaciones.map(c => c.id === activeChat.id ? { ...c, etiquetas: newTags } : c));
      setActiveChat({ ...activeChat, etiquetas: newTags });
    }
  };

  const handleAddRespuesta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRespuesta.trim()) return;
    const updated = [...respuestasRapidas, newRespuesta.trim()];
    setRespuestasRapidas(updated);
    localStorage.setItem('respuestasRapidas', JSON.stringify(updated));
    setNewRespuesta('');
  };

  const handleRemoveRespuesta = (index: number) => {
    const updated = respuestasRapidas.filter((_, i) => i !== index);
    setRespuestasRapidas(updated);
    localStorage.setItem('respuestasRapidas', JSON.stringify(updated));
  };

  // Filtrado
  const filteredChats = conversaciones.filter(c => {
    const matchesSearch = c.nombre_prospecto.toLowerCase().includes(searchTerm.toLowerCase()) || c.contacto_id.includes(searchTerm);
    const matchesEstado = filterEstado === 'Todos' || c.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  return (
    <div className="inbox-wrapper">
      
      {/* PANEL 1: LISTA DE CHATS */}
      <div className={`inbox-panel-list ${activeChat ? 'hidden-mobile' : ''}`}>
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
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, backgroundImage: c.foto_perfil ? `url(${c.foto_perfil})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  {!c.foto_perfil && c.nombre_prospecto.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: activeChat?.id === c.id ? 'var(--primary)' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.nombre_prospecto}
                    </span>
                    <span suppressHydrationWarning style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0 }}>
                      {new Date(c.ultima_actividad).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem' }}>{c.origen === 'whatsapp' ? '🟢' : '🔵'}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.mensajes.length > 0 ? c.mensajes[c.mensajes.length - 1].cuerpo : 'Sin mensajes'}
                    </span>
                  </div>
                  {c.etiquetas && (
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.35rem', flexWrap: 'nowrap', overflowX: 'hidden' }}>
                      {c.etiquetas.split(',').slice(0, 2).map((t, i) => (
                        <span key={i} style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>{t.trim()}</span>
                      ))}
                      {c.etiquetas.split(',').length > 2 && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>+</span>}
                    </div>
                  )}
                </div>
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
      <div className={`inbox-panel-chat ${!activeChat ? 'hidden-mobile' : ''}`}>
        {activeChat ? (
          <>
            {/* Header del Chat */}
            <div style={{ padding: '1rem 1.5rem', background: '#fff', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button 
                  className="inbox-back-btn"
                  onClick={() => setActiveChat(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{activeChat.nombre_prospecto}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{activeChat.contacto_id}</span>
                </div>
              </div>
              <button 
                className="inbox-info-toggle"
                onClick={() => setShowContactInfo(true)}
                title="Ver info del contacto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </button>
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
                  <div suppressHydrationWarning style={{ fontSize: '0.7rem', color: '#64748b', textAlign: m.es_entrante ? 'left' : 'right', marginTop: '0.25rem' }}>
                    {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Respuestas Rápidas */}
            <div style={{ padding: '0.5rem 1.5rem', background: '#fff', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsConfiguringRespuestas(!isConfiguringRespuestas)}>
                  ⚡ Rápidas (⚙️):
                </span>
                {respuestasRapidas.map((rr, i) => (
                  <button 
                    key={i} 
                    onClick={() => setMensajeText(rr)} 
                    style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    {rr.length > 25 ? rr.substring(0, 25) + '...' : rr}
                  </button>
                ))}
              </div>
              
              {isConfiguringRespuestas && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Configurar Respuestas Rápidas</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
                    {respuestasRapidas.map((rr, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.75rem', color: '#334155' }}>{rr}</span>
                        <button onClick={() => handleRemoveRespuesta(i)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>✖</button>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddRespuesta} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" value={newRespuesta} onChange={e => setNewRespuesta(e.target.value)} placeholder="Nueva respuesta rápida..." className="pro-input" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', flex: 1 }} />
                    <button type="submit" className="pro-btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>Añadir</button>
                  </form>
                </div>
              )}
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

      {/* PANEL 3: INFO DEL CONTACTO - Fijo en desktop, flotante en tablet/móvil */}
      {activeChat && (
        <>
          {showContactInfo && <div className="inbox-info-backdrop" onClick={() => setShowContactInfo(false)} />}
          <div className={`inbox-panel-info ${showContactInfo ? 'inbox-panel-info-open' : ''}`}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Info del Contacto</h4>
              <button className="inbox-info-close" onClick={() => setShowContactInfo(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', borderRadius: '6px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
               <div style={{ width: '64px', height: '64px', background: 'var(--primary)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600, margin: '0 auto 1rem', backgroundImage: activeChat.foto_perfil ? `url(${activeChat.foto_perfil})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                 {!activeChat.foto_perfil && activeChat.nombre_prospecto.charAt(0).toUpperCase()}
               </div>
               
               {isEditingName ? (
                  <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                    <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} className="pro-input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem', width: '150px' }} autoFocus />
                    <button onClick={handleSaveName} style={{ background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', padding: '0 0.5rem', cursor: 'pointer' }}>✓</button>
                    <button onClick={() => setIsEditingName(false)} style={{ background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', padding: '0 0.5rem', cursor: 'pointer' }}>X</button>
                  </div>
               ) : (
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {activeChat.nombre_prospecto}
                    <span onClick={() => setIsEditingName(true)} style={{ fontSize: '0.8rem', cursor: 'pointer', color: '#94a3b8' }}>✏️</span>
                  </h3>
               )}

               <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{activeChat.origen === 'whatsapp' ? 'WhatsApp Business' : 'Facebook Messenger'}</p>
            </div>
            
            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
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

              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '0.75rem' }}>Etiquetas</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                {activeChat.etiquetas?.split(',').map((t, i) => t.trim() ? (
                  <span key={i} style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {t.trim()}
                    <span onClick={() => handleRemoveTag(t.trim())} style={{ cursor: 'pointer', opacity: 0.6 }}>&times;</span>
                  </span>
                ) : null)}
              </div>
              <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
                <input type="text" placeholder="Nueva etiqueta..." value={tagInput} onChange={e => setTagInput(e.target.value)} className="pro-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }} />
                <button type="submit" className="pro-btn" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>+</button>
              </form>

              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '0.75rem' }}>Notas Internas</h4>
              <textarea 
                value={notasText} 
                onChange={e => setNotasText(e.target.value)}
                className="pro-input" 
                placeholder="Anota algo sobre este cliente..."
                style={{ width: '100%', minHeight: '80px', padding: '0.5rem', fontSize: '0.85rem', resize: 'vertical', marginBottom: '0.5rem' }}
              />
              <button onClick={handleSaveNotas} className="pro-btn-secondary" style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', borderRadius: '6px' }}>Guardar Notas</button>

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
        </>
      )}

    </div>
  );
}
