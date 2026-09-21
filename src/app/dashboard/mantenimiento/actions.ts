'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function createMantenimiento(formData: FormData) {
  const conductor_id = formData.get('conductor_id') as string;
  const camion_id = formData.get('camion_id') as string;
  const tipo = formData.get('tipo') as string;
  const detalle = formData.get('detalle') as string;
  const costo = parseFloat(formData.get('costo') as string);
  
  if (!conductor_id || !camion_id || !tipo || !detalle || isNaN(costo) || costo < 0) {
    return { error: 'Todos los campos son obligatorios y el costo debe ser válido.' };
  }

  try {
    await prisma.mantenimiento.create({
      data: {
        conductor_id,
        camion_id,
        tipo,
        detalle,
        costo
      }
    });
    revalidatePath('/dashboard/mantenimiento');
    return { success: true };
  } catch (error) {
    return { error: 'Error al registrar el mantenimiento.' };
  }
}
