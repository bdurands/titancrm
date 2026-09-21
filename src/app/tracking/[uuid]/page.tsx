import React from 'react';
import { PrismaClient } from '@prisma/client';
import TrackingClient from './TrackingClient';

const prisma = new PrismaClient();

export default async function TrackingPage({ params }: { params: { uuid: string } }) {
  const { uuid } = await params; // Next 15 specific, await params

  const rawPedido = await prisma.pedido.findUnique({
    where: { tracking_uuid: uuid },
    include: {
      cliente: true,
      camion: true
    }
  });

  if (!rawPedido) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: '1rem' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>Enlace Inválido</h1>
          <p style={{ color: '#4b5563' }}>El enlace de rastreo proporcionado no existe o ha expirado.</p>
        </div>
      </div>
    );
  }

  if (rawPedido.estado === 'entregado') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ecfdf5', padding: '1rem' }}>
        <div style={{ background: 'white', padding: '3rem 2rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '450px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#047857', marginBottom: '1rem' }}>¡Pedido Entregado!</h1>
          <p style={{ color: '#065f46', fontSize: '1.1rem' }}>
            Hola {rawPedido.cliente.nombres}, este pedido ya ha llegado a su destino.
          </p>
          <p style={{ color: '#4b5563', fontSize: '0.875rem', marginTop: '1.5rem' }}>
            Por motivos de seguridad, la ubicación en vivo ha sido desactivada. ¡Gracias por confiar en Grupo A&S!
          </p>
        </div>
      </div>
    );
  }

  const pedido = {
    ...rawPedido,
    total_cobrar: Number(rawPedido.total_cobrar)
  };

  return <TrackingClient pedido={pedido} />;
}
