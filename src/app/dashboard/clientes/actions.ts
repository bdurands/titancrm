'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getClientes() {
  try {
    return await prisma.cliente.findMany({
      orderBy: { nombres: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching clientes:", error);
    return [];
  }
}

export async function createCliente(formData: FormData) {
  const nombres = formData.get('nombres') as string;
  const celular = formData.get('celular') as string || '';

  if (!nombres) return { error: 'El nombre es requerido' };

  try {
    await prisma.cliente.create({
      data: { 
        nombres, 
        celular,
        origen: 'Directo',
        estado: 'Cliente Activo'
      }
    });
    revalidatePath('/dashboard/clientes');
    return { success: true };
  } catch (error) {
    return { error: 'Error al registrar al cliente.' };
  }
}

export async function deleteCliente(id: string) {
  try {
    await prisma.cliente.delete({
      where: { id }
    });
    revalidatePath('/dashboard/clientes');
    return { success: true };
  } catch (error) {
    return { error: 'Error al eliminar. Podría estar asociado a pedidos.' };
  }
}
