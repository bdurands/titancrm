import React from 'react';
import AdminClient from './AdminClient';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function AdministracionPage() {
  const pedidos = await prisma.pedido.findMany({
    where: { estado: 'entregado' },
    select: {
      id_pedido: true,
      fecha_entrega: true,
      fecha: true,
      total_cobrar: true,
      tipo_pago: true
    },
    orderBy: { fecha: 'desc' }
  });

  const parsedPedidos = pedidos.map(p => ({
    ...p,
    total_cobrar: Number(p.total_cobrar),
  }));

  return <AdminClient pedidos={parsedPedidos} />;
}
