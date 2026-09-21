'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { sendWhatsAppNotification } from '@/lib/whatsapp'

const prisma = new PrismaClient()

export async function getPedidos() {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        cliente: true,
        producto: true,
        origen_almacen: true,
        vendedor: true,
        conductor: true,
        camion: true
      },
      orderBy: { fecha: 'desc' }
    });
    
    return pedidos.map(p => ({
      ...p,
      total_cobrar: Number(p.total_cobrar)
    }));
  } catch (error) {
    console.error("Error fetching pedidos:", error);
    return [];
  }
}

export async function getOptions() {
  const clientes = await prisma.cliente.findMany({ orderBy: { nombres: 'asc' } });
  const productos = await prisma.producto.findMany({ orderBy: { tipo: 'asc' } });
  const almacenes = await prisma.almacen.findMany({ orderBy: { nombre: 'asc' } });
  const camiones = await prisma.camion.findMany({ orderBy: { placa: 'asc' } });
  const vendedores = await prisma.vendedor.findMany({ orderBy: { nombre: 'asc' } });
  const conductores = await prisma.conductor.findMany({ orderBy: { nombres_apellidos: 'asc' } });
  return { clientes, productos, almacenes, camiones, vendedores, conductores };
}

import fs from 'fs';
import path from 'path';

export async function createPedido(formData: FormData) {
  try {
    const data: any = {
      cliente_id: formData.get('cliente_id') as string,
      producto_id: formData.get('producto_id') as string,
      origen_almacen_id: formData.get('origen_id') as string,
      vendedor_id: formData.get('vendedor_id') as string,
      cantidad: parseInt(formData.get('cantidad') as string),
      unidad_medida: 'Unidades',
      total_cobrar: parseFloat(formData.get('total_cobrar') as string),
      tipo_pago: formData.get('tipo_pago') as string,
      direccion_entrega: formData.get('direccion_entrega') as string,
      estado: 'creado'
    };

    const linkUbicacion = formData.get('link_ubicacion');
    if (linkUbicacion) data.link_ubicacion = linkUbicacion as string;

    const fechaEntrega = formData.get('fecha_entrega');
    if (fechaEntrega) data.fecha_entrega = new Date(fechaEntrega as string);

    const conductorId = formData.get('conductor_id');
    if (conductorId) {
      data.conductor_id = conductorId as string;
      // Generar dispatch UUID para la app del chofer
      data.dispatch_uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    if (['Transferencia', 'Yape', 'Plin', 'Deposito'].includes(data.tipo_pago)) {
      data.nro_operacion = formData.get('nro_operacion') as string;
      const fOp = formData.get('fecha_operacion');
      if (fOp) data.fecha_operacion = new Date(fOp as string);
      
      const file = formData.get('foto_comprobante') as File;
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueName = Date.now() + '-' + file.name;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, uniqueName), buffer);
        data.foto_comprobante = `/uploads/${uniqueName}`;
      }
    }

    const pedido = await prisma.pedido.create({ data });
    revalidatePath('/dashboard/pedidos');
    return { success: true, dispatch_uuid: data.dispatch_uuid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEstadoPedido(id_pedido: string, nuevoEstado: string, camion_id?: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({ 
        where: { id_pedido: parseInt(id_pedido) },
        include: { origen_almacen: true, cliente: true, producto: true } 
      });

      if (!pedido) throw new Error("Pedido no encontrado.");
      if (pedido.estado === 'entregado') throw new Error("El pedido ya está entregado.");

      // Si el nuevo estado es "entregado", descontamos el stock (si el origen no es planta de choque)
      if (nuevoEstado === 'entregado' && !pedido.origen_almacen.es_planta_choque) {
        const stockOrigen = await tx.stock.findUnique({
          where: { almacen_id_producto_id: { almacen_id: pedido.origen_almacen_id, producto_id: pedido.producto_id } }
        });

        if (!stockOrigen || stockOrigen.cantidad_disponible < pedido.cantidad) {
          throw new Error(`Stock insuficiente en el almacén de origen para entregar este pedido. Disponible: ${stockOrigen?.cantidad_disponible || 0}`);
        }

        await tx.stock.update({
          where: { id: stockOrigen.id },
          data: { cantidad_disponible: { decrement: pedido.cantidad } }
        });
      }

      const isEnCamino = nuevoEstado === 'en camino';
      const updateData: any = { estado: nuevoEstado };

      await tx.pedido.update({
        where: { id_pedido: parseInt(id_pedido) },
        data: updateData
      });

      // Disparar WhatsApp en segundo plano si es 'en camino'
      if (isEnCamino) {
        sendWhatsAppNotification(
          pedido.cliente.celular,
          pedido.cliente.nombres,
          pedido.cantidad,
          pedido.producto.tipo
        ).catch(e => console.error("Error enviando WA", e));
      }

      return { success: true };
    });
  } catch (error: any) {
    return { error: error.message || 'Error al actualizar el estado.' };
  } finally {
    revalidatePath('/dashboard/pedidos');
  }
}
