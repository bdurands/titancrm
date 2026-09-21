import React from 'react';
import MantenimientoClient from './MantenimientoClient';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function MantenimientoPage() {
  const mantenimientos = await prisma.mantenimiento.findMany({
    include: {
      conductor: true,
      camion: true
    },
    orderBy: { fecha: 'desc' }
  });

  const parsedMantenimientos = mantenimientos.map(m => ({
    ...m,
    costo: Number(m.costo),
  }));

  const conductores = await prisma.conductor.findMany({ orderBy: { nombres_apellidos: 'asc' } });
  const camiones = await prisma.camion.findMany({ orderBy: { placa: 'asc' } });

  return <MantenimientoClient initialData={parsedMantenimientos} conductores={conductores} camiones={camiones} />;
}
