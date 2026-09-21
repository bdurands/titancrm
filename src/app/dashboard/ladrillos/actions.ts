'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getLadrillos() {
  try {
    return await prisma.producto.findMany({
      orderBy: { tipo: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching ladrillos:", error);
    return [];
  }
}

export async function createLadrillo(formData: FormData) {
  const tipo = formData.get('tipo') as string;
  if (!tipo) return { error: 'El tipo es requerido' };

  try {
    await prisma.producto.create({
      data: { tipo }
    });
    revalidatePath('/dashboard/ladrillos');
    return { success: true };
  } catch (error) {
    return { error: 'Error al crear el ladrillo' };
  }
}

export async function deleteLadrillo(id: string) {
  try {
    await prisma.producto.delete({
      where: { id }
    });
    revalidatePath('/dashboard/ladrillos');
    return { success: true };
  } catch (error) {
    return { error: 'Error al eliminar el ladrillo. Podría estar en uso.' };
  }
}
