'use client'

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Leaflet necesita renderizarse solo en el cliente porque usa 'window'
const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });

export default function TrackingClient({ pedido }: { pedido: any }) {
  const [lat, setLat] = useState(pedido.latitud_actual || -12.046374);
  const [lng, setLng] = useState(pedido.longitud_actual || -77.042793);
  const [isEntregado, setIsEntregado] = useState(pedido.estado === 'entregado');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tracking/${pedido.tracking_uuid}`);
        const data = await res.json();
        if (data.estado === 'entregado') {
          setIsEntregado(true);
        } else if (data.latitud_actual && data.longitud_actual) {
          setLat(data.latitud_actual);
          setLng(data.longitud_actual);
        }
      } catch (err) {
        console.error("Error fetching location", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pedido.tracking_uuid]);

  if (isEntregado) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ecfdf5', padding: '1rem' }}>
        <div style={{ background: 'white', padding: '3rem 2rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '450px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#047857', marginBottom: '1rem' }}>¡Pedido Entregado!</h1>
          <p style={{ color: '#065f46', fontSize: '1.1rem' }}>
            Hola {pedido.cliente.nombres}, este pedido ya ha llegado a su destino.
          </p>
          <p style={{ color: '#4b5563', fontSize: '0.875rem', marginTop: '1.5rem' }}>
            Por motivos de seguridad, la ubicación en vivo ha sido desactivada. ¡Gracias por confiar en Grupo A&S!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Rastreo en Vivo</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Pedido de {pedido.cantidad} Ladrillos</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{pedido.cliente.nombres}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Camión: {pedido.camion?.placa || 'Asignado'}</div>
        </div>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapComponent lat={lat} lng={lng} />
        
        {/* Floating Info Box */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, width: '90%', maxWidth: '400px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            🚚
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '1rem' }}>Tu pedido está en camino</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Destino: {pedido.direccion_entrega}</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', fontWeight: 600 }}>
              Actualizado hace unos segundos...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
