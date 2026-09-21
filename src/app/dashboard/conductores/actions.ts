'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getConductores() {
  try {
    return await prisma.conductor.findMany({
      include: {
        camion_asignado: true
      },
      orderBy: { nombres_apellidos: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching conductores:", error);
    return [];
  }
}

export async function createConductor(formData: FormData) {
  const nombres_apellidos = formData.get('nombres_apellidos') as string;
  const dni = formData.get('dni') as string;
  const camion_asignado_id = formData.get('camion_asignado_id') as string | null;

  if (!nombres_apellidos || !dni) return { error: 'Nombres y DNI son requeridos' };

  try {
    await prisma.conductor.create({
      data: { 
        nombres_apellidos, 
        dni, 
        camion_asignado_id: camion_asignado_id || null 
      }
    });
    revalidatePath('/dashboard/conductores');
    return { success: true };
  } catch (error) {
    return { error: 'Error al registrar. Verifica que el DNI no esté duplicado.' };
  }
}

export async function deleteConductor(id: string) {
  try {
    await prisma.conductor.delete({
      where: { id }
    });
    revalidatePath('/dashboard/conductores');
    return { success: true };
  } catch (error) {
    return { error: 'Error al eliminar el conductor. Podría estar asociado a traslados o pedidos.' };
  }
}
