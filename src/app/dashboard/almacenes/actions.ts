'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getAlmacenes() {
  try {
    return await prisma.almacen.findMany({
      include: {
        encargado: true,
        stock: {
          include: {
            producto: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching almacenes:", error);
    return [];
  }
}

export async function createAlmacen(formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const direccion = formData.get('direccion') as string;
  const es_planta_choque = formData.get('es_planta_choque') === 'on';

  if (!nombre || !direccion) return { error: 'Nombre y dirección son requeridos' };

  try {
    await prisma.almacen.create({
      data: { 
        nombre,
        direccion,
        es_planta_choque
      }
    });
    revalidatePath('/dashboard/almacenes');
    return { success: true };
  } catch (error) {
    return { error: 'Error al crear el almacén' };
  }
}

export async function deleteAlmacen(id: string) {
  try {
    await prisma.almacen.delete({
      where: { id }
    });
    revalidatePath('/dashboard/almacenes');
    return { success: true };
  } catch (error) {
    return { error: 'Error al eliminar el almacén. Podría tener stock o estar asociado a traslados.' };
  }
}
