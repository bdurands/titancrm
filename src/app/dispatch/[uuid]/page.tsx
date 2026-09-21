import React from 'react';
import { PrismaClient } from '@prisma/client';
import DispatchClient from './DispatchClient';

const prisma = new PrismaClient();

export default async function DispatchPage({ params }: { params: Promise<{ uuid: string }> }) {
  const resolvedParams = await params;
  
  const pedido = await prisma.pedido.findUnique({
    where: { dispatch_uuid: resolvedParams.uuid },
    include: {
      cliente: true,
      producto: true,
      origen_almacen: true
    }
  });

  if (!pedido) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Viaje no encontrado</h2>
        <p>El código de despacho no existe o es inválido.</p>
      </div>
    );
  }

  // Pass it to the client side component
  return <DispatchClient pedido={pedido} />;
}
