'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getTraslados() {
  try {
    return await prisma.trasladoInterno.findMany({
      include: {
        origen: true,
        destino: true,
        producto: true,
        conductor: { include: { camion_asignado: true } }
      },
      orderBy: { fecha: 'desc' }
    });
  } catch (error) {
    console.error("Error fetching traslados:", error);
    return [];
  }
}

export async function getAlmacenes() {
  return await prisma.almacen.findMany({ orderBy: { nombre: 'asc' } });
}

export async function getProductos() {
  return await prisma.producto.findMany({ orderBy: { tipo: 'asc' } });
}

export async function getConductores() {
  return await prisma.conductor.findMany({ orderBy: { nombres_apellidos: 'asc' } });
}

export async function createTraslado(formData: FormData) {
  const origen_id = formData.get('origen_id') as string;
  const destino_id = formData.get('destino_id') as string;
  const producto_id = formData.get('producto_id') as string;
  const cantidad = parseInt(formData.get('cantidad') as string, 10);
  const conductor_id = formData.get('conductor_id') as string;

  if (!origen_id || !destino_id || !producto_id || !conductor_id || isNaN(cantidad) || cantidad <= 0) {
    return { error: 'Todos los campos son obligatorios y la cantidad debe ser mayor a 0.' };
  }

  if (origen_id === destino_id) {
    return { error: 'El almacén de origen y destino no pueden ser el mismo.' };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Verificar origen
      const origen = await tx.almacen.findUnique({ where: { id: origen_id } });
      if (!origen) throw new Error("Origen no encontrado");

      // Si no es planta de choque, verificar y descontar stock
      if (!origen.es_planta_choque) {
        const stockOrigen = await tx.stock.findUnique({
          where: { almacen_id_producto_id: { almacen_id: origen_id, producto_id } }
        });

        if (!stockOrigen || stockOrigen.cantidad_disponible < cantidad) {
          throw new Error(`No hay suficiente stock en el almacén de origen. Disponible: ${stockOrigen?.cantidad_disponible || 0}`);
        }

        await tx.stock.update({
          where: { id: stockOrigen.id },
          data: { cantidad_disponible: { decrement: cantidad } }
        });
      }

      // 2. Crear el traslado
      await tx.trasladoInterno.create({
        data: {
          origen_id,
          destino_id,
          producto_id,
          cantidad,
          conductor_id,
          estado: 'En tránsito'
        }
      });

      return { success: true };
    });
  } catch (error: any) {
    return { error: error.message || 'Error interno al crear el traslado' };
  } finally {
    revalidatePath('/dashboard/traslados');
  }
}

export async function recibirTraslado(id_traslado: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const traslado = await tx.trasladoInterno.findUnique({ where: { id_traslado } });
      if (!traslado || traslado.estado === 'Recibido') {
        throw new Error("Traslado no encontrado o ya fue recibido.");
      }

      // 1. Actualizar estado
      await tx.trasladoInterno.update({
        where: { id_traslado },
        data: { estado: 'Recibido' }
      });

      // 2. Aumentar stock en destino
      const stockDestino = await tx.stock.findUnique({
        where: { almacen_id_producto_id: { almacen_id: traslado.destino_id, producto_id: traslado.producto_id } }
      });

      if (stockDestino) {
        await tx.stock.update({
          where: { id: stockDestino.id },
          data: { cantidad_disponible: { increment: traslado.cantidad } }
        });
      } else {
        await tx.stock.create({
          data: {
            almacen_id: traslado.destino_id,
            producto_id: traslado.producto_id,
            cantidad_disponible: traslado.cantidad
          }
        });
      }

      return { success: true };
    });
  } catch (error: any) {
    return { error: error.message || 'Error al recibir el traslado.' };
  } finally {
    revalidatePath('/dashboard/traslados');
  }
}
export async function updateTraslado(id_traslado: string, formData: FormData) {
  const origen_id = formData.get('origen_id') as string;
  const destino_id = formData.get('destino_id') as string;
  const producto_id = formData.get('producto_id') as string;
  const cantidad = parseInt(formData.get('cantidad') as string, 10);
  const conductor_id = formData.get('conductor_id') as string;

  if (!origen_id || !destino_id || !producto_id || !conductor_id || isNaN(cantidad) || cantidad <= 0) {
    return { error: 'Todos los campos son obligatorios y la cantidad debe ser mayor a 0.' };
  }

  try {
    // Nota: Como es edición de administrador, actualizamos el registro directo. 
    // Los ajustes manuales de stock, de ser necesarios, los hará el admin.
    await prisma.trasladoInterno.update({
      where: { id_traslado },
      data: {
        origen_id,
        destino_id,
        producto_id,
        cantidad,
        conductor_id
      }
    });
    revalidatePath('/dashboard/traslados');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Error al editar el traslado' };
  }
}
