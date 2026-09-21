'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function getVendedores() {
  return await prisma.vendedor.findMany({
    orderBy: { nombre: 'asc' }
  });
}

export async function createVendedor(formData: FormData) {
  const nombre = formData.get('nombre') as string;
  if (!nombre) return { success: false, error: 'Nombre es requerido' };

  try {
    await prisma.vendedor.create({
      data: { nombre }
    });
    revalidatePath('/dashboard/vendedores');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteVendedor(id: string) {
  try {
    const check = await prisma.pedido.findFirst({ where: { vendedor_id: id } });
    if (check) {
      return { success: false, error: 'No se puede eliminar, este vendedor tiene pedidos asociados.' };
    }

    await prisma.vendedor.delete({ where: { id } });
    revalidatePath('/dashboard/vendedores');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
