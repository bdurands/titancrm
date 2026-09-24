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
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 w-full relative">
      
      {/* PANEL 1: LISTA DE CHATS */}
      <div className={`w-full md:w-80 shrink-0 border-r border-gray-200 flex-col bg-slate-50 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold mb-3">Bandeja de Entrada</h2>
          <input 
            type="text" 
            placeholder="Buscar contacto..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {['Todos', ...ESTADOS].map(estado => (
              <button 
                key={estado}
                onClick={() => setFilterEstado(estado)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterEstado === estado 
                    ? 'bg-primary text-white' 
                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(c => (
            <div 
              key={c.id} 
              onClick={() => setActiveChat(c)}
              className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                activeChat?.id === c.id ? 'bg-indigo-50' : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex gap-3 items-center">
                <div 
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: c.foto_perfil ? `url(${c.foto_perfil})` : 'none' }}
                >
                  {!c.foto_perfil && c.nombre_prospecto.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-semibold text-sm truncate ${
                      activeChat?.id === c.id ? 'text-primary' : 'text-slate-900'
                    }`}>
                      {c.nombre_prospecto}
                    </span>
                    <span suppressHydrationWarning className="text-xs text-slate-400 shrink-0">
                      {new Date(c.ultima_actividad).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm">{c.origen === 'whatsapp' ? '🟢' : '🔵'}</span>
                    <span className="text-xs text-slate-500 truncate">
                      {c.mensajes.length > 0 ? c.mensajes[c.mensajes.length - 1].cuerpo : 'Sin mensajes'}
                    </span>
                  </div>
                  {c.etiquetas && (
                    <div className="flex gap-1 mt-1.5 flex-nowrap overflow-hidden">
                      {c.etiquetas.split(',').slice(0, 2).map((t, i) => (
                        <span key={i} className="bg-indigo-100 text-indigo-700 text-[0.65rem] px-1.5 py-0.5 rounded whitespace-nowrap">
                          {t.trim()}
                        </span>
                      ))}
                      {c.etiquetas.split(',').length > 2 && <span className="text-[0.65rem] text-slate-400">+</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredChats.length === 0 && (
             <div className="p-8 text-center text-slate-400 text-sm">
               No se encontraron chats.
             </div>
          )}
        </div>
      </div>

      {/* PANEL 2: CHAT ACTIVO */}
      <div className={`flex-1 flex-col bg-[#efeae2] ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Header del Chat */}
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveChat(null)}
                  className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{activeChat.nombre_prospecto}</h3>
                  <span className="text-xs text-slate-500">{activeChat.contacto_id}</span>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {activeChat.mensajes.map((m, i) => (
                <div key={i} className={`max-w-[85%] md:max-w-[75%] ${m.es_entrante ? 'self-start' : 'self-end'}`}>
                  <div className={`p-3 text-sm text-slate-900 shadow-sm leading-relaxed ${
                    m.es_entrante 
                      ? 'bg-white rounded-tr-xl rounded-br-xl rounded-bl-xl' 
                      : 'bg-[#dcf8c6] rounded-tl-xl rounded-tr-xl rounded-bl-xl'
                  }`}>
                    {m.cuerpo}
                  </div>
                  <div suppressHydrationWarning className={`text-[0.7rem] text-slate-500 mt-1 ${m.es_entrante ? 'text-left' : 'text-right'}`}>
                    {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Respuestas Rápidas */}
            <div className="p-2 bg-white border-t border-gray-200 shrink-0">
              <div className="flex gap-2 overflow-x-auto items-center pb-1 scrollbar-hide">
                <span 
                  className="text-xs font-semibold text-slate-400 flex items-center cursor-pointer shrink-0"
                  onClick={() => setIsConfiguringRespuestas(!isConfiguringRespuestas)}
                >
                  ⚡ Rápidas (⚙️):
                </span>
                {respuestasRapidas.map((rr, i) => (
                  <button 
                    key={i} 
                    onClick={() => setMensajeText(rr)} 
                    className="shrink-0 bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-3 py-1.5 text-xs whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    {rr.length > 25 ? rr.substring(0, 25) + '...' : rr}
                  </button>
                ))}
              </div>
              
              {isConfiguringRespuestas && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-600 mb-2">Configurar Respuestas Rápidas</h4>
                  <div className="flex flex-col gap-1.5 mb-3">
                    {respuestasRapidas.map((rr, i) => (
                      <div key={i} className="flex justify-between items-center bg-white px-2 py-1.5 rounded border border-slate-200">
                        <span className="text-xs text-slate-700 truncate mr-2">{rr}</span>
                        <button onClick={() => handleRemoveRespuesta(i)} className="text-red-500 hover:text-red-700 text-lg leading-none">&times;</button>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddRespuesta} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newRespuesta} 
                      onChange={e => setNewRespuesta(e.target.value)} 
                      placeholder="Nueva respuesta rápida..." 
                      className="flex-1 p-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                    <button type="submit" className="bg-primary text-white px-3 py-1.5 text-xs rounded hover:bg-primary/90">Añadir</button>
                  </form>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 md:p-4 bg-[#f0f2f5] shrink-0">
              <form onSubmit={handleSend} className="flex gap-2 md:gap-3">
                <input 
                  type="text" 
                  value={mensajeText}
                  onChange={e => setMensajeText(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 p-3 md:p-4 rounded-full border-none outline-none text-sm shadow-sm"
                />
                <button type="submit" className="bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full w-12 h-12 flex items-center justify-center shrink-0 shadow-sm transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 flex-col">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-xl">Selecciona un chat para empezar</h2>
          </div>
        )}
      </div>

      {/* PANEL 3: INFO DEL CONTACTO */}
      {activeChat && (
        <div className="w-72 shrink-0 border-l border-gray-200 bg-white flex-col hidden xl:flex">
          <div className="p-6 border-b border-gray-200 text-center">
             <div 
               className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-semibold mx-auto mb-4 bg-cover bg-center"
               style={{ backgroundImage: activeChat.foto_perfil ? `url(${activeChat.foto_perfil})` : 'none' }}
             >
               {!activeChat.foto_perfil && activeChat.nombre_prospecto.charAt(0).toUpperCase()}
             </div>
             
             {isEditingName ? (
                <div className="flex gap-1 justify-center items-center">
                  <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} className="p-1 text-sm border rounded w-32 focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
                  <button onClick={handleSaveName} className="bg-emerald-500 text-white p-1 rounded hover:bg-emerald-600"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>
                  <button onClick={() => setIsEditingName(false)} className="bg-red-500 text-white p-1 rounded hover:bg-red-600"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </div>
             ) : (
                <h3 className="text-lg font-bold flex items-center justify-center gap-2 text-slate-900">
                  {activeChat.nombre_prospecto}
                  <button onClick={() => setIsEditingName(true)} className="text-slate-400 hover:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </button>
                </h3>
             )}

             <p className="text-xs text-slate-500 mt-1">{activeChat.origen === 'whatsapp' ? 'WhatsApp Business' : 'Facebook Messenger'}</p>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            <h4 className="text-xs uppercase text-slate-400 font-bold mb-3 tracking-wider">Detalles</h4>
            
            <div className="mb-4">
              <label className="text-xs text-slate-500 block mb-1">Teléfono / ID</label>
              <div className="text-sm font-medium text-slate-800">{activeChat.contacto_id}</div>
            </div>

            <div className="mb-6">
              <label className="text-xs text-slate-500 block mb-1">Estado del Lead</label>
              <select 
                value={activeChat.estado} 
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {ESTADOS.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>

            <hr className="border-t border-gray-200 my-6" />

            <h4 className="text-xs uppercase text-slate-400 font-bold mb-3 tracking-wider">Etiquetas</h4>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {activeChat.etiquetas?.split(',').map((t, i) => t.trim() ? (
                <span key={i} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {t.trim()}
                  <button onClick={() => handleRemoveTag(t.trim())} className="opacity-60 hover:opacity-100">&times;</button>
                </span>
              ) : null)}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2 mb-6">
              <input type="text" placeholder="Nueva etiqueta..." value={tagInput} onChange={e => setTagInput(e.target.value)} className="flex-1 p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
              <button type="submit" className="bg-primary text-white px-2.5 py-1.5 text-xs rounded hover:bg-primary/90">+</button>
            </form>

            <h4 className="text-xs uppercase text-slate-400 font-bold mb-3 tracking-wider">Notas Internas</h4>
            <textarea 
              value={notasText} 
              onChange={e => setNotasText(e.target.value)}
              placeholder="Anota algo sobre este cliente..."
              className="w-full min-h-[80px] p-2 text-sm border border-gray-300 rounded resize-y mb-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={handleSaveNotas} className="w-full bg-slate-100 text-slate-700 py-2 text-xs font-semibold rounded hover:bg-slate-200 transition-colors">Guardar Notas</button>

            <hr className="border-t border-gray-200 my-6" />

            {activeChat.estado !== 'Convertidos' && (
              <button 
                onClick={handleConvert} 
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2.5 text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-colors shadow-sm"
              >
                ⭐ Convertir a Cliente
              </button>
            )}
            
            {activeChat.estado === 'Convertidos' && (
              <div className="text-center p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold border border-emerald-100">
                ✓ Cliente Oficial
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
