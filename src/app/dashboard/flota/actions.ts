'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getCamiones() {
  try {
    return await prisma.camion.findMany({
      include: {
        conductores: true
      },
      orderBy: { placa: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching camiones:", error);
    return [];
  }
}

export async function createCamion(formData: FormData) {
  const marca = formData.get('marca') as string;
  const modelo = formData.get('modelo') as string;
  const placa = formData.get('placa') as string;
  const sinotrack_device_id = formData.get('sinotrack_device_id') as string || null;
  const sinotrack_password = formData.get('sinotrack_password') as string || null;

  if (!marca || !modelo || !placa) return { error: 'Marca, modelo y placa son requeridos' };

  try {
    await prisma.camion.create({
      data: { marca, modelo, placa, sinotrack_device_id, sinotrack_password }
    });
    revalidatePath('/dashboard/flota');
    return { success: true };
  } catch (error) {
    // If it's a unique constraint error (P2002) for placa
    return { error: 'Error al registrar. Verifica que la placa no esté duplicada.' };
  }
}

export async function deleteCamion(id: string) {
  try {
    await prisma.camion.delete({
      where: { id }
    });
    revalidatePath('/dashboard/flota');
    return { success: true };
  } catch (error) {
    return { error: 'Error al eliminar el camión. Podría tener conductores o pedidos asociados.' };
  }
}
export async function updateCamion(id: string, formData: FormData) {
  const marca = formData.get('marca') as string;
  const modelo = formData.get('modelo') as string;
  const placa = formData.get('placa') as string;
  const sinotrack_device_id = formData.get('sinotrack_device_id') as string || null;
  const sinotrack_password = formData.get('sinotrack_password') as string || null;

  if (!marca || !modelo || !placa) return { error: 'Marca, modelo y placa son requeridos' };

  try {
    await prisma.camion.update({
      where: { id },
      data: { marca, modelo, placa, sinotrack_device_id, sinotrack_password }
    });
    revalidatePath('/dashboard/flota');
    return { success: true };
  } catch (error) {
    return { error: 'Error al editar el camión. Verifica que la placa no esté duplicada.' };
  }
}
